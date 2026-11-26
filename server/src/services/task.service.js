const mongoose = require('mongoose');
const { Task, Comment } = require('../models');
const AppError = require('../utils/AppError');
const activity = require('./activity.service');
const { teamIdsFor } = require('./team.service');
const cache = require('../utils/cache');
const { removeFiles } = require('../utils/files');
const { parsePagination, buildMeta } = require('../utils/pagination');
const { buildTaskQuery } = require('../utils/buildTaskQuery');

const { trusted } = mongoose;
const ASSIGNEE = { path: 'assignee', select: 'name email avatarUrl' };
const EDITABLE = ['title', 'description', 'priority', 'assignee', 'dueDate', 'labels'];

// Shape a task (document or lean object) for the API: adds isOverdue and counts
function toDto(task, commentCount) {
  const t = typeof task.toJSON === 'function' ? task.toJSON() : { ...task };
  delete t.__v;
  delete t.id;
  t.isOverdue = !!t.dueDate && t.status !== 'done' && new Date(t.dueDate) < new Date();
  t.attachmentCount = (t.attachments || []).length;
  if (commentCount !== undefined) t.commentCount = commentCount;
  return t;
}

async function commentCounts(taskIds) {
  if (!taskIds.length) return new Map();
  const rows = await Comment.aggregate([
    { $match: { task: { $in: taskIds } } },
    { $group: { _id: '$task', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

// Business rule: the assignee must be a member of the task's team
function assertAssignee(team, assigneeId) {
  if (assigneeId && !team.getRole(assigneeId)) {
    throw new AppError('Assignee is not a member of this team', 400, 'VALIDATION_ERROR', [
      { field: 'assignee', message: 'Pick a member of this team' },
    ]);
  }
}

const invalidate = (task) => cache.invalidateTeam(task.team, task.board);

async function create(board, team, user, body) {
  assertAssignee(team, body.assignee);
  const status = body.status || 'todo';
  // new task goes to the end of its column
  const last = await Task.findOne({ board: board._id, status }).sort({ position: -1 }).select('position').lean();

  const task = await Task.create({
    board: board._id,
    team: board.team, // denormalized from the board, never from the client
    title: body.title,
    description: body.description,
    status,
    priority: body.priority,
    assignee: body.assignee || null,
    dueDate: body.dueDate || null,
    labels: body.labels || [],
    position: last ? last.position + 1 : 0,
    createdBy: user._id,
  });
  await task.populate([ASSIGNEE, { path: 'createdBy', select: 'name avatarUrl' }]);

  await activity.log({ team: task.team, board: board._id, task: task._id, actor: user._id, action: 'task.created', meta: { title: task.title } });
  await invalidate(task);
  return toDto(task, 0);
}

async function runList(filter, sort, projection, query, populate) {
  const pg = parsePagination(query);
  // find + count in parallel; lean() for read-only lists
  const [items, total] = await Promise.all([
    Task.find(filter, projection).sort(sort).skip(pg.skip).limit(pg.limit).populate(populate).lean(),
    Task.countDocuments(filter),
  ]);
  const counts = await commentCounts(items.map((t) => t._id));
  return { items: items.map((t) => toDto(t, counts.get(String(t._id)) || 0)), meta: buildMeta(pg, total) };
}

async function listForBoard(board, query, userId) {
  const { filter, sort, projection } = buildTaskQuery(query, { board: board._id }, userId);
  return runList(filter, sort, projection, query, [ASSIGNEE]);
}

// Tasks assigned to me across all my teams
async function listMine(userId, query) {
  const teamIds = await teamIdsFor(userId);
  const base = { assignee: userId, team: trusted({ $in: teamIds }) };
  const { filter, sort, projection } = buildTaskQuery({ sort: 'dueDate', ...query }, base, userId);
  return runList(filter, sort, projection, query, [
    ASSIGNEE,
    { path: 'board', select: 'name color' },
    { path: 'team', select: 'name' },
  ]);
}

async function getOne(task) {
  await task.populate([
    ASSIGNEE,
    { path: 'createdBy', select: 'name avatarUrl' },
    { path: 'board', select: 'name color' },
    { path: 'attachments.uploadedBy', select: 'name' },
  ]);
  const count = await Comment.countDocuments({ task: task._id });
  return toDto(task, count);
}

async function update(task, team, user, changes) {
  if (changes.assignee !== undefined) assertAssignee(team, changes.assignee);
  const changed = [];
  EDITABLE.forEach((key) => {
    if (changes[key] === undefined) return;
    task[key] = key === 'dueDate' || key === 'assignee' ? changes[key] || null : changes[key];
    if (task.isModified(key)) changed.push(key);
  });
  await task.save();

  if (changed.length) {
    await activity.log({ team: task.team, board: task.board, task: task._id, actor: user._id, action: 'task.updated', meta: { title: task.title, fields: changed } });
    await invalidate(task);
  }
  return getOne(task);
}

/**
 * Move a task to a column and position. `position` is the slot in the target column as the
 * client saw it before the move (the position of the card it is dropped in front of).
 * Omit it to put the task at the end of the column. Columns stay numbered 0..n-1.
 */
async function move(task, user, { status, position }) {
  const from = task.status;
  const oldPos = task.position;
  const notThis = trusted({ $ne: task._id });

  // 1. close the gap in the source column
  await Task.updateMany(
    { board: task.board, status: from, position: trusted({ $gt: oldPos }), _id: notThis },
    { $inc: { position: -1 } }
  );

  // 2. work out the new slot in the target column
  const count = await Task.countDocuments({ board: task.board, status, _id: notThis });
  let newPos = position === undefined ? count : position;
  if (position !== undefined && status === from && position > oldPos) newPos -= 1; // the gap above closed
  newPos = Math.max(0, Math.min(newPos, count));

  // 3. make room: shift tasks at or after the new slot down by one
  await Task.updateMany(
    { board: task.board, status, position: trusted({ $gte: newPos }), _id: notThis },
    { $inc: { position: 1 } }
  );

  task.status = status;
  task.position = newPos;
  await task.save(); // pre('save') sets or clears completedAt

  if (from !== status) {
    await activity.log({ team: task.team, board: task.board, task: task._id, actor: user._id, action: 'task.moved', meta: { title: task.title, from, to: status } });
  }
  await invalidate(task);
  return getOne(task);
}

async function remove(task, user, role) {
  // ownership check: members may only delete tasks they created
  if (role === 'member' && !task.createdBy.equals(user._id)) {
    throw new AppError('Only the task creator, an admin or the owner can delete this task', 403, 'FORBIDDEN');
  }
  const fileNames = task.attachments.map((a) => a.fileName);
  await task.deleteOne(); // pre('deleteOne') hook deletes the comments
  await Task.updateMany(
    { board: task.board, status: task.status, position: trusted({ $gt: task.position }) },
    { $inc: { position: -1 } }
  );
  await removeFiles(fileNames);
  await activity.log({ team: task.team, board: task.board, actor: user._id, action: 'task.deleted', meta: { title: task.title } });
  await invalidate(task);
  return { deleted: true };
}

module.exports = { create, listForBoard, listMine, getOne, update, move, remove, toDto };
