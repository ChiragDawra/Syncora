# Syncora: syllabus coverage (Back End Engineering-II, 24CSE0315)

The handout (section 12, Syllabus of the Course) splits the course into eight units. CE-1 covered units 1 to 4. **CE-2 covers units 5, 6 and 7.** The ETE covers everything including unit 8. This table shows where each topic lives in Syncora, so you can point to code during the viva.

Legend: ✅ built in the CE-2 scope, 🟡 built if time allows (P1), 🔵 ETE add-on (unit 8).

## Unit 5: MongoDB and Mongoose (15%), CE-2

| CHO topic | Where in Syncora | File(s) | |
|---|---|---|---|
| MongoDB setup, MongoDB Atlas | Atlas M0 cluster; local `mongo:7` fallback | `config/db.js`, `.env` `MONGODB_URI` | ✅ |
| CRUD operations | Teams, boards, tasks, comments | `services/*.service.js` | ✅ |
| Mongoose setup | `mongoose.connect`, `strictQuery`, `sanitizeFilter` | `config/db.js` | ✅ |
| Schemas, models | 6 schemas | `models/*.js` | ✅ |
| Validation | `required`, `enum`, `minlength`, `match`, custom array validators | `models/Task.js`, `User.js` | ✅ |
| Mongoose queries, find | Filtered task list, my tasks | `services/task.service.js`, `utils/buildTaskQuery.js` | ✅ |
| Populate | Task → assignee, createdBy; team → members.user | `task.service.js`, `team.service.js` | ✅ |
| Aggregation | Board stats (`$facet`), workload (`$group`, `$lookup`), completed per day (`$dateToString`) | `services/stats.service.js` | ✅ |
| Indexing, performance | Single, unique, multikey, text, TTL indexes; `explain()` check | `models/Task.js`, `Activity.js` | ✅ |
| Compound indexes | `{ board, status, position }`, `{ assignee, status, dueDate }` | `models/Task.js` | ✅ |
| Mongoose middleware | `pre('save')` password hash, `completedAt`; `pre('deleteOne')` cascade | `models/User.js`, `Task.js` | ✅ |
| Virtuals | `isOverdue`, `memberCount`, virtual populate `taskCount`, `boards` | `models/Task.js`, `Team.js`, `Board.js` | ✅ |
| Static methods | `User.findByEmail`, `Team.forUser` (+ instance methods `comparePassword`, `getRole`) | `models/User.js`, `Team.js` | ✅ |
| Relationships | User ↔ Team (many-to-many via embedded members), Team → Board → Task → Comment | DATABASE.md §2 | ✅ |
| Referencing vs embedding | Members and attachments embedded; boards, tasks, comments referenced | DATABASE.md §2 | ✅ |
| Error handling, custom errors | `AppError`; CastError, ValidationError, E11000 mapping | `utils/AppError.js`, `middleware/errorHandler.js` | ✅ |
| Validation (again, API level) | express-validator before Mongoose | `validators/*.js` | ✅ |

## Unit 6: React fundamentals (12%), CE-2

| CHO topic | Where in Syncora | File(s) | |
|---|---|---|---|
| React setup, JSX | Vite React app | `client/` | ✅ |
| Components, props | `TaskCard`, `KanbanColumn`, `BoardCard`, shared `common/` | `components/` | ✅ |
| State | Page data, form fields, modals | pages and components | ✅ |
| Functional components | Every component | | ✅ |
| Hooks: useState, useEffect | Forms; fetching in `useFetch` | `hooks/useFetch.js` | ✅ |
| Event handling | Submit, click, change, drag | forms, `TaskCard` | ✅ |
| Forms, controlled components | Login, register, task, team, board forms | `TaskForm.jsx`, `LoginPage.jsx` | ✅ |
| Conditional rendering | Loading, empty, error states; role-based buttons | every page | ✅ |
| Lists, keys | Columns, cards, members, comments with `key={_id}` | `KanbanColumn.jsx` | ✅ |
| useContext | `useAuth`, `useTeam` | `context/` | ✅ |
| useReducer | Auth state machine | `context/AuthContext.jsx` | ✅ |
| Custom hooks | `useFetch`, `useTasks`, `useDebounce`, `usePagination`, `useUpload` | `hooks/` | ✅ |
| React Router, route params | `/teams/:teamId`, `/boards/:boardId` with `useParams` | `App.jsx` | ✅ |
| Nested routes | Team layout tabs; task drawer under the board | `App.jsx`, `TeamLayout.jsx` | ✅ |
| API integration with Axios/Fetch | Axios instance + per-resource modules | `api/` | ✅ |
| State management, prop drilling, Context API | Context replaces drilling the user and role through 4 levels | `context/` | ✅ |
| Styling in React, Tailwind/Bootstrap | Tailwind | `index.css`, components | ✅ |

## Unit 7: Full-stack integration (8%), CE-2

