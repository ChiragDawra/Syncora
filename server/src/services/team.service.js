const { Team, User, Board, Task, Comment, Activity } = require('../models');
const AppError = require('../utils/AppError');
const activity = require('./activity.service');
const cache = require('../utils/cache');
const { removeFiles } = require('../utils/files');
const { runInTransaction } = require('../utils/transaction');

const MEMBER_FIELDS = 'name email avatarUrl';

async function create(userId, { name, description }) {
  const team = await Team.create({
    name,
    description,
    owner: userId,
    members: [{ user: userId, role: 'owner' }], // the creator is the owner
  });
  await activity.log({ team: team._id, actor: userId, action: 'team.created', meta: { name } });
  return team;
}

async function listMine(userId) {
  const teams = await Team.forUser(userId);
  return teams.map((t) => ({
    _id: t._id,
    name: t.name,
    description: t.description,
    memberCount: t.memberCount,
    myRole: t.getRole(userId),
    updatedAt: t.updatedAt,
    createdAt: t.createdAt,
  }));
}

async function getDetails(team, userId) {
  await team.populate('members.user', MEMBER_FIELDS);
  const json = team.toJSON();
  json.members = json.members.filter((m) => m.user); // skip members whose account was deleted
  json.myRole = team.getRole(userId);
  return json;
}

async function update(team, actorId, { name, description }) {
  if (name !== undefined) team.name = name;
  if (description !== undefined) team.description = description;
  await team.save();
  await activity.log({ team: team._id, actor: actorId, action: 'team.updated', meta: { name: team.name } });
  return getDetails(team, actorId);
}

async function addMember(team, actor, actorRole, { email, role = 'member' }) {
  if (role === 'admin' && actorRole !== 'owner') {
    throw new AppError('Only the owner can add an admin', 403, 'FORBIDDEN');
  }
  const user = await User.findByEmail(email);
  if (!user || !user.isActive) {
    throw new AppError('No registered user has this email', 404, 'NOT_FOUND', [{ field: 'email', message: 'User not found' }]);
  }
  if (team.getRole(user._id)) {
    throw new AppError('This user is already a member of the team', 409, 'ALREADY_MEMBER', [
      { field: 'email', message: 'Already a member' },
    ]);
  }
  team.members.push({ user: user._id, role });
  await team.save(); // schema validator caps members at 50
  await activity.log({ team: team._id, actor: actor._id, action: 'member.added', meta: { name: user.name, role } });
  await cache.invalidateTeam(team._id);
  return getDetails(team, actor._id);
}

async function changeRole(team, actor, targetUserId, role) {
  const member = team.members.find((m) => m.user.equals(targetUserId));
  if (!member) throw new AppError('This user is not a member of the team', 404, 'NOT_FOUND');
  if (member.role === 'owner') throw new AppError("The owner's role can't be changed", 400, 'VALIDATION_ERROR');
  const from = member.role;
  member.role = role;
  await team.save();
  const user = await User.findById(targetUserId).select('name');
  await activity.log({
    team: team._id,
    actor: actor._id,
    action: 'member.role_changed',
    meta: { name: user ? user.name : 'Unknown', from, to: role },
  });
  return getDetails(team, actor._id);
}

// Remove a member, or leave the team when target === actor. Ownership rules live here.
async function removeMember(team, actor, actorRole, targetUserId) {
  const member = team.members.find((m) => m.user.equals(targetUserId));
  if (!member) throw new AppError('This user is not a member of the team', 404, 'NOT_FOUND');

  const isSelf = actor._id.equals(targetUserId);
  if (member.role === 'owner') {
    if (isSelf) throw new AppError("The owner can't leave the team. Delete the team instead.", 400, 'OWNER_CANNOT_LEAVE');
    throw new AppError("The owner can't be removed", 403, 'FORBIDDEN');
  }
  if (!isSelf) {
    if (actorRole === 'member') throw new AppError('Only the owner or an admin can remove members', 403, 'FORBIDDEN');
    if (actorRole === 'admin' && member.role !== 'member') {
      throw new AppError('Admins can only remove members, not other admins', 403, 'FORBIDDEN');
    }
  }

  team.members = team.members.filter((m) => !m.user.equals(targetUserId));
  await team.save();
  // their assigned tasks in this team become unassigned
  await Task.updateMany({ team: team._id, assignee: targetUserId }, { $set: { assignee: null } });
  const user = await User.findById(targetUserId).select('name');
  await activity.log({
    team: team._id,
    actor: actor._id,
    action: 'member.removed',
    meta: { name: user ? user.name : 'Unknown', left: isSelf },
  });
  await cache.invalidateTeam(team._id);
  return { removed: true, left: isSelf };
}

// Cascade: boards, tasks, comments, activities, then files after the DB work succeeded
async function remove(team) {
  const teamId = team._id;
  const boardIds = (await Board.find({ team: teamId }).select('_id').lean()).map((b) => b._id);
  const tasks = await Task.find({ team: teamId }).select('attachments.fileName').lean();
  const fileNames = tasks.flatMap((t) => (t.attachments || []).map((a) => a.fileName));

  await runInTransaction(async (session) => {
    const opts = session ? { session } : {};
    await Comment.deleteMany({ team: teamId }, opts);
    await Task.deleteMany({ team: teamId }, opts);
    await Board.deleteMany({ team: teamId }, opts);
    await Activity.deleteMany({ team: teamId }, opts);
    await Team.deleteOne({ _id: teamId }, opts);
  });

  await removeFiles(fileNames);
  await cache.del(cache.keys.teamDashboard(teamId), ...boardIds.map((id) => cache.keys.boardStats(id)));
  return { deleted: true, boards: boardIds.length, tasks: tasks.length };
}

// Ids of every team the user belongs to (for "my tasks")
async function teamIdsFor(userId) {
  const teams = await Team.find({ 'members.user': userId }).select('_id').lean();
  return teams.map((t) => t._id);
}

module.exports = { create, listMine, getDetails, update, addMember, changeRole, removeMember, remove, teamIdsFor };
