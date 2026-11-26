# Syncora: testing

Three layers: automated API tests (Jest + Supertest), a Postman collection with assertions, and a manual end-to-end demo script. The report's chapter 7 comes straight from this file.

## 1. Strategy

| Layer | Tool | Covers | When |
|---|---|---|---|
| Unit | Jest | Pure helpers: `buildTaskQuery`, `parsePagination`, permission map | On every change |
| API integration | Jest + Supertest + mongodb-memory-server | Every route: success, validation, 401, 403, 404, 409, 413 | `npm test`, and in CI |
| Contract and manual | Postman collection + Collection Runner | Every endpoint against the real dev server and Atlas | Before each demo |
| End to end (manual) | Browser + demo script | Full user journeys | Before CE-2 |
| Performance spot check | Compass `explain()` | Indexes used (`IXSCAN`) for list queries | Once, screenshot for report |

## 2. Test setup (`server/tests/setup.js`)

```js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
let mongo;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret-at-least-32-characters-long';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map(c => c.deleteMany({})));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
```

`jest.config.js`: `module.exports = { testEnvironment: 'node', setupFilesAfterEnv: ['<rootDir>/tests/setup.js'] };`. `app.js` exports the app without calling `listen`, so Supertest can use it directly.

Example test:

```js
const request = require('supertest');
const app = require('../src/app');
const { createUserAndToken, createTeam } = require('./helpers');

describe('GET /api/boards/:boardId/tasks', () => {
  it('returns 403 for a user who is not in the team', async () => {
    const { token: ownerToken } = await createUserAndToken('owner@t.dev');
    const { token: outsiderToken } = await createUserAndToken('out@t.dev');
    const { board } = await createTeam(ownerToken, { withBoard: true });

    const res = await request(app)
      .get(`/api/boards/${board._id}/tasks`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
```
## 3. Test cases

Use this table in the report (chapter 7.2). Fill "Actual" and "Result" when you run them.

