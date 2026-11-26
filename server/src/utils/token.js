const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Payload holds only the user id (sub). HS256, secret from env, 7 day expiry by default.
function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn, algorithm: 'HS256' });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
