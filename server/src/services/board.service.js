const mongoose = require('mongoose');
const { Board, Task, Comment } = require('../models');
const activity = require('./activity.service');
const cache = require('../utils/cache');
const { removeFiles } = require('../utils/files');
const { runInTransaction } = require('../utils/transaction');

async function create(teamId, userId, { name, description, color }) {
  const board = await Board.create({ team: teamId, name, description, color, createdBy: userId });
  await activity.log({ team: teamId, board: board._id, actor: userId, action: 'board.created', meta: { name } });
  return board;
}

async function listForTeam(teamId, { archived = 'false' } = {}) {
  const filter = { team: teamId };
  if (archived !== 'all') filter.archived = archived === 'true';
  // virtual populate with count: true adds taskCount without loading tasks
  const boards = await Board.find(filter).sort({ createdAt: -1 }).populate('taskCount');
  return boards.map((b) => b.toJSON());
}

async function get(board) {
  await board.populate('taskCount');
  return board.toJSON();
}

async function update(board, userId, changes) {
  const before = { name: board.name, archived: board.archived };
  ['name', 'description', 'color', 'archived'].forEach((key) => {
    if (changes[key] !== undefined) board[key] = changes[key];
  });
  await board.save();
  await activity.log({
    team: board.team,
    board: board._id,
    actor: userId,
    action: 'board.updated',
    meta: { name: board.name, ...(before.name !== board.name && { renamedFrom: before.name }), ...(before.archived !== board.archived && { archived: board.archived }) },
  });
  return get(board);
}

// Cascade: tasks, their comments, then files
async function remove(board, userId) {
  const tasks = await Task.find({ board: board._id }).select('_id attachments.fileName').lean();
  const taskIds = tasks.map((t) => t._id);
  const fileNames = tasks.flatMap((t) => (t.attachments || []).map((a) => a.fileName));

  await runInTransaction(async (session) => {
    const opts = session ? { session } : {};
    await Comment.deleteMany({ task: mongoose.trusted({ $in: taskIds }) }, opts);
    await Task.deleteMany({ board: board._id }, opts);
    await Board.deleteOne({ _id: board._id }, opts);
  });

  await removeFiles(fileNames);
  await activity.log({ team: board.team, actor: userId, action: 'board.deleted', meta: { name: board.name, tasks: taskIds.length } });
  await cache.invalidateTeam(board.team, board._id);
  return { deleted: true, tasks: taskIds.length };
}

module.exports = { create, listForTeam, get, update, remove };
