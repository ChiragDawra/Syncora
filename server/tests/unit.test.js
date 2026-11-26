const mongoose = require('mongoose');
const { buildTaskQuery } = require('../src/utils/buildTaskQuery');
const { parsePagination, buildMeta } = require('../src/utils/pagination');

describe('parsePagination', () => {
  test('defaults, minimums and the 100 cap', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 });
    expect(parsePagination({ page: '-4', limit: '1000' })).toEqual({ page: 1, limit: 100, skip: 0 });
  });
  test('buildMeta', () => {
    expect(buildMeta({ page: 1, limit: 5 }, 12)).toEqual({ page: 1, limit: 5, total: 12, totalPages: 3, hasNext: true });
    expect(buildMeta({ page: 1, limit: 5 }, 0)).toEqual({ page: 1, limit: 5, total: 0, totalPages: 1, hasNext: false });
  });
});

describe('buildTaskQuery', () => {
  const me = new mongoose.Types.ObjectId();

  test('ignores unknown keys and maps assignee=me', () => {
    const { filter, sort } = buildTaskQuery({ assignee: 'me', password: 'x', $where: '1' }, { board: 'b' }, me);
    expect(Object.keys(filter).sort()).toEqual(['assignee', 'board']);
    expect(filter.assignee).toBe(me);
    expect(sort).toEqual({ createdAt: -1 });
  });

  test('overdue drops done from the status list and adds a dueDate bound', () => {
    const { filter } = buildTaskQuery({ status: 'todo,done', overdue: 'true' }, {}, me);
    expect(filter.status.$in).toEqual(['todo']);
    expect(filter.dueDate.$lt).toBeInstanceOf(Date);
  });

  test('q adds $text and sorts by text score unless a sort is given', () => {
    const a = buildTaskQuery({ q: 'login' });
    expect(a.filter.$text.$search).toBe('login');
    expect(a.sort).toEqual({ score: { $meta: 'textScore' } });
    const b = buildTaskQuery({ q: 'login', sort: 'dueDate' });
    expect(b.sort).toEqual({ dueDate: 1, createdAt: -1 });
  });

  test('assignee=none means unassigned', () => {
    expect(buildTaskQuery({ assignee: 'none' }).filter.assignee).toBeNull();
  });
});
