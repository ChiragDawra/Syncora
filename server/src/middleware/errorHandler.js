const mongoose = require('mongoose');
const multer = require('multer');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const env = require('../config/env');

// Translate any thrown error into an AppError with the right status and code
function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError('Invalid input', 400, 'VALIDATION_ERROR', details);
  }
  if (err instanceof mongoose.Error.CastError) {
    return new AppError(`Invalid ${err.path}: ${err.value}`, 400, 'INVALID_ID');
  }
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyValue || err.keyPattern || {}).pop() || 'field';
    return new AppError(`A record with this ${field} already exists`, 409, 'DUPLICATE', [
      { field, message: `${field} is already taken` },
    ]);
  }
  if (err.name === 'TokenExpiredError') return new AppError('Session expired, please log in again', 401, 'TOKEN_EXPIRED');
  if (err.name === 'JsonWebTokenError') return new AppError('Invalid token', 401, 'INVALID_TOKEN');

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return new AppError('File is too large', 413, 'FILE_TOO_LARGE');
    if (err.code === 'LIMIT_FILE_COUNT') return new AppError('Too many files (max 5 per upload)', 400, 'VALIDATION_ERROR');
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return new AppError(`Unexpected file field "${err.field}"`, 400, 'VALIDATION_ERROR');
    }
    return new AppError(err.message, 400, 'VALIDATION_ERROR');
  }

  // body-parser errors (express.json)
  if (err.type === 'entity.too.large') return new AppError('Request body is too large', 413, 'PAYLOAD_TOO_LARGE');
  if (err.type === 'entity.parse.failed') return new AppError('Malformed JSON body', 400, 'VALIDATION_ERROR');

  const unknown = new AppError('Something went wrong', 500, 'INTERNAL_ERROR');
  unknown.original = err;
  return unknown;
}

// Central error handler: 4 arguments, registered last in app.js
 
function errorHandler(err, req, res, _next) {
  const appErr = normalize(err);
  const logMeta = { requestId: req.id, method: req.method, url: req.originalUrl, code: appErr.code };

  if (appErr.statusCode >= 500) {
    const original = appErr.original || err;
    logger.error(original.message, { ...logMeta, stack: original.stack });
  } else {
    logger.warn(appErr.message, logMeta);
  }

  const body = {
    success: false,
    error: { code: appErr.code, message: appErr.message, details: appErr.details || [] },
    requestId: req.id,
  };
  // stack traces only outside production, and only for unexpected errors
  if (!env.isProd && appErr.statusCode >= 500 && (appErr.original || err).stack) {
    body.error.stack = (appErr.original || err).stack;
  }
  res.status(appErr.statusCode).json(body);
}

module.exports = errorHandler;
