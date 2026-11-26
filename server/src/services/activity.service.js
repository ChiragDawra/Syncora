const { Activity } = require('../models');
const logger = require('../utils/logger');
const { parsePagination, buildMeta } = require('../utils/pagination');

// Record an action. A logging failure must never fail the user's request, so errors are swallowed.
async function log({ team, board, task, actor, action, meta = {} }) {
  try {
    await Activity.create({ team, board, task, actor, action, meta });
  } catch (err) {
    logger.warn('activity log failed', { action, err: err.message });
  }
}

async function listForTeam(teamId, query) {
  const pg = parsePagination(query);
  const filter = { team: teamId };
  const [items, total] = await Promise.all([
    Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .populate('actor', 'name avatarUrl')
      .populate('task', 'title')
      .populate('board', 'name')
      .lean(),
    Activity.countDocuments(filter),
  ]);
  return { items, meta: buildMeta(pg, total) };
}

module.exports = { log, listForTeam };
