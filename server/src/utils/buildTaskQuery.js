// Turn whitelisted query params into a Mongo filter and sort. Unknown keys are ignored and
// nothing from req.query is ever spread into the filter. Operators we build ourselves are
// wrapped in mongoose.trusted() so the global sanitizeFilter setting leaves them alone.
const mongoose = require('mongoose');

const { trusted } = mongoose;

const SORTS = {
  position: { position: 1, createdAt: 1 },
  createdAt: { createdAt: 1 },
  '-createdAt': { createdAt: -1 },
  dueDate: { dueDate: 1, createdAt: -1 },
  '-dueDate': { dueDate: -1, createdAt: -1 },
  priority: { priorityRank: -1, createdAt: -1 }, // urgent first
  '-priority': { priorityRank: 1, createdAt: -1 },
};

const csv = (v) => String(v).split(',').map((s) => s.trim()).filter(Boolean);

/**
 * @param {object} query   validated req.query
 * @param {object} base    fixed conditions, e.g. { board: boardId } or { assignee: userId }
 * @param {ObjectId} userId  the caller, for assignee=me
 */
function buildTaskQuery(query = {}, base = {}, userId = null) {
  const filter = { ...base };

  let statuses = query.status ? csv(query.status) : null;
  if (query.overdue === 'true') {
    statuses = (statuses || ['todo', 'in_progress', 'done']).filter((s) => s !== 'done');
  }
  if (statuses) filter.status = trusted({ $in: statuses });

  if (query.priority) filter.priority = trusted({ $in: csv(query.priority) });

  if (query.assignee === 'me') filter.assignee = userId;
  else if (query.assignee === 'none') filter.assignee = null;
  else if (query.assignee) filter.assignee = new mongoose.Types.ObjectId(query.assignee);

  if (query.label) filter.labels = String(query.label).trim();

  const due = {};
  if (query.overdue === 'true') due.$lt = new Date();
  if (query.dueBefore) due.$lte = new Date(query.dueBefore);
  if (query.dueAfter) due.$gte = new Date(query.dueAfter);
  if (Object.keys(due).length) filter.dueDate = trusted(due);

  let sort = SORTS[query.sort] || null;
  let projection = null;
  if (query.q && String(query.q).trim()) {
    filter.$text = trusted({ $search: String(query.q).trim() });
    projection = { score: { $meta: 'textScore' } };
    // best match first unless the user picked a sort
    if (!sort) sort = { score: { $meta: 'textScore' } };
  }
  if (!sort) sort = SORTS['-createdAt'];

  return { filter, sort, projection };
}

module.exports = { buildTaskQuery, SORTS };
