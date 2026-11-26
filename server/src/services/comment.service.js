const { Comment } = require('../models');
const AppError = require('../utils/AppError');
const activity = require('./activity.service');
const { parsePagination, buildMeta } = require('../utils/pagination');

const AUTHOR = { path: 'author', select: 'name avatarUrl' };

async function list(task, query) {
  const pg = parsePagination(query);
  const filter = { task: task._id };
  const [items, total] = await Promise.all([
    Comment.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).populate(AUTHOR).lean(),
    Comment.countDocuments(filter),
  ]);
  return { items, meta: buildMeta(pg, total) };
}

async function create(task, user, text) {
  const comment = await Comment.create({ task: task._id, team: task.team, author: user._id, text });
  await comment.populate(AUTHOR);
  await activity.log({
    team: task.team,
    board: task.board,
    task: task._id,
    actor: user._id,
    action: 'comment.added',
    meta: { title: task.title, excerpt: text.slice(0, 80) },
  });
  return comment;
}

async function update(comment, user, text) {
  // ownership check: only the author edits
  if (!comment.author.equals(user._id)) throw new AppError('You can only edit your own comments', 403, 'FORBIDDEN');
  comment.text = text;
  comment.edited = true;
  await comment.save();
  await comment.populate(AUTHOR);
  return comment;
}

async function remove(comment, user, role) {
  if (role === 'member' && !comment.author.equals(user._id)) {
    throw new AppError('Only the author, an admin or the owner can delete this comment', 403, 'FORBIDDEN');
  }
  await comment.deleteOne();
  return { deleted: true };
}

module.exports = { list, create, update, remove };
