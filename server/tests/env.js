const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.MONGODB_URI = 'mongodb://unused-in-tests';
process.env.REDIS_URL = '';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), 'syncora-test-uploads');
process.env.AUTH_RATE_LIMIT_MAX = '100000'; // TC-06 tests the limiter separately with max 10
