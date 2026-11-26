// Resource loaders: find the document from the URL param, 404 if missing, and attach it to req.
// Each one also tells requireTeamRole which team the resource belongs to (req.teamId).
const mongoose = require('mongoose');
const { Team, Board, Task, Comment } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

function checkId(id, label) {
  if (!mongoose.isValidObjectId(id) || String(id).length !== 24) {
    throw new AppError(`Invalid ${label} id`, 400, 'INVALID_ID');
  }
}

const loadTeam = asyncHandler(async (req, _res, next) => {
  checkId(req.params.teamId, 'team');
  const team = await Team.findById(req.params.teamId);
  if (!team) throw new AppError('Team not found', 404, 'NOT_FOUND');
  req.team = team;
  req.teamId = team._id;
  next();
});

const loadBoard = asyncHandler(async (req, _res, next) => {
  checkId(req.params.boardId, 'board');
  const board = await Board.findById(req.params.boardId);
  if (!board) throw new AppError('Board not found', 404, 'NOT_FOUND');
  req.board = board;
  req.teamId = board.team;
  next();
});

const loadTask = asyncHandler(async (req, _res, next) => {
  checkId(req.params.taskId, 'task');
  const task = await Task.findById(req.params.taskId);
  if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
  req.task = task;
  req.teamId = task.team;
  next();
});

const loadComment = asyncHandler(async (req, _res, next) => {
  checkId(req.params.commentId, 'comment');
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) throw new AppError('Comment not found', 404, 'NOT_FOUND');
  req.comment = comment;
  req.teamId = comment.team;
  next();
});

module.exports = { loadTeam, loadBoard, loadTask, loadComment };
