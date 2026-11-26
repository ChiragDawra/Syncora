// Controllers stay thin: read req, call a service, send the response.
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/ApiResponse');
const AppError = require('../utils/AppError');
const authService = require('../services/auth.service');
const { relativeName } = require('../middleware/upload');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  created(res, await authService.register({ name, email, password }));
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  ok(res, await authService.login({ email, password }));
});

exports.me = (req, res) => ok(res, { user: req.user });

exports.updateMe = asyncHandler(async (req, res) => {
  ok(res, { user: await authService.updateMe(req.user, { name: req.body.name }) });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image in the "avatar" field', 400, 'VALIDATION_ERROR');
  ok(res, { user: await authService.setAvatar(req.user, relativeName(req.file)) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  ok(res, await authService.changePassword(req.user._id, { currentPassword, newPassword }));
});
