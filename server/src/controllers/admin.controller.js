const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const adminService = require('../services/admin.service');

exports.listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers(req.query);
  ok(res, items, meta);
});

exports.stats = asyncHandler(async (req, res) => ok(res, await adminService.stats()));
