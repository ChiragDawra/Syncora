const { api, auth, createUserAndToken, createTeamWithMembers, createTask } = require('./helpers');
const { Board, Task, Comment, Activity, Team } = require('../src/models');

describe('Teams and roles', () => {
  test('TC-10 create team: 201, caller is owner, listed in my teams', async () => {
    const { token } = await createUserAndToken('o@t.dev');
    const res = await api().post('/api/teams').set(auth(token)).send({ name: 'Syncora Core', description: 'BEE-II' });
    expect(res.status).toBe(201);
    expect(res.body.data.team.members[0].role).toBe('owner');
    const list = await api().get('/api/teams').set(auth(token));
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ name: 'Syncora Core', myRole: 'owner', memberCount: 1 });
  });

  test('TC-11 owner adds a registered email: 201', async () => {
    const owner = await createUserAndToken('o@t.dev');
    await createUserAndToken('friend@t.dev');
    const team = (await api().post('/api/teams').set(auth(owner.token)).send({ name: 'Team' })).body.data.team;
    const res = await api().post(`/api/teams/${team._id}/members`).set(auth(owner.token)).send({ email: 'friend@t.dev' });
    expect(res.status).toBe(201);
    expect(res.body.data.team.members).toHaveLength(2);
  });

  test('TC-12 unknown email: 404', async () => {
    const { owner, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().post(`/api/teams/${team._id}/members`).set(auth(owner.token)).send({ email: 'ghost@t.dev' });
    expect(res.status).toBe(404);
  });

  test('TC-13 already a member: 409 ALREADY_MEMBER', async () => {
    const { owner, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().post(`/api/teams/${team._id}/members`).set(auth(owner.token)).send({ email: 'member@t.dev' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ALREADY_MEMBER');
  });

  test('TC-14 plain member tries to add: 403', async () => {
    const { member, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().post(`/api/teams/${team._id}/members`).set(auth(member.token)).send({ email: 'outsider@t.dev' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  test('only the owner may add an admin', async () => {
    const { admin, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().post(`/api/teams/${team._id}/members`).set(auth(admin.token)).send({ email: 'outsider@t.dev', role: 'admin' });
    expect(res.status).toBe(403);
  });

  test('TC-15 owner leaving returns 400 OWNER_CANNOT_LEAVE', async () => {
    const { owner, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().delete(`/api/teams/${team._id}/members/${owner.user._id}`).set(auth(owner.token));
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('OWNER_CANNOT_LEAVE');
  });

  test('TC-16 admin tries to delete the team: 403', async () => {
    const { admin, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().delete(`/api/teams/${team._id}`).set(auth(admin.token));
    expect(res.status).toBe(403);
  });

  test('outsider gets 403 on the team', async () => {
    const { outsider, team } = await createTeamWithMembers({ withBoard: false });
    const res = await api().get(`/api/teams/${team._id}`).set(auth(outsider.token));
    expect(res.status).toBe(403);
    expect(res.body.data).toBeUndefined();
  });

  test('US-05 owner promotes a member to admin, who can then create boards', async () => {
    const { owner, member, team } = await createTeamWithMembers({ withBoard: false });
    const before = await api().post(`/api/teams/${team._id}/boards`).set(auth(member.token)).send({ name: 'Nope' });
    expect(before.status).toBe(403);
    const res = await api().patch(`/api/teams/${team._id}/members/${member.user._id}`).set(auth(owner.token)).send({ role: 'admin' });
    expect(res.status).toBe(200);
    const after = await api().post(`/api/teams/${team._id}/boards`).set(auth(member.token)).send({ name: 'Yes' });
    expect(after.status).toBe(201);
  });

  test("owner's role can't be changed; admin can't change roles", async () => {
    const { owner, admin, member, team } = await createTeamWithMembers({ withBoard: false });
    const self = await api().patch(`/api/teams/${team._id}/members/${owner.user._id}`).set(auth(owner.token)).send({ role: 'member' });
    expect(self.status).toBe(400);
    const byAdmin = await api().patch(`/api/teams/${team._id}/members/${member.user._id}`).set(auth(admin.token)).send({ role: 'admin' });
    expect(byAdmin.status).toBe(403);
  });

  test('admins remove members but not other admins; members can leave', async () => {
    const { owner, admin, member, team } = await createTeamWithMembers({ withBoard: false });
    const extra = await createUserAndToken('admin2@t.dev');
    await api().post(`/api/teams/${team._id}/members`).set(auth(owner.token)).send({ email: 'admin2@t.dev', role: 'admin' });
    const otherAdmin = await api().delete(`/api/teams/${team._id}/members/${extra.user._id}`).set(auth(admin.token));
    expect(otherAdmin.status).toBe(403);
    const leave = await api().delete(`/api/teams/${team._id}/members/${member.user._id}`).set(auth(member.token));
    expect(leave.status).toBe(200);
    expect(leave.body.data.left).toBe(true);
    const gone = await api().get(`/api/teams/${team._id}`).set(auth(member.token));
    expect(gone.status).toBe(403);
  });

  test('TC-38 deleting the team cascades to boards, tasks, comments and activity', async () => {
    const { owner, team, board } = await createTeamWithMembers();
    const task = await createTask(owner.token, board._id);
    await api().post(`/api/tasks/${task._id}/comments`).set(auth(owner.token)).send({ text: 'hi' });
    const res = await api().delete(`/api/teams/${team._id}`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(await Team.countDocuments({ _id: team._id })).toBe(0);
    expect(await Board.countDocuments({ team: team._id })).toBe(0);
    expect(await Task.countDocuments({ team: team._id })).toBe(0);
    expect(await Comment.countDocuments({ team: team._id })).toBe(0);
    expect(await Activity.countDocuments({ team: team._id })).toBe(0);
  });

  test('activity feed lists actions newest first with meta', async () => {
    const { owner, team, board } = await createTeamWithMembers();
    await createTask(owner.token, board._id, { title: 'Logged task' });
    const res = await api().get(`/api/teams/${team._id}/activity?limit=2`).set(auth(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data[0].action).toBe('task.created');
    expect(res.body.meta).toMatchObject({ page: 1, limit: 2 });
  });
});
