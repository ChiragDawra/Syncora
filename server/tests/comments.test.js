const { api, auth, createTeamWithMembers, createTask } = require('./helpers');

describe('Comments', () => {
  test('US-12 add and list comments, newest first, author populated', async () => {
    const { owner, member, board } = await createTeamWithMembers();
    const t = await createTask(owner.token, board._id);
    const first = await api().post(`/api/tasks/${t._id}/comments`).set(auth(member.token)).send({ text: 'First' });
    expect(first.status).toBe(201);
    expect(first.body.data.comment.author.name).toBe('Member');
    await api().post(`/api/tasks/${t._id}/comments`).set(auth(owner.token)).send({ text: 'Second' });
    const list = await api().get(`/api/tasks/${t._id}/comments`).set(auth(member.token));
    expect(list.body.data.map((c) => c.text)).toEqual(['Second', 'First']);
    expect(list.body.meta.total).toBe(2);
    const task = await api().get(`/api/tasks/${t._id}`).set(auth(member.token));
    expect(task.body.data.task.commentCount).toBe(2);
  });

  test('TC-34 empty text: 400', async () => {
    const { owner, board } = await createTeamWithMembers();
    const t = await createTask(owner.token, board._id);
    const res = await api().post(`/api/tasks/${t._id}/comments`).set(auth(owner.token)).send({ text: '   ' });
    expect(res.status).toBe(400);
  });

  test("TC-35 deleting another member's comment: 403; admin can", async () => {
    const { owner, admin, member, board } = await createTeamWithMembers();
    const t = await createTask(owner.token, board._id);
    const c = (await api().post(`/api/tasks/${t._id}/comments`).set(auth(owner.token)).send({ text: 'Owner says' })).body.data.comment;
    const denied = await api().delete(`/api/comments/${c._id}`).set(auth(member.token));
    expect(denied.status).toBe(403);
    const ok = await api().delete(`/api/comments/${c._id}`).set(auth(admin.token));
    expect(ok.status).toBe(200);
  });

  test('only the author edits; edited flag is set', async () => {
    const { owner, member, board } = await createTeamWithMembers();
    const t = await createTask(owner.token, board._id);
    const c = (await api().post(`/api/tasks/${t._id}/comments`).set(auth(member.token)).send({ text: 'Typo' })).body.data.comment;
    expect((await api().patch(`/api/comments/${c._id}`).set(auth(owner.token)).send({ text: 'x' })).status).toBe(403);
    const res = await api().patch(`/api/comments/${c._id}`).set(auth(member.token)).send({ text: 'Fixed' });
    expect(res.body.data.comment).toMatchObject({ text: 'Fixed', edited: true });
  });
});
