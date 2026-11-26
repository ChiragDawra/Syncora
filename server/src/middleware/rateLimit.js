const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const handler = (req, res) =>
  res.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later', details: [] },
    requestId: req.id,
  });

// Factory so tests can build a limiter with a small max
const createLimiter = (max, options = {}) =>
  rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, handler, ...options });

// Brute-force guard on login/register: 10 failed attempts per 15 min per IP.
// Successful logins don't count, so a demo can log in and out freely.
const authLimiter = createLimiter(env.authRateLimitMax, { skipSuccessfulRequests: true });
// Everything else: 300 per 15 min per IP (off in tests)
const apiLimiter = env.isTest ? (_req, _res, next) => next() : createLimiter(300);

module.exports = { authLimiter, apiLimiter, createLimiter };