| ID | Area | Endpoint | Input / precondition | Expected | Actual | Result |
|---|---|---|---|---|---|---|
| TC-01 | Auth | POST /auth/register | valid name, email, password | 201, token returned | | |
| TC-02 | Auth | POST /auth/register | existing email | 409 DUPLICATE | | |
| TC-03 | Auth | POST /auth/register | password `abc` | 400, details on `password` | | |
| TC-04 | Auth | POST /auth/login | correct credentials | 200, token | | |
| TC-05 | Auth | POST /auth/login | wrong password | 401 INVALID_CREDENTIALS | | |
| TC-06 | Auth | POST /auth/login | 11 failed attempts in 15 min | 429 (successful logins don't count) | | |
| TC-07 | Auth | GET /auth/me | no token | 401 NO_TOKEN | | |
| TC-08 | Auth | GET /auth/me | tampered token | 401 INVALID_TOKEN | | |
| TC-09 | Auth | GET /auth/me | expired token | 401 TOKEN_EXPIRED | | |
| TC-10 | Teams | POST /teams | valid name | 201, caller is owner | | |
| TC-11 | Teams | POST /teams/:id/members | owner adds registered email | 201 | | |
| TC-12 | Teams | POST /teams/:id/members | unknown email | 404 | | |
| TC-13 | Teams | POST /teams/:id/members | already a member | 409 ALREADY_MEMBER | | |
| TC-14 | Teams | POST /teams/:id/members | plain member tries | 403 | | |
| TC-15 | Teams | DELETE /teams/:id/members/:ownerId | owner leaves | 400 OWNER_CANNOT_LEAVE | | |
| TC-16 | Teams | DELETE /teams/:id | admin tries | 403 | | |
| TC-17 | Boards | POST /teams/:id/boards | member (not admin) | 403 | | |
| TC-18 | Boards | POST /teams/:id/boards | duplicate name | 409 | | |
| TC-19 | Boards | GET /boards/:id | outsider | 403 | | |
| TC-20 | Boards | GET /boards/abc | invalid id | 400 INVALID_ID | | |
| TC-21 | Tasks | POST /boards/:id/tasks | valid body | 201, position set, activity logged | | |
| TC-22 | Tasks | POST /boards/:id/tasks | no title | 400, details on `title` | | |
| TC-23 | Tasks | POST /boards/:id/tasks | assignee not in team | 400 | | |
| TC-24 | Tasks | POST /boards/:id/tasks | status `finished` | 400 | | |
| TC-25 | Tasks | GET /boards/:id/tasks?status=todo&limit=5&page=2 | 12 todo tasks | 5 items, meta.total 12, totalPages 3 | | |
| TC-26 | Tasks | GET /boards/:id/tasks?q=login | 2 tasks mention login | 2 items | | |
| TC-27 | Tasks | GET /boards/:id/tasks?assignee=me&overdue=true | seed data | only my overdue tasks | | |
| TC-28 | Tasks | GET /boards/:id/tasks?status[$ne]=x | injection attempt | 400 (not all tasks) | | |
| TC-29 | Tasks | PATCH /tasks/:id/move | to done | 200, completedAt set, stats updated | | |
| TC-30 | Tasks | DELETE /tasks/:id | member who didn't create it | 403 | | |
| TC-31 | Files | POST /tasks/:id/attachments | 1 MB PDF | 201 | | |
| TC-32 | Files | POST /tasks/:id/attachments | 6 MB PNG | 413 FILE_TOO_LARGE | | |
| TC-33 | Files | POST /tasks/:id/attachments | `.exe` | 400 UNSUPPORTED_FILE_TYPE | | |
| TC-34 | Comments | POST /tasks/:id/comments | empty text | 400 | | |
| TC-35 | Comments | DELETE /comments/:id | another member's comment | 403 | | |
| TC-36 | Stats | GET /boards/:id/stats | seed board | totals match seed (12 total, 3 overdue) | | |
| TC-37 | Stats | GET /teams/:id/dashboard twice (ETE) | Redis on | second response `cached: true` | | |
| TC-38 | Cascade | DELETE /teams/:id | team with boards, tasks, comments | 200, related collections empty for that team | | |
| TC-39 | General | GET /api/nope | unknown route | 404 NOT_FOUND | | |
| TC-40 | General | Any 500 in production mode | forced error | no stack trace in body; logged with requestId | | |

## 4. Postman collection

Structure (`postman/Syncora.postman_collection.json`):

```
Syncora
├── 00 Health
├── 01 Auth        register, login (owner), login (member), login (outsider), me, bad token
├── 02 Teams       create, list, get, add member, add duplicate (409), member adds (403), change role, remove
├── 03 Boards      create, duplicate (409), list, get, outsider get (403), update, stats
├── 04 Tasks       create, no title (400), bad assignee (400), list + filters, search, move, mine, delete (403 case)
├── 05 Attachments upload pdf, too large (413), bad type (400), delete
├── 06 Comments    add, list, delete other's (403)
└── 99 Cleanup     delete team
```

Environment `Syncora Local`: `baseUrl = http://localhost:5000/api`, `ownerToken`, `memberToken`, `outsiderToken`, `teamId`, `boardId`, `taskId`, `commentId`, `attachmentId`.

Login request **Tests** tab (captures the token):

```js
pm.test('status 200', () => pm.response.to.have.status(200));
const body = pm.response.json();
pm.environment.set('ownerToken', body.data.token);
```

Collection-level **Authorization**: Bearer Token `{{ownerToken}}`; requests for other users override it.

Typical assertion:

```js
pm.test('403 for outsider', () => {
  pm.response.to.have.status(403);
  pm.expect(pm.response.json().error.code).to.eql('FORBIDDEN');
});
pm.test('responds under 500 ms', () => pm.expect(pm.response.responseTime).to.be.below(500));
```

Run the whole collection with the **Collection Runner** and screenshot the summary for the report. Export the collection and environment (without real tokens) into `postman/`.

## 5. Seed data for tests and demos

`npm run seed` creates the users, teams, boards and tasks in DATABASE.md §9. Demo logins (password `Password123`): `owner@syncora.dev`, `admin@syncora.dev`, `member@syncora.dev`, `outsider@syncora.dev`.

## 6. Manual end-to-end script (browser)

1. Register a new user → lands on Teams (empty state shown).
2. Create team "Demo Team" → open it.
3. Add `member@syncora.dev` as member; promote to admin; demote back.
4. Create board "Sprint 1".
5. Add 3 tasks with different priorities, one overdue, one assigned to the member.
6. Move one to In Progress, one to Done → stats strip updates.
7. Filter: Assignee = member, Priority = high; search "login"; clear filters.
8. Open a task → comment → attach a PDF (progress bar) → download it.
9. Log out; log in as `outsider@syncora.dev`; paste the board URL → access denied page.
10. Log in as owner → dashboard shows workload; activity feed lists the actions.
11. Delete the team → back to Teams.

## 7. Bug log template

| # | Found in | Steps | Expected | Actual | Fix (commit) | Status |
|---|---|---|---|---|---|---|
| 1 | | | | | | |

Keep this filled while building; "bugs found and fixed" is good report and viva material (CHO unit 7: bug fixing, polishing).

## 8. Coverage target

Aim for 70%+ line coverage on `services/` and `middleware/` (`npm run test:cov`). Screenshot the coverage summary for the report.
