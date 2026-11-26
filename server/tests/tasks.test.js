const { api, auth, createTeamWithMembers, createTask } = require('./helpers');
const { Task, Activity } = require('../src/models');

const titles = (res) => res.body.data.map((t) => t.title);

describe('Tasks', () => {
  test('TC-21 create: 201, position at end of column, activity logged', async () => {
    const { member, board } = await createTeamWithMembers();
    const a = await createTask(member.token, board._id, { title: 'First' });
    const b = await createTask(member.token, board._id, { title: 'Second', labels: ['backend'] });
    expect(a.position).toBe(0);
    expect(b.position).toBe(1);
    expect(b.labels).toEqual(['backend']);
    expect(await Activity.countDocuments({ action: 'task.created' })).toBe(2);
  });

  test('TC-22 no title: 400 with a detail on title', async () => {
    const { member, board } = await createTeamWithMembers();
    const res = await api().post(`/api/boards/${board._id}/tasks`).set(auth(member.token)).send({ description: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('title');
  });

  test('TC-23 / US-07 assignee outside the team: 400; inside: 201', async () => {
    const { member, outsider, board } = await createTeamWithMembers();
    const bad = await api().post(`/api/boards/${board._id}/tasks`).set(auth(member.token)).send({ title: 'Assign', assignee: outsider.user._id });
    expect(bad.status).toBe(400);
    expect(bad.body.error.details[0].field).toBe('assignee');
    const good = await api().post(`/api/boards/${board._id}/tasks`).set(auth(member.token)).send({ title: 'Assign', assignee: member.user._id });
    expect(good.status).toBe(201);
    expect(good.body.data.task.assignee.name).toBe('Member');
  });

  test('TC-24 status "finished": 400', async () => {
    const { member, board } = await createTeamWithMembers();
    const res = await api().post(`/api/boards/${board._id}/tasks`).set(auth(member.token)).send({ title: 'Bad status', status: 'finished' });
    expect(res.status).toBe(400);
  });

  test('TC-25 pagination: 12 todo tasks, limit 5, page 2', async () => {
    const { owner, board } = await createTeamWithMembers();
    for (let i = 0; i < 12; i += 1) {
       
      await createTask(owner.token, board._id, { title: `Todo task ${i}` });
    }
    await createTask(owner.token, board._id, { title: 'Done task', status: 'done' });
    const res = await api().get(`/api/boards/${board._id}/tasks?status=todo&limit=5&page=2`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 12, totalPages: 3, hasNext: true });
  });

  test('limit is capped at 100', async () => {
    const { owner, board } = await createTeamWithMembers();
    const res = await api().get(`/api/boards/${board._id}/tasks?limit=500`).set(auth(owner.token));
    expect(res.body.meta.limit).toBe(100);
  });

  test('TC-26 / US-10 text search returns matching tasks, best match first', async () => {
    const { owner, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id, { title: 'Fix login bug', description: 'login fails' });
    await createTask(owner.token, board._id, { title: 'Write report', description: 'mention the login page' });
    await createTask(owner.token, board._id, { title: 'Design ER diagram' });
    const res = await api().get(`/api/boards/${board._id}/tasks?q=login`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['Fix login bug', 'Write report']);
  });

  test('TC-27 / US-09 assignee=me&overdue=true returns only my overdue tasks', async () => {
    const { owner, member, board } = await createTeamWithMembers();
    const past = '2020-01-01';
    await createTask(owner.token, board._id, { title: 'Mine overdue', assignee: member.user._id, dueDate: past, priority: 'high' });
    await createTask(owner.token, board._id, { title: 'Mine future', assignee: member.user._id, dueDate: '2099-01-01' });
    await createTask(owner.token, board._id, { title: 'Mine done late', assignee: member.user._id, dueDate: past, status: 'done' });
    await createTask(owner.token, board._id, { title: 'Owner overdue', assignee: owner.user._id, dueDate: past });
    const res = await api().get(`/api/boards/${board._id}/tasks?assignee=me&overdue=true`).set(auth(member.token));
    expect(titles(res)).toEqual(['Mine overdue']);
    expect(res.body.data[0].isOverdue).toBe(true);
    const high = await api().get(`/api/boards/${board._id}/tasks?assignee=me&priority=high,urgent`).set(auth(member.token));
    expect(titles(high)).toEqual(['Mine overdue']);
  });

  test('TC-28 operator injection in the query string: 400, not all tasks', async () => {
    const { owner, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id);
    const res = await api().get(`/api/boards/${board._id}/tasks?status[$ne]=x`).set(auth(owner.token));
    expect(res.status).toBe(400);
  });

  test('sanitizeFilter: an operator object in a JSON body never reaches Mongo as an operator', async () => {
    const res = await api().post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('sort by priority puts urgent first; unknown sort is rejected', async () => {
    const { owner, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id, { title: 'Low one', priority: 'low' });
    await createTask(owner.token, board._id, { title: 'Urgent one', priority: 'urgent' });
    await createTask(owner.token, board._id, { title: 'High one', priority: 'high' });
    const res = await api().get(`/api/boards/${board._id}/tasks?sort=priority`).set(auth(owner.token));
    expect(titles(res)).toEqual(['Urgent one', 'High one', 'Low one']);
    const bad = await api().get(`/api/boards/${board._id}/tasks?sort=password`).set(auth(owner.token));
    expect(bad.status).toBe(400);
  });

  test('TC-29 / US-08 move to done: 200, completedAt set, positions shift, stats change', async () => {
    const { member, board } = await createTeamWithMembers();
    const a = await createTask(member.token, board._id, { title: 'Task A' });
    const b = await createTask(member.token, board._id, { title: 'Task B' });
    const done1 = await createTask(member.token, board._id, { title: 'Done 1', status: 'done' });

    const res = await api().patch(`/api/tasks/${a._id}/move`).set(auth(member.token)).send({ status: 'done', position: 0 });
    expect(res.status).toBe(200);
    expect(res.body.data.task).toMatchObject({ status: 'done', position: 0 });
    expect(res.body.data.task.completedAt).not.toBeNull();
    expect((await Task.findById(b._id)).position).toBe(0); // gap in To Do closed
    expect((await Task.findById(done1._id)).position).toBe(1); // shifted down in Done
    expect(await Activity.countDocuments({ action: 'task.moved' })).toBe(1);

    const stats = await api().get(`/api/boards/${board._id}/stats`).set(auth(member.token));
    expect(stats.body.data.byStatus).toEqual({ todo: 1, in_progress: 0, done: 2 });

    const back = await api().patch(`/api/tasks/${a._id}/move`).set(auth(member.token)).send({ status: 'todo' });
    expect(back.body.data.task.completedAt).toBeNull();
    expect(back.body.data.task.position).toBe(1); // no position = end of column
  });

  test('reorder inside a column (drop in front of a later card)', async () => {
    const { member, board } = await createTeamWithMembers();
    const a = await createTask(member.token, board._id, { title: 'Card A' });
    await createTask(member.token, board._id, { title: 'Card B' });
    await createTask(member.token, board._id, { title: 'Card C' });
    // drop A in front of C (C is at position 2 before the move) -> B, A, C
    await api().patch(`/api/tasks/${a._id}/move`).set(auth(member.token)).send({ status: 'todo', position: 2 });
    const res = await api().get(`/api/boards/${board._id}/tasks?status=todo&sort=position`).set(auth(member.token));
    expect(titles(res)).toEqual(['Card B', 'Card A', 'Card C']);
    expect(res.body.data.map((t) => t.position)).toEqual([0, 1, 2]);
  });

  test('PATCH edits fields and can unassign', async () => {
    const { member, board } = await createTeamWithMembers();
    const t = await createTask(member.token, board._id, { assignee: member.user._id });
    const res = await api()
      .patch(`/api/tasks/${t._id}`)
      .set(auth(member.token))
      .send({ title: 'Renamed task', priority: 'urgent', assignee: null, labels: ['ui'] });
    expect(res.status).toBe(200);
    expect(res.body.data.task).toMatchObject({ title: 'Renamed task', priority: 'urgent', assignee: null, labels: ['ui'] });
  });

  test('TC-30 member who did not create the task cannot delete it; creator and admin can', async () => {
    const { owner, admin, member, board } = await createTeamWithMembers();
    const ownersTask = await createTask(owner.token, board._id);
    const res = await api().delete(`/api/tasks/${ownersTask._id}`).set(auth(member.token));
    expect(res.status).toBe(403);
    const mine = await createTask(member.token, board._id);
    expect((await api().delete(`/api/tasks/${mine._id}`).set(auth(member.token))).status).toBe(200);
    expect((await api().delete(`/api/tasks/${ownersTask._id}`).set(auth(admin.token))).status).toBe(200);
  });

  test('my tasks across teams include board and team names', async () => {
    const { owner, member, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id, { title: 'For member', assignee: member.user._id });
    await createTask(owner.token, board._id, { title: 'For nobody' });
    const res = await api().get('/api/tasks/mine').set(auth(member.token));
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['For member']);
    expect(res.body.data[0].board.name).toBe('Sprint 1');
    expect(res.body.data[0].team.name).toBe('Test Team');
  });

  test('outsider cannot read or edit a task', async () => {
    const { owner, outsider, board } = await createTeamWithMembers();
    const t = await createTask(owner.token, board._id);
    expect((await api().get(`/api/tasks/${t._id}`).set(auth(outsider.token))).status).toBe(403);
    expect((await api().patch(`/api/tasks/${t._id}`).set(auth(outsider.token)).send({ title: 'hack' })).status).toBe(403);
  });
});
