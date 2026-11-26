// ETE (unit 8): optional Redis client. Exports null when REDIS_URL is empty, so caching is off
// and every cache call falls straight through to MongoDB.
const env = require('./env');
const logger = require('../utils/logger');

let redis = null;

if (env.redisUrl && !env.isTest) {
  const Redis = require('ioredis');
  redis = new Redis(env.redisUrl, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: false });
  redis.on('connect', () => logger.info('Redis connected'));
  redis.on('error', (err) => logger.warn('Redis error', { err: err.message }));
}

module.exports = redis;
