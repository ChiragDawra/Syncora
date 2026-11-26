# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot and others) working in the Syncora repository. Humans can read it too. Put this file at the repo root.

## Project in one paragraph

Syncora is a MERN team task board built for the Back End Engineering-II (24CSE0315) course. `server/` is an Express REST API with MongoDB (Mongoose), JWT auth, team-level role-based access, Multer uploads and aggregation-based stats. `client/` is a React (Vite) SPA with React Router, Context + useReducer, Axios and Tailwind. The course syllabus decides the stack: do not swap frameworks or databases.

## Source of truth

Read the relevant doc before changing code, and update it in the same change when behaviour changes.

| Topic | Doc |
|---|---|
| Features, scope, acceptance criteria | `docs/PRD.md` |
| Architecture, middleware order, permissions matrix, error design | `docs/SYSTEM_DESIGN.md` |
| Schemas, indexes, aggregations, cascade rules | `docs/DATABASE.md` |
| Endpoints, request and response shapes, status and error codes | `docs/API_SPEC.md` |
| Flows | `docs/DATA_FLOW.md` |
| React routes, state, components | `docs/FRONTEND.md` |
| File layout and naming | `docs/FOLDER_STRUCTURE.md` |
| Current phase and priorities | `docs/BUILD_PLAN.md` |
| Tests and test cases | `docs/TESTING.md` |
| Env vars, logging, Redis, Docker, CI, deploy | `docs/DEVOPS_DEPLOYMENT.md` |
| Syllabus mapping (must stay true) | `docs/SYLLABUS_COVERAGE.md` |

If code and docs disagree, stop and ask which is right instead of guessing.

## Commands

```bash
# server (from server/)
npm install
npm run dev          # nodemon on :5000
npm test             # jest + supertest + mongodb-memory-server
npm run lint
npm run seed         # demo data; refuses in production

# client (from client/)
npm install
npm run dev          # vite on :5173, proxies /api and /uploads to :5000
npm run build
npm run lint

# everything (ETE)
docker compose up --build
```

Before saying a task is done: `npm run lint` and `npm test` pass in `server/`, and `npm run build` passes in `client/`.

## Fixed stack (do not change without the team's explicit decision)

- Server: Node 20, Express, CommonJS (`require`), Mongoose, jsonwebtoken, bcryptjs, express-validator, Multer, helmet, cors, express-rate-limit, morgan, winston, ioredis (optional).
- Client: React, Vite, React Router, Axios, Tailwind, react-hot-toast, Context + useReducer. No Redux, no Next.js, no TypeScript migration, no CSS-in-JS.
- Database: MongoDB only. No Prisma, no SQL, no Firebase or Supabase.
- Don't add a dependency unless the task needs it; say why in the PR description.

## Server conventions

- Layering: `routes → middleware → controllers → services → models`. Controllers stay thin (read `req`, call a service, send a response). Services never touch `req` or `res`. Business rules live in services.
- Wrap every async controller in `asyncHandler` (Express 4). Throw `AppError(message, status, code, details)` for expected failures; never `res.status(500)` by hand.
- Responses always use the envelope from `docs/API_SPEC.md`: `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details }, requestId }`. Use `utils/ApiResponse.js`.
- Every route that reads a body, param or query gets express-validator rules in `validators/` and the `validate` middleware. Validate ObjectIds with `isMongoId()`.
- Access control: `protect` on every non-public route; resource loaders (`loadTeam`, `loadBoard`, `loadTask`, `loadComment`) then `requireTeamRole(...roles)`. Role checks belong in middleware; ownership checks ("is this your comment?") belong in the service. Keep the matrix in `docs/SYSTEM_DESIGN.md` §5.2 and `client/src/utils/permissions.js` in sync.
- Queries: whitelist filter and sort keys (see `utils/buildTaskQuery.js`); never spread `req.query` or `req.body` into a Mongo query or update. Cap `limit` at 100. Use `.lean()` on read-only lists. Run `find` and `countDocuments` with `Promise.all`.
- New query patterns need an index in the model and a row in `docs/DATABASE.md`.
- Writes that change tasks or members must: log an `Activity`, and call `cache.del` for the affected `board:{id}:stats` and `team:{id}:dashboard` keys.
- Cascades (team, board, task deletes) follow `docs/DATABASE.md` §6. Delete files only after the DB work succeeds.
- Uploads: only through `middleware/upload.js`. Random stored filenames, size and type limits, cleanup on failure.
- Logging: use `utils/logger.js`, not `console.log`. Never log passwords, tokens, `Authorization` headers or file contents.
- Config: read env only through `config/env.js`. When adding a variable, add it to `.env.example` and `docs/DEVOPS_DEPLOYMENT.md`.

## Client conventions

- Functional components and hooks only. One component per file, PascalCase `.jsx`.
- All HTTP through `src/api/` modules that use the shared Axios instance in `api/client.js`; components never call `axios` or `fetch` directly.
- Every data view handles loading, error (with retry), empty and data states.
- Filters, search, sort and page live in the URL (`useSearchParams`).
- Role-based UI uses `useTeam().can(action)`; hiding a button is not security, the server must also enforce it.
- Forms are controlled; map server `error.details` onto fields.
- Tailwind classes only; reuse `components/common/` before creating a new primitive.
- Never put secrets in `VITE_` env vars.

## Tests

- Add or update Supertest tests in `server/tests/` for every new or changed endpoint: one success case plus each relevant failure (400, 401, 403, 404, 409, 413).
- Tests use mongodb-memory-server; never point tests at Atlas.
- Add new cases to the table in `docs/TESTING.md` and requests to the Postman collection in `postman/`.

## Git

- Branch per change: `feat/…`, `fix/…`, `docs/…`, `chore/…`. Never commit straight to `main`.
- Conventional Commits: `feat(tasks): add overdue filter`.
- Small, reviewable PRs; describe what changed and how it was tested.

## Never

- Commit `.env`, real connection strings, JWT secrets, API keys or uploaded files.
- Disable validation, auth or access checks to make a test pass.
- Return stack traces or Mongo error objects to the client.
- Store passwords in plain text or return the `password` field.
- Run the seed script or destructive scripts against a production database.
- Rewrite large parts of the codebase or change the folder layout without being asked.

## When unsure

Ask a short question, or leave a `// TODO(syncora): …` with the open question and mention it in your summary. Prefer the simplest implementation that meets the acceptance criteria in `docs/PRD.md`; this is a course project and every team member must be able to explain the code in a viva.
