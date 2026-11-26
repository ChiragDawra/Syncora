# Syncora: build plan

CE-2 runs **Wed 25 Nov to Thu 3 Dec**, in your Wednesday or Thursday lecture slot (25 Nov, 26 Nov, 2 Dec or 3 Dec). Pick the track that matches your group's day.

- **Slot on 25 or 26 Nov** → Track A (minimum cut, about 12 to 14 focused hours).
- **Slot on 2 or 3 Dec** → Track B (full CE-2 scope, about 6 days).
- After CE-2 → Phase 9 (unit 8, ETE).

Split the work so everyone can answer the viva: one person on auth + teams, one on boards + tasks + stats, one on the React client, one on docs + Postman + report. Everyone reads SYSTEM_DESIGN.md and DATA_FLOW.md.

## Phases and definition of done

| Phase | Build | Done when | Est. |
|---|---|---|---|
| 0. Setup | Repo, `server/` and `client/` scaffolds, ESLint, Prettier, `.env.example`, Atlas cluster, `config/env.js`, `config/db.js`, `/api/health`, `AppError`, `asyncHandler`, `errorHandler`, `notFound`, logger | `npm run dev` starts; `GET /api/health` returns 200 with `db: "connected"` | 2 h |
| 1. Auth | User model (hash hook, `comparePassword`), register, login, me, `protect`, `authLimiter`, validators | Postman: register 201, duplicate 409, login 200, wrong password 401, `/me` without token 401 | 3 h |
| 2. Teams and roles | Team model, create/list/get, add/remove member, change role, `loadTeam`, `requireTeamRole`, activity service | Owner adds member; member trying to add gets 403; outsider gets 403 | 3 h |
| 3. Boards and tasks | Board and Task models with indexes; board CRUD; task CRUD, move, `buildTaskQuery` (filters, search, sort, pagination), my tasks | Filters, search and pagination return correct `meta`; assignee outside team gets 400 | 4 h |
| 4. Comments, attachments, stats | Comment CRUD; Multer upload and delete; board stats and team dashboard aggregations; activity feed | Upload PDF 201, 6 MB 413, `.exe` 400; stats numbers match seed data | 4 h |
| 5. Hardening and tests | Helmet, CORS, sanitizeFilter, Jest + Supertest suite, seed script, Postman collection with tests | `npm test` green; Postman runner all green | 3 h |
| 6. Client core | Vite + Tailwind + Router; Axios client; AuthContext; Login, Register; ProtectedRoute; AppLayout; Teams page; Team boards page | Log in, see teams, open a team, refresh keeps you logged in | 4 h |
| 7. Client board | Board page with columns, task create/edit/move, filters, search, pagination; task drawer with comments and attachments + progress bar; role-based UI; loading, empty, error states | Full demo script runs in the browser | 6 h |
| 8. Dashboard, polish, docs | Team dashboard page, activity page, settings page; responsive pass; README with screenshots; report, deck | Demo rehearsed twice; screenshots captured | 4 h |
| 9. ETE (unit 8) | Winston + Morgan (if not done), Redis cache, Dockerfiles, Compose, GitHub Actions, deploy | `docker compose up` works; CI green on GitHub; live URLs | 4 to 6 h |

## Track A: minimum cut (slot on 25 or 26 Nov)

Goal: a working, explainable API with a thin UI. The marks lean on execution, the database and the viva.

| Block | Do | Skip for now |
|---|---|---|
| 1 (3 h) | Phase 0 + Phase 1 | Avatar upload, change password |
| 2 (3 h) | Phase 2 (create team, add member, roles, access middleware) | Role change endpoint (seed an admin instead) |
| 3 (3 h) | Phase 3 (board and task CRUD, move, filters, pagination, search) | Positions inside a column (sort by `createdAt`) |
| 4 (2 h) | Board stats aggregation + one Multer upload route + seed script + Postman collection with 401, 403, 400, 413 cases | Comments, activity, dashboard |
| 5 (3 h) | React: login, teams list, board page with three columns, create task, status dropdown, loading and error states | Drag and drop, drawer, dashboard |
| 6 (1 h) | Rehearse the demo through Postman + the board page; open the key files in VS Code | Deploy |

If the UI isn't ready, demo through Postman and MongoDB Compass. Say in the viva which UI parts are in progress.

## Track B: full CE-2 scope (slot on 2 or 3 Dec)

| Day | Build | Report and deck |
|---|---|---|
| Wed 25 Nov | Phase 0 + Phase 1 | Fill title page, certificate and declaration templates |
| Thu 26 Nov | Phase 2 + Phase 3 | Draw ER diagram and architecture diagram (from DATABASE.md and SYSTEM_DESIGN.md) |
| Fri 27 Nov | Phase 4 + Phase 5 | Postman screenshots, test case table |
| Sat 28 Nov | Phase 6 | Chapters 1 to 4 |
| Sun 29 Nov | Phase 7 | GUI screenshots, chapters 5 and 6 |
| Mon 30 Nov | Phase 8 (+ logging from Phase 9 if time allows) | Chapters 7 to 11, deck |
| Tue 1 Dec | Bug fixes only, full rehearsal ×2, screen recording backup | Print or bind if required |
| Wed 2 / Thu 3 Dec | CE-2 | |

Your AIML CE-2 runs in the same window, so protect the Track B days you need for it and move Phase 8 polish earlier if needed.

## Git workflow

1. `main` is always runnable. Work on `feat/<area>` branches; open a pull request; one teammate reviews; merge.
2. Commit small, with Conventional Commit messages: `feat(auth): login endpoint`, `fix(tasks): 400 on bad assignee`.
3. Tag the CE-2 build: `git tag ce2-demo && git push --tags`, so you can always return to the demo state.

## Daily checklist

- [ ] Pull `main`, run `npm test` before starting.
- [ ] Update the Postman collection when you add or change an endpoint.
- [ ] Update API_SPEC.md and DATABASE.md when a contract or schema changes.
- [ ] Take a screenshot when a feature first works (report and deck need them).
- [ ] Push before you stop.

## Done criteria for CE-2

- [ ] Every P0 feature in PRD.md works in the browser or Postman.
- [ ] Postman collection runs green, including the negative cases.
- [ ] `npm test` passes.
- [ ] Seed script gives a realistic demo board.
- [ ] Report chapters filled with real screenshots; deck ready on the course template.
- [ ] Each team member has explained the middleware chain and one aggregation out loud.
