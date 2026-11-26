const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/ApiResponse');
const boardService = require('../services/board.service');

exports.create = asyncHandler(async (req, res) => {
  const { name, description, color } = req.body;
  const board = await boardService.create(req.team._id, req.user._id, { name, description, color });
  created(res, { board: await boardService.get(board) });
});

exports.listForTeam = asyncHandler(async (req, res) => {
  ok(res, await boardService.listForTeam(req.team._id, { archived: req.query.archived }));
});

exports.get = asyncHandler(async (req, res) => ok(res, { board: await boardService.get(req.board) }));

exports.update = asyncHandler(async (req, res) => {
  const { name, description, color, archived } = req.body;
  ok(res, { board: await boardService.update(req.board, req.user._id, { name, description, color, archived }) });
});

exports.remove = asyncHandler(async (req, res) => ok(res, await boardService.remove(req.board, req.user._id)));
