const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

// protect: "who are you?" Verify the Bearer JWT and load req.user (password excluded).
const protect = asyncHandler(async (req, _res, next) => {
  const header = req.get('Authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Please log in to continue', 401, 'NO_TOKEN');

  const payload = verifyToken(token); // throws JsonWebTokenError / TokenExpiredError -> 401 in errorHandler
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError('This account no longer exists', 401, 'INVALID_TOKEN');

  req.user = user;
  next();
});

// restrictTo: platform roles (user.role), e.g. restrictTo('admin') for /api/admin
const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) return next(new AppError('You do not have permission to do this', 403, 'FORBIDDEN'));
    return next();
  };

module.exports = { protect, restrictTo };
