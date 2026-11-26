const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/ApiResponse');
const attachmentService = require('../services/attachment.service');

exports.upload = asyncHandler(async (req, res) => {
  created(res, { attachments: await attachmentService.add(req.task, req.user, req.files) });
});

exports.remove = asyncHandler(async (req, res) => {
  ok(res, await attachmentService.remove(req.task, req.user, req.membership.role, req.params.attachmentId));
});
