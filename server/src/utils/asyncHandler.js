// Express 4 does not catch rejected promises. Wrap every async handler so errors reach errorHandler.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
