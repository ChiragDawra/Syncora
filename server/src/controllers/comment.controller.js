const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/ApiResponse');
const commentService = require('../services/comment.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await commentService.list(req.task, req.query);
  ok(res, items, meta);
});

exports.create = asyncHandler(async (req, res) => {
  created(res, { comment: await commentService.create(req.task, req.user, req.body.text) });
});

exports.update = asyncHandler(async (req, res) => {
  ok(res, { comment: await commentService.update(req.comment, req.user, req.body.text) });
});

exports.remove = asyncHandler(async (req, res) => ok(res, await commentService.remove(req.comment, req.user, req.membership.role)));
