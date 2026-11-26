const { api, auth, createTeamWithMembers, createTask } = require('./helpers');
const { Task } = require('../src/models');

describe('Boards', () => {
  test('US-06 admin creates a board; every member sees it with a task count', async () => {
    const { admin, member, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().post(`/api/teams/${team._id}/boards`).set(auth(admin.token)).send({ name: 'Report', color: '#10b981' });
    expect(res.status).toBe(201);
    await createTask(member.token, res.body.data.board._id);
    const list = await api().get(`/api/teams/${team._id}/boards`).set(auth(member.token));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ name: 'Report', taskCount: 1 });
  });

  test('TC-17 member (not admin) creating a board: 403', async () => {
    const { member, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().post(`/api/teams/${team._id}/boards`).set(auth(member.token)).send({ name: 'Nope' });
    expect(res.status).toBe(403);
  });

  test('TC-18 duplicate board name in a team: 409', async () => {
    const { owner, team } = await createTeamWithMembers();
    const res = await api().post(`/api/teams/${team._id}/boards`).set(auth(owner.token)).send({ name: 'Sprint 1' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  test('TC-19 / US-13 outsider opening a board: 403, no data', async () => {
    const { outsider, board } = await createTeamWithMembers();
    const res = await api().get(`/api/boards/${board._id}`).set(auth(outsider.token));
    expect(res.status).toBe(403);
    expect(res.body.data).toBeUndefined();
    const tasks = await api().get(`/api/boards/${board._id}/tasks`).set(auth(outsider.token));
    expect(tasks.status).toBe(403);
  });

  test('TC-20 invalid board id: 400 INVALID_ID', async () => {
    const { owner } = await createTeamWithMembers({ withBoard: false });
    const res = await api().get('/api/boards/abc').set(auth(owner.token));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ID');
  });

  test('missing board: 404', async () => {
    const { owner } = await createTeamWithMembers({ withBoard: false });
    const res = await api().get('/api/boards/64b000000000000000000000').set(auth(owner.token));
    expect(res.status).toBe(404);
  });

  test('rename and archive; archived boards are hidden by default', async () => {
    const { owner, team, board } = await createTeamWithMembers();
    const res = await api().patch(`/api/boards/${board._id}`).set(auth(owner.token)).send({ name: 'Sprint One', archived: true });
    expect(res.status).toBe(200);
    expect(res.body.data.board).toMatchObject({ name: 'Sprint One', archived: true });
    const active = await api().get(`/api/teams/${team._id}/boards`).set(auth(owner.token));
    expect(active.body.data).toHaveLength(0);
    const archived = await api().get(`/api/teams/${team._id}/boards?archived=true`).set(auth(owner.token));
    expect(archived.body.data).toHaveLength(1);
  });

  test('member cannot delete a board; admin deletes it with its tasks', async () => {
    const { admin, member, board } = await createTeamWithMembers();
    await createTask(member.token, board._id);
    expect((await api().delete(`/api/boards/${board._id}`).set(auth(member.token))).status).toBe(403);
    const res = await api().delete(`/api/boards/${board._id}`).set(auth(admin.token));
    expect(res.status).toBe(200);
    expect(await Task.countDocuments({ board: board._id })).toBe(0);
  });
});
