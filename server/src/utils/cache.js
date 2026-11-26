// Cache-aside helper (unit 8). No-op when Redis is off; Redis errors are logged, never thrown,
// so the API keeps working from MongoDB if Redis goes down.
const redis = require('../config/redis');
const logger = require('./logger');

const TTL_SECONDS = 60;
const keys = {
  boardStats: (boardId) => `board:${boardId}:stats`,
  teamDashboard: (teamId) => `team:${teamId}:dashboard`,
};

async function getOrSet(key, ttlSeconds, fetchFn) {
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) return { ...JSON.parse(hit), cached: true };
    } catch (err) {
      logger.warn('cache get failed', { key, err: err.message });
    }
  }
  const fresh = await fetchFn();
  if (redis) {
    redis
      .set(key, JSON.stringify(fresh), 'EX', ttlSeconds)
      .catch((err) => logger.warn('cache set failed', { key, err: err.message }));
  }
  return { ...fresh, cached: false };
}

async function del(...cacheKeys) {
  const list = cacheKeys.filter(Boolean);
  if (!redis || !list.length) return;
  try {
    await redis.del(...list);
  } catch (err) {
    logger.warn('cache del failed', { keys: list, err: err.message });
  }
}

// Every task or member write in a team calls this.
function invalidateTeam(teamId, boardId) {
  return del(keys.teamDashboard(teamId), boardId ? keys.boardStats(boardId) : null);
}

module.exports = { getOrSet, del, invalidateTeam, keys, TTL_SECONDS };
