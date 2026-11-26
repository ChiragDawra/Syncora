// Read and check environment variables once at startup, export a frozen object.
// Every other file reads config from here, never from process.env directly.
require('dotenv').config({ quiet: true });

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  // logger depends on env, so plain console here is intentional
  console.error(`Missing env vars: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters');
  process.exit(1);
}

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB) || 5,
  logLevel: process.env.LOG_LEVEL || 'info',
  redisUrl: process.env.REDIS_URL || '',
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
});
