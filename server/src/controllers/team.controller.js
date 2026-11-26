const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/ApiResponse');
const teamService = require('../services/team.service');
const activityService = require('../services/activity.service');

exports.create = asyncHandler(async (req, res) => {
  const team = await teamService.create(req.user._id, { name: req.body.name, description: req.body.description });
  created(res, { team: await teamService.getDetails(team, req.user._id) });
});

exports.listMine = asyncHandler(async (req, res) => ok(res, await teamService.listMine(req.user._id)));

exports.get = asyncHandler(async (req, res) => ok(res, { team: await teamService.getDetails(req.team, req.user._id) }));

exports.update = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  ok(res, { team: await teamService.update(req.team, req.user._id, { name, description }) });
});

exports.remove = asyncHandler(async (req, res) => ok(res, await teamService.remove(req.team)));

exports.addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  created(res, { team: await teamService.addMember(req.team, req.user, req.membership.role, { email, role }) });
});

exports.changeRole = asyncHandler(async (req, res) => {
  ok(res, { team: await teamService.changeRole(req.team, req.user, req.params.userId, req.body.role) });
});

exports.removeMember = asyncHandler(async (req, res) => {
  ok(res, await teamService.removeMember(req.team, req.user, req.membership.role, req.params.userId));
});

exports.activity = asyncHandler(async (req, res) => {
  const { items, meta } = await activityService.listForTeam(req.team._id, req.query);
  ok(res, items, meta);
});
