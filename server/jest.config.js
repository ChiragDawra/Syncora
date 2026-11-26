module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.js'], // env vars before any module loads
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], // in-memory MongoDB per test file
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/config/redis.js'],
};
