const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/ApiResponse');
const taskService = require('../services/task.service');

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

exports.create = asyncHandler(async (req, res) => {
  const body = pick(req.body, ['title', 'description', 'status', 'priority', 'assignee', 'dueDate', 'labels']);
  created(res, { task: await taskService.create(req.board, req.membership.team, req.user, body) });
});

exports.listForBoard = asyncHandler(async (req, res) => {
  const { items, meta } = await taskService.listForBoard(req.board, req.query, req.user._id);
  ok(res, items, meta);
});

exports.listMine = asyncHandler(async (req, res) => {
  const { items, meta } = await taskService.listMine(req.user._id, req.query);
  ok(res, items, meta);
});

exports.get = asyncHandler(async (req, res) => ok(res, { task: await taskService.getOne(req.task) }));

exports.update = asyncHandler(async (req, res) => {
  const changes = pick(req.body, ['title', 'description', 'priority', 'assignee', 'dueDate', 'labels']);
  ok(res, { task: await taskService.update(req.task, req.membership.team, req.user, changes) });
});

exports.move = asyncHandler(async (req, res) => {
  const { status, position } = req.body;
  ok(res, { task: await taskService.move(req.task, req.user, { status, position }) });
});

exports.remove = asyncHandler(async (req, res) => ok(res, await taskService.remove(req.task, req.user, req.membership.role)));
