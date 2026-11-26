const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const statsService = require('../services/stats.service');

exports.boardStats = asyncHandler(async (req, res) => ok(res, await statsService.boardStats(req.board._id)));

exports.teamDashboard = asyncHandler(async (req, res) => ok(res, await statsService.teamDashboard(req.team._id)));
