# Syncora: folder structure

One repository (`Syncora`) with the API and the client side by side.

```
syncora/
├── CLAUDE.md                         # Claude Code project memory (imports AGENTS.md)
├── AGENTS.md                         # Rules for AI coding agents
├── README.md                         # Short: what it is, quick start, screenshots, links to docs/
├── docker-compose.yml                # ETE: api, client, mongo, redis
├── .github/
│   └── workflows/
│       └── ci.yml                    # ETE: lint + test + build
├── docs/                             # These documentation files
│   ├── PRD.md  SYSTEM_DESIGN.md  TECH_STACK.md  DATABASE.md  API_SPEC.md
│   ├── DATA_FLOW.md  FRONTEND.md  FOLDER_STRUCTURE.md  BUILD_PLAN.md
│   ├── TESTING.md  DEVOPS_DEPLOYMENT.md  SYLLABUS_COVERAGE.md  REPORT_AND_VIVA.md
│   └── diagrams/                     # exported PNGs for the report and deck
├── postman/
│   ├── Syncora.postman_collection.json
│   └── Syncora.local.postman_environment.json
│
├── server/
│   ├── package.json                  # scripts: dev, start, test, lint, seed
│   ├── .env.example
│   ├── eslint.config.js  .prettierrc     # ESLint 9 flat config
│   ├── Dockerfile                    # ETE
│   ├── jest.config.js
│   ├── uploads/                      # local attachments (gitignored, keep a .gitkeep)
│   ├── logs/                         # winston files (gitignored)
│   ├── scripts/
│   │   ├── seed.js                   # demo data (refuses to run in production)
│   │   └── dev-memory.js             # npm run dev:memory: local MongoDB via mongodb-memory-server + API
│   ├── src/
│   │   ├── server.js                 # load env, connect DB (and Redis), app.listen, graceful shutdown
│   │   ├── app.js                    # express app: global middleware, routes, 404, errorHandler
│   │   ├── config/
│   │   │   ├── env.js                # read + validate env vars once; export a frozen object
│   │   │   ├── db.js                 # mongoose.connect
│   │   │   ├── redis.js              # ETE: ioredis client (optional)
│   │   │   └── cloudinary.js         # optional
│   │   ├── models/
│   │   │   ├── User.js  Team.js  Board.js  Task.js  Comment.js  Activity.js
│   │   ├── routes/
│   │   │   ├── index.js              # mounts every router under /api
│   │   │   ├── auth.routes.js  team.routes.js  board.routes.js
│   │   │   ├── task.routes.js  comment.routes.js  admin.routes.js  health.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js  team.controller.js  board.controller.js
│   │   │   ├── task.controller.js  attachment.controller.js  comment.controller.js
│   │   │   ├── stats.controller.js  admin.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js  team.service.js  board.service.js  task.service.js
│   │   │   ├── attachment.service.js  comment.service.js  activity.service.js  stats.service.js
│   │   ├── middleware/
│   │   │   ├── auth.js               # protect (verify JWT), restrictTo (platform role)
│   │   │   ├── loaders.js            # loadTeam, loadBoard, loadTask, loadComment
│   │   │   ├── teamAccess.js         # requireTeamRole(...roles)
│   │   │   ├── validate.js           # run express-validator rules, format 400
│   │   │   ├── upload.js             # multer config: storage, limits, fileFilter
│   │   │   ├── rateLimit.js          # authLimiter, apiLimiter
│   │   │   ├── requestId.js
│   │   │   ├── notFound.js
│   │   │   └── errorHandler.js
│   │   ├── validators/
│   │   │   ├── auth.validators.js  team.validators.js  board.validators.js
│   │   │   ├── task.validators.js  comment.validators.js  common.validators.js  # objectId, pagination
│   │   └── utils/
│   │       ├── AppError.js           # class AppError extends Error { statusCode, code, details }
│   │       ├── asyncHandler.js
│   │       ├── ApiResponse.js        # ok(res, data, meta), created(res, data)
│   │       ├── pagination.js         # parsePagination(query) -> { page, limit, skip }
│   │       ├── buildTaskQuery.js     # whitelist filters -> mongo filter + sort
│   │       ├── token.js              # signToken(userId)
│   │       ├── logger.js             # winston instance + morgan stream
│   │       ├── cache.js              # ETE: getOrSet(key, ttl, fn), del(...keys); no-op without Redis
│   │       ├── files.js              # upload folder, safe paths, removeFiles()
│   │       └── transaction.js        # runInTransaction(): session on a replica set, plain run otherwise
│   └── tests/
│       ├── env.js                    # test env vars, loaded before any module
│       ├── setup.js                  # mongodb-memory-server start/stop, clear between tests
│       ├── helpers.js                # createUser(), login(), createTeamWithMembers()
│       ├── auth.test.js  teams.test.js  boards.test.js  tasks.test.js
│       ├── attachments.test.js  comments.test.js  stats.test.js  unit.test.js
│       └── fixtures/                 # sample.pdf, sample.png, fake.exe
│
└── client/
    ├── package.json                  # scripts: dev, build, preview, lint
    ├── .env.example
    ├── vite.config.js                # react plugin, tailwind plugin, /api proxy
    ├── Dockerfile  nginx.conf        # ETE: build static files, serve with nginx
    ├── index.html
    └── src/
        ├── main.jsx                  # ReactDOM.createRoot, <BrowserRouter>, <Toaster/>
        ├── App.jsx                   # <Routes> tree
        ├── index.css                 # tailwind import
        ├── api/
        │   ├── client.js             # axios instance + interceptors
        │   ├── auth.js  teams.js  boards.js  tasks.js  comments.js  attachments.js
        ├── context/
        │   ├── AuthContext.jsx       # provider + reducer
        │   └── TeamContext.jsx
        ├── hooks/
        │   ├── useAuth.js  useTeam.js  useFetch.js  useTasks.js
        │   ├── useDebounce.js  usePagination.js  useUpload.js
        ├── pages/
        │   ├── LoginPage.jsx  RegisterPage.jsx  TeamsPage.jsx  TeamBoardsPage.jsx
        │   ├── TeamDashboardPage.jsx  ActivityPage.jsx  TeamSettingsPage.jsx
        │   ├── BoardPage.jsx  MyTasksPage.jsx  ProfilePage.jsx  NotFoundPage.jsx
        ├── components/               # see FRONTEND.md section 5
        └── utils/
            ├── permissions.js        # role -> allowed actions (mirrors the server matrix)
            ├── format.js             # dates, file sizes
            └── constants.js          # STATUSES, PRIORITIES, labels
```

## Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Server files | `name.layer.js` | `task.controller.js` |
| Models | PascalCase singular | `Task.js` → collection `tasks` |
| React components | PascalCase `.jsx` | `TaskCard.jsx` |
| Hooks | `useSomething.js` | `useDebounce.js` |
| Env vars | UPPER_SNAKE | `JWT_SECRET` |
| API paths | plural nouns, kebab-case | `/api/teams/:teamId/members` |
| Branches | `feat/…`, `fix/…`, `docs/…` | `feat/task-filters` |
| Commits | Conventional Commits | `feat(tasks): add text search` |

## `.gitignore`

```
node_modules/
.env
server/uploads/*
!server/uploads/.gitkeep
server/logs/
client/dist/
coverage/
.DS_Store
```

## Package scripts

`server/package.json`:

```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "test": "jest --runInBand",
  "test:cov": "jest --runInBand --coverage",
  "lint": "eslint src tests",
  "format": "prettier --write .",
  "seed": "node scripts/seed.js"
}
```

`client/package.json`:

```json
"scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview", "lint": "eslint src" }
```
