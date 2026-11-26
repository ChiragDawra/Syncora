const { api, auth, createTeamWithMembers, createTask } = require('./helpers');

describe('Stats (aggregation)', () => {
  test('TC-36 board stats: totals by status and priority, overdue, completion rate', async () => {
    const { owner, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id, { title: 'Overdue one', dueDate: '2020-01-01', priority: 'urgent' });
    await createTask(owner.token, board._id, { title: 'In progress', status: 'in_progress', priority: 'high' });
    await createTask(owner.token, board._id, { title: 'Done late', status: 'done', dueDate: '2020-01-01' });
    await createTask(owner.token, board._id, { title: 'Done two', status: 'done' });
    const res = await api().get(`/api/boards/${board._id}/stats`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      total: 4,
      byStatus: { todo: 1, in_progress: 1, done: 2 },
      byPriority: { low: 0, medium: 2, high: 1, urgent: 1 },
      overdue: 1,
      completionRate: 50,
      cached: false,
    });
  });

  test('US-14 dashboard: workload per member sorted, unassigned as null, completed per day', async () => {
    const { owner, member, team, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id, { title: 'Member one', assignee: member.user._id, priority: 'urgent' });
    await createTask(owner.token, board._id, { title: 'Member two', assignee: member.user._id, dueDate: '2020-01-01' });
    await createTask(owner.token, board._id, { title: 'Owner one', assignee: owner.user._id });
    await createTask(owner.token, board._id, { title: 'Nobody' });
    await createTask(owner.token, board._id, { title: 'Done now', status: 'done', assignee: owner.user._id });
    const soon = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString();
    await createTask(owner.token, board._id, { title: 'Due soon', dueDate: soon, assignee: owner.user._id });

    const res = await api().get(`/api/teams/${team._id}/dashboard`).set(auth(member.token));
    expect(res.status).toBe(200);
    const { workload, dueSoon, completedPerDay, totals } = res.body.data;
    expect(workload.find((w) => w.user && w.user.name === 'Member')).toMatchObject({ open: 2, overdue: 1, urgent: 1 });
    expect(workload.map((w) => w.open)).toEqual([2, 2, 1]);
    expect(workload.find((w) => w.user === null).open).toBe(1);
    expect(dueSoon.map((t) => t.title)).toEqual(['Due soon']);
    expect(completedPerDay).toHaveLength(14);
    expect(completedPerDay[13].done).toBe(1);
    expect(totals).toEqual({ total: 6, open: 5, done: 1, overdue: 1 });
  });

  test('outsider gets 403 on stats and dashboard', async () => {
    const { outsider, team, board } = await createTeamWithMembers();
    expect((await api().get(`/api/boards/${board._id}/stats`).set(auth(outsider.token))).status).toBe(403);
    expect((await api().get(`/api/teams/${team._id}/dashboard`).set(auth(outsider.token))).status).toBe(403);
  });
});
