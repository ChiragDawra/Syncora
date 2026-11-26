// Aggregation pipelines (unit 5) behind a cache-aside layer (unit 8).
const mongoose = require('mongoose');
const { Task } = require('../models');
const cache = require('../utils/cache');

const { STATUSES, PRIORITIES } = Task;
const TZ = 'Asia/Kolkata';
const DAY = 24 * 60 * 60 * 1000;
const toId = (id) => new mongoose.Types.ObjectId(String(id)); // aggregate() does not cast types

const zeroed = (keys) => Object.fromEntries(keys.map((k) => [k, 0]));
const countsToObject = (rows, keys) => rows.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), zeroed(keys));

async function computeBoardStats(boardId) {
  const [res] = await Task.aggregate([
    { $match: { board: toId(boardId) } },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
        overdue: [{ $match: { status: { $ne: 'done' }, dueDate: { $ne: null, $lt: new Date() } } }, { $count: 'count' }],
        total: [{ $count: 'count' }],
      },
    },
  ]);
  const total = res.total[0] ? res.total[0].count : 0;
  const byStatus = countsToObject(res.byStatus, STATUSES);
  return {
    total,
    byStatus,
    byPriority: countsToObject(res.byPriority, PRIORITIES),
    overdue: res.overdue[0] ? res.overdue[0].count : 0,
    completionRate: total ? Math.round((byStatus.done / total) * 100) : 0,
  };
}

function boardStats(boardId) {
  return cache.getOrSet(cache.keys.boardStats(boardId), cache.TTL_SECONDS, () => computeBoardStats(boardId));
}

const dayKey = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d); // YYYY-MM-DD

async function computeDashboard(teamId) {
  const team = toId(teamId);
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 13 * DAY);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const [workload, dueSoon, completed, totalsRows] = await Promise.all([
    // open tasks per assignee, with overdue and urgent counts
    Task.aggregate([
      { $match: { team, status: { $ne: 'done' } } },
      {
        $group: {
          _id: '$assignee',
          open: { $sum: 1 },
          overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$dueDate', null] }, { $lt: ['$dueDate', now] }] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user', pipeline: [{ $project: { name: 1, email: 1, avatarUrl: 1 } }] } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }, // null assignee = "Unassigned"
      { $sort: { open: -1 } },
      { $project: { _id: 0, user: { $ifNull: ['$user', null] }, open: 1, overdue: 1, urgent: 1 } },
    ]),
    // due in the next 7 days, not done
    Task.find({ team, status: mongoose.trusted({ $ne: 'done' }), dueDate: mongoose.trusted({ $gte: now, $lte: new Date(now.getTime() + 7 * DAY) }) })
      .sort({ dueDate: 1 })
      .limit(20)
      .select('title dueDate priority status assignee board')
      .populate('assignee', 'name avatarUrl')
      .populate('board', 'name color')
      .lean(),
    // tasks completed per day, last 14 days
    Task.aggregate([
      { $match: { team, completedAt: { $gte: fourteenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt', timezone: TZ } }, done: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Task.aggregate([
      { $match: { team } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          overdue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'done'] }, { $ne: ['$dueDate', null] }, { $lt: ['$dueDate', now] }] }, 1, 0] } },
        },
      },
    ]),
  ]);

  // fill missing days with 0 so the chart has 14 bars
  const doneByDay = new Map(completed.map((r) => [r._id, r.done]));
  const completedPerDay = Array.from({ length: 14 }, (_, i) => {
    const date = dayKey(new Date(now.getTime() - (13 - i) * DAY));
    return { date, done: doneByDay.get(date) || 0 };
  });

  const t = totalsRows[0] || { total: 0, done: 0, overdue: 0 };
  return {
    totals: { total: t.total, open: t.total - t.done, done: t.done, overdue: t.overdue },
    workload,
    dueSoon,
    completedPerDay,
  };
}

function teamDashboard(teamId) {
  return cache.getOrSet(cache.keys.teamDashboard(teamId), cache.TTL_SECONDS, () => computeDashboard(teamId));
}

module.exports = { boardStats, teamDashboard };
