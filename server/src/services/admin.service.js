const mongoose = require('mongoose');
const { User, Team, Board, Task } = require('../models');
const { parsePagination, buildMeta } = require('../utils/pagination');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function listUsers(query) {
  const pg = parsePagination(query);
  const filter = {};
  if (query.q) {
    const rx = mongoose.trusted({ $regex: escapeRegex(query.q), $options: 'i' });
    filter.$or = [{ name: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    User.countDocuments(filter),
  ]);
  return { items: items.map(({ password, __v, ...u }) => u), meta: buildMeta(pg, total) };
}

async function stats() {
  const [users, teams, boards, tasks] = await Promise.all([
    User.countDocuments(),
    Team.countDocuments(),
    Board.countDocuments(),
    Task.countDocuments(),
  ]);
  return { users, teams, boards, tasks };
}

module.exports = { listUsers, stats };
