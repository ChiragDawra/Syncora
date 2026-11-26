const request = require('supertest');
const app = require('../src/app');

const PASSWORD = 'Password123';
const api = () => request(app);
const auth = (token) => ({ Authorization: `Bearer ${token}` });

async function createUserAndToken(email, name = email.split('@')[0].padEnd(2, 'x')) {
  const res = await api().post('/api/auth/register').send({ name, email, password: PASSWORD });
  if (res.status !== 201) throw new Error(`register failed: ${JSON.stringify(res.body)}`);
  return { user: res.body.data.user, token: res.body.data.token };
}

/**
 * Owner + admin + member in one team, plus an outsider. Optionally a board.
 */
async function createTeamWithMembers({ withBoard = true } = {}) {
  const owner = await createUserAndToken('owner@t.dev', 'Owner');
  const admin = await createUserAndToken('admin@t.dev', 'Admin');
  const member = await createUserAndToken('member@t.dev', 'Member');
  const outsider = await createUserAndToken('outsider@t.dev', 'Outsider');

  const teamRes = await api().post('/api/teams').set(auth(owner.token)).send({ name: 'Test Team' });
  const team = teamRes.body.data.team;
  await api().post(`/api/teams/${team._id}/members`).set(auth(owner.token)).send({ email: 'admin@t.dev', role: 'admin' });
  await api().post(`/api/teams/${team._id}/members`).set(auth(owner.token)).send({ email: 'member@t.dev' });

  let board = null;
  if (withBoard) {
    const b = await api().post(`/api/teams/${team._id}/boards`).set(auth(owner.token)).send({ name: 'Sprint 1' });
    board = b.body.data.board;
  }
  return { owner, admin, member, outsider, team, board };
}

async function createTask(token, boardId, body = {}) {
  const res = await api()
    .post(`/api/boards/${boardId}/tasks`)
    .set(auth(token))
    .send({ title: 'A task title', ...body });
  if (res.status !== 201) throw new Error(`task create failed: ${JSON.stringify(res.body)}`);
  return res.body.data.task;
}

module.exports = { api, auth, PASSWORD, createUserAndToken, createTeamWithMembers, createTask };