| CHO topic | Where in Syncora | File(s) | |
|---|---|---|---|
| Connecting React with Node/Express APIs | Axios → `/api` | `api/client.js` | ✅ |
| CORS | `cors({ origin: CLIENT_URL })`; explain why the proxy hides it locally | `app.js` | ✅ |
| Environment variables | `server/.env`, `client/.env` (`VITE_API_URL`), `config/env.js` validation | | ✅ |
| Proxy setup | Vite `server.proxy` for `/api` and `/uploads` | `vite.config.js` | ✅ |
| Authentication flow | Register/login → token → `/auth/me` restore | `AuthContext.jsx`, DATA_FLOW.md §2 to 3 | ✅ |
| JWT storage | `localStorage` + Axios header; cookie alternative explained | `api/client.js`, SYSTEM_DESIGN.md §13 | ✅ |
| Auth context | `AuthProvider` | `context/AuthContext.jsx` | ✅ |
| Protected routes | `ProtectedRoute`, `GuestRoute` | `components/auth/` | ✅ |
| Login/logout | Pages + global 401 handling | `LoginPage.jsx`, interceptor | ✅ |
| Role-based UI | `RoleGate`, `can()` permission map | `utils/permissions.js` | ✅ |
| CRUD full stack | Teams, boards, tasks, comments end to end | | ✅ |
| Loading states, error states | Skeletons, `ErrorState` with retry, toasts | `components/common/` | ✅ |
| File upload full stack, progress bars | Attachments with `onUploadProgress` + `ProgressBar` | `AttachmentUploader.jsx`, `useUpload.js` | 🟡 |
| Search, filters, pagination (frontend) | Board filters + debounced search + pagination in URL | `BoardFilters.jsx`, `Pagination.jsx` | ✅ |
| Form validation, error messages | Client checks + server `details[]` mapped to fields | `TaskForm.jsx` | ✅ |
| UX basics | Empty states, confirm dialogs, optimistic moves, responsive | FRONTEND.md §7 | ✅ |
| Integration testing | Supertest API tests + manual end-to-end demo script | `server/tests/`, TESTING.md | ✅ |
| Bug fixing, polishing | Bug log in TESTING.md §7 | | ✅ |

## Unit 8: Advanced backend and DevOps (4%), ETE only

| CHO topic | Where in Syncora | File(s) | |
|---|---|---|---|
| Microservices basics, API gateway, service discovery | Discussed as the scaling path; not built | SYSTEM_DESIGN.md §12 | 🔵 |
| Logging, Winston/Morgan, structured logging | JSON logs with `requestId` | `utils/logger.js`, `middleware/requestId.js` | 🔵 (cheap, can do for CE-2) |
| Caching, Redis, cache strategies | Cache-aside for stats and dashboard, TTL + invalidation | `utils/cache.js`, `config/redis.js` | 🔵 |
| Docker basics, Dockerfile | Server and client Dockerfiles | `server/Dockerfile`, `client/Dockerfile` | 🔵 |
| Docker Compose | api + client + mongo + redis | `docker-compose.yml` | 🔵 |
| CI/CD basics, GitHub Actions | Lint, test, build on push and PR | `.github/workflows/ci.yml` | 🔵 |
| Deploy workflow, cloud platforms | Render (API), Vercel (client), Atlas, Upstash | DEVOPS_DEPLOYMENT.md | 🔵 |
| Environment configurations | `config/env.js`, per-environment `.env`, host env vars | | 🔵 |

## Units 1 to 4 (CE-1): used throughout

| Unit | Topics | Where Syncora uses them |
|---|---|---|
| 1. Web fundamentals | HTML, CSS, DOM, events, ES6, async JS, Fetch, Promises, async/await, NPM, package.json, Git/GitHub | The whole client; async/await everywhere; repo and branches |
| 2. Node.js core | Modules (CommonJS), fs (deleting attachment files with `fs.promises`), path (upload paths), events (`process.on('SIGTERM')`, Mongoose connection events), streams (Winston file transports, file downloads), HTTP server (`app.listen`), npm scripts | `server.js`, `upload.js`, `attachment.service.js`, `logger.js` |
| 3. Frontend basics and debugging | Tailwind, reusable UI, debugging Node (VS Code debugger, `--inspect`), ESLint, logging | `components/common/`, `.eslintrc.json`, `logger.js` |
| 4. Express and REST | Middleware, routing, params, query, body parsing, REST design, CRUD, status codes, error middleware, custom middleware, validation, sanitization, JWT, password hashing, auth middleware, protected routes, role-based access, Multer, cloud storage intro, Postman | The entire `server/src/` + `postman/` |

## How to use this in the viva

When asked "where did you use X?", open the file in the table. Have these open in VS Code tabs before the viva: `models/Task.js`, `services/stats.service.js`, `middleware/auth.js`, `middleware/teamAccess.js`, `middleware/errorHandler.js`, `context/AuthContext.jsx`, `api/client.js`, `App.jsx`.
