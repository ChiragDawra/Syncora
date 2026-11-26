const jwt = require('jsonwebtoken');
const express = require('express');
const request = require('supertest');
const { api, auth, PASSWORD, createUserAndToken } = require('./helpers');
const { createLimiter } = require('../src/middleware/rateLimit');

describe('Auth', () => {
  test('TC-01 register returns 201 with user and token, no password', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'Chirag', email: 'Chirag@Example.com', password: PASSWORD });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('chirag@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  test('TC-02 duplicate email returns 409 DUPLICATE', async () => {
    await createUserAndToken('dup@t.dev');
    const res = await api().post('/api/auth/register').send({ name: 'Dup', email: 'dup@t.dev', password: PASSWORD });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
  });

  test('TC-03 weak password returns 400 with a detail on password', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Weak', email: 'weak@t.dev', password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]));
    expect(res.body.requestId).toEqual(expect.any(String));
  });

  test('TC-04 login with correct credentials returns 200 and a token', async () => {
    await createUserAndToken('login@t.dev');
    const res = await api().post('/api/auth/login').send({ email: 'login@t.dev', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  test('TC-05 wrong password and unknown email give the same 401', async () => {
    await createUserAndToken('login2@t.dev');
    const wrong = await api().post('/api/auth/login').send({ email: 'login2@t.dev', password: 'Wrong12345' });
    const unknown = await api().post('/api/auth/login').send({ email: 'nobody@t.dev', password: 'Wrong12345' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });

  test('TC-06 the 11th failed attempt in the window gets 429; successful ones do not count', async () => {
    const app = express();
    const limiter = createLimiter(10, { skipSuccessfulRequests: true });
    app.post('/ok', limiter, (_req, res) => res.json({ ok: true }));
    app.post('/login', limiter, (_req, res) => res.status(401).json({ ok: false }));
    for (let i = 0; i < 15; i += 1) {
      expect((await request(app).post('/ok')).status).toBe(200);
    }
    for (let i = 0; i < 10; i += 1) {
      expect((await request(app).post('/login')).status).toBe(401);
    }
    const res = await request(app).post('/login');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  test('TC-07 /me without a token returns 401 NO_TOKEN', async () => {
    const res = await api().get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('NO_TOKEN');
  });

  test('TC-08 /me with a tampered token returns 401 INVALID_TOKEN', async () => {
    const { token } = await createUserAndToken('tamper@t.dev');
    const res = await api()
      .get('/api/auth/me')
      .set(auth(`${token.slice(0, -2)}xx`));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  test('TC-09 /me with an expired token returns 401 TOKEN_EXPIRED', async () => {
    const { user } = await createUserAndToken('expired@t.dev');
    const expired = jwt.sign({ sub: user._id, exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET);
    const res = await api().get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  test('/me returns the current user; PATCH /me updates the name', async () => {
    const { token } = await createUserAndToken('me@t.dev');
    const me = await api().get('/api/auth/me').set(auth(token));
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('me@t.dev');
    const upd = await api().patch('/api/auth/me').set(auth(token)).send({ name: 'New Name' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.user.name).toBe('New Name');
  });

  test('change password needs the current password', async () => {
    const { token } = await createUserAndToken('pw@t.dev');
    const bad = await api()
      .patch('/api/auth/me/password')
      .set(auth(token))
      .send({ currentPassword: 'nope12345', newPassword: 'Newpass123' });
    expect(bad.status).toBe(401);
    const good = await api()
      .patch('/api/auth/me/password')
      .set(auth(token))
      .send({ currentPassword: PASSWORD, newPassword: 'Newpass123' });
    expect(good.status).toBe(200);
    const login = await api().post('/api/auth/login').send({ email: 'pw@t.dev', password: 'Newpass123' });
    expect(login.status).toBe(200);
  });

  test('avatar upload accepts a PNG and rejects a PDF', async () => {
    const { token } = await createUserAndToken('avatar@t.dev');
    const png = await api()
      .post('/api/auth/me/avatar')
      .set(auth(token))
      .attach('avatar', Buffer.from('png'), { filename: 'me.png', contentType: 'image/png' });
    expect(png.status).toBe(200);
    expect(png.body.data.user.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);
    const pdf = await api()
      .post('/api/auth/me/avatar')
      .set(auth(token))
      .attach('avatar', Buffer.from('%PDF'), { filename: 'me.pdf', contentType: 'application/pdf' });
    expect(pdf.status).toBe(400);
    expect(pdf.body.error.code).toBe('UNSUPPORTED_FILE_TYPE');
  });
});

describe('General', () => {
  test('TC-39 unknown route returns 404 NOT_FOUND', async () => {
    const res = await api().get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('health returns 200 with db connected', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.db).toBe('connected');
  });

  test('malformed JSON returns 400, not 500', async () => {
    const res = await api().post('/api/auth/login').set('Content-Type', 'application/json').send('{"email":');
    expect(res.status).toBe(400);
  });
});
