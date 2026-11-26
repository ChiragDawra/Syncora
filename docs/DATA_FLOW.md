# Syncora: data flow

How data moves through the system for each key action. Each flow lists the steps, the files involved, and what can go wrong. The diagrams are Mermaid, which GitHub renders.

## 1. Big picture

```mermaid
flowchart LR
  UI[React component] -->|calls| H[custom hook / service<br/>api/tasks.js]
  H -->|Axios instance<br/>adds Bearer token| N((HTTP))
  N --> G[Express global middleware<br/>helmet, cors, json, morgan]
  G --> RT[Route + route middleware<br/>protect, access, validate, upload]
  RT --> CT[Controller]
  CT --> SV[Service<br/>business rules, activity, cache]
  SV --> MD[Mongoose model] --> DB[(MongoDB)]
  SV -.-> RC[(Redis)]
  CT -->|ApiResponse JSON| N
  N -->|response / error| H -->|state update| UI
  RT -.error.-> EH[errorHandler] -.JSON error.-> N
```

## 2. Register and login

```mermaid
sequenceDiagram
  actor U as User
  participant C as React (LoginPage + AuthContext)
  participant A as Express /api/auth
  participant V as express-validator
  participant DB as MongoDB (users)
  U->>C: email + password, submit
  C->>C: client-side validation (required, email format)
  C->>A: POST /api/auth/login
  A->>A: authLimiter (rate limit)
  A->>V: validate body
  V-->>A: ok (or 400 VALIDATION_ERROR)
  A->>DB: findOne({ email }).select('+password')
  DB-->>A: user or null
  A->>A: bcrypt.compare(password, hash)
  alt match
    A->>A: jwt.sign({ sub: user._id }, JWT_SECRET, 7d)
    A-->>C: 200 { user, token }
    C->>C: dispatch LOGIN_SUCCESS, save token to localStorage
    C->>U: redirect to /teams (or the page they came from)
  else no user or wrong password
    A-->>C: 401 INVALID_CREDENTIALS
    C->>U: "Email or password is incorrect"
  end
```

Files: `client/src/pages/LoginPage.jsx`, `context/AuthContext.jsx`, `api/auth.js`, `server/src/routes/auth.routes.js`, `validators/auth.validators.js`, `controllers/auth.controller.js`, `services/auth.service.js`, `models/User.js`.

Register is the same, except it checks the email isn't taken (409), and the password is hashed by the `pre('save')` hook.

## 3. App start: restoring the session

1. `AuthProvider` mounts and reads the token from `localStorage`.
2. If there's a token, it calls `GET /api/auth/me`.
3. 200: dispatch `SESSION_RESTORED`. 401: clear the token and dispatch `LOGOUT`.
4. While this runs, `status = 'checking'` and `ProtectedRoute` shows a full-page spinner instead of redirecting, so a refresh doesn't flash the login page.

## 4. Any protected request (the middleware chain)

```mermaid
sequenceDiagram
  participant C as Axios
  participant P as protect
  participant L as loadBoard
  participant R as requireTeamRole('member')
  participant V as validate
  participant K as controller
  participant E as errorHandler
  C->>P: GET /api/boards/:boardId/tasks (Authorization: Bearer ...)
  P->>P: jwt.verify, User.findById(sub)
  alt token missing/invalid/expired
    P->>E: AppError 401
    E-->>C: 401 JSON
  end
  P->>L: req.user set
  L->>L: Board.findById(boardId) (404 if missing, 400 if bad id)
  L->>R: req.board set, teamId = board.team
  R->>R: Team.findById(teamId), team.getRole(req.user._id)
  alt not a member / role too low
    R->>E: AppError 403
    E-->>C: 403 JSON
  end
  R->>V: req.membership = { team, role }
  V->>K: query params valid
  K-->>C: 200 { data, meta }
```

On the client, the Axios **response interceptor** handles 401 globally: clear the token, dispatch `LOGOUT`, redirect to `/login?expired=1`.

## 5. Create a task

1. `CreateTaskModal` (controlled form) validates the title and due date locally.
2. `api.tasks.create(boardId, body)` → `POST /api/boards/:boardId/tasks`.
3. Server chain: `protect → loadBoard → requireTeamRole('member') → validate(createTaskRules) → taskController.create`.
4. `taskService.create`:
   - checks the assignee is in `team.members` (else 400),
   - sets `team = board.team`, `createdBy = req.user._id`,
   - sets `position` = (max position in that status column) + 1,
   - `Task.create(...)`, then populates `assignee` and `createdBy`,
   - writes an `Activity` (`task.created`),
   - deletes the cache keys `board:{id}:stats` and `team:{id}:dashboard` (ETE).
5. 201 with the task. The board page appends it to the To Do column and shows a toast.

## 6. Move a task (drag and drop or the status dropdown)

1. The UI updates the column **optimistically** (moves the card immediately) and remembers the previous state.
2. `PATCH /api/tasks/:taskId/move { status, position }`.
3. `taskService.move`:
   - in the target column, `$inc: { position: 1 }` for tasks at or after the new position,
   - sets the task's status and position (the `pre('save')` hook sets or clears `completedAt`),
   - logs `task.moved { from, to }`, and invalidates the caches.
4. On success, keep the optimistic state. On error, roll back to the saved state and show the error toast.

## 7. List tasks with filters, search and pagination

```mermaid
flowchart TD
  Q["UI filters: status, priority, assignee=me, q, page"] --> U["useSearchParams keeps filters in the URL"]
  U --> D["useDebounce(q, 400ms)"]
  D --> F["useTasks(boardId, filters) builds the query string"]
  F --> API["GET /boards/:id/tasks?status=todo&assignee=me&q=login&page=2"]
  API --> B["buildTaskQuery(): whitelist keys,<br/>map assignee=me to req.user._id,<br/>q to $text, overdue to dueDate<now & status!=done"]
  B --> P["Promise.all([<br/>Task.find(filter).sort().skip().limit().populate().lean(),<br/>Task.countDocuments(filter) ])"]
  P --> R["{ data, meta: { page, limit, total, totalPages, hasNext } }"]
  R --> UI2["Render list + Pagination component;<br/>empty state if total = 0"]
```

Filters live in the URL, so refresh, back and forward work and links are shareable.

## 8. Upload attachments

```mermaid
sequenceDiagram
  participant C as React (AttachmentUploader)
  participant A as Express
  participant M as Multer
  participant FS as uploads/ or Cloudinary
  participant DB as MongoDB
  C->>C: pick files, check size and type locally
  C->>A: POST /tasks/:id/attachments (FormData, onUploadProgress)
  A->>A: protect → loadTask → requireTeamRole('member')
  A->>M: upload.array('files', 5)
  M->>M: fileFilter (type), limits (5 MB, 5 files)
  alt rejected
    M-->>A: MulterError / AppError
    A-->>C: 413 FILE_TOO_LARGE or 400 UNSUPPORTED_FILE_TYPE
  end
  M->>FS: write <uuid>.<ext>
  M->>A: req.files metadata
  A->>DB: task.attachments.push(...), save
  alt save fails
    A->>FS: unlink written files (cleanup)
  end
  A->>DB: Activity attachment.added
  A-->>C: 201 { attachments }
  C->>C: progress bar reaches 100%, list refreshes
```

## 9. Dashboard with Redis cache-aside (ETE)

```mermaid
sequenceDiagram
  participant C as Client
  participant S as statsService
  participant R as Redis
  participant DB as MongoDB
  C->>S: GET /teams/:id/dashboard
  S->>R: GET team:{id}:dashboard
  alt cache hit
    R-->>S: JSON
    S-->>C: 200 { ..., cached: true }
  else miss or Redis down
    S->>DB: aggregate (workload, dueSoon, completedPerDay)
    DB-->>S: results
    S->>R: SET team:{id}:dashboard JSON EX 60 (ignore errors)
    S-->>C: 200 { ..., cached: false }
  end
  Note over S,R: Any task or member write in the team runs DEL on team:{id}:dashboard and board:{boardId}:stats
```

## 10. Add a member

1. Owner or admin types an email in `MembersPanel`.
2. `POST /teams/:teamId/members { email, role }`.
3. Service: find the user by email (404), check they aren't already a member (409), and only the owner may add an `admin` (403). Then `$push` to `members`, log `member.added`, clear the dashboard cache.
4. The new member sees the team in `GET /teams` the next time they load the page.

## 11. Delete a team (cascade)

1. Owner confirms in a dialog (types the team name).
2. `DELETE /teams/:teamId` → `requireTeamRole('owner')`.
3. Service in a transaction: collect the board ids, then the task ids and attachment file names; `deleteMany` comments, tasks, boards and activities; delete the team; commit.
4. After commit, delete the files (errors only logged) and the cache keys.
5. 200, the client navigates to `/teams` and refetches.

## 12. Error flow

```
throw new AppError('Assignee is not a member of this team', 400, 'VALIDATION_ERROR')
  -> asyncHandler catches -> next(err)
  -> errorHandler: logger.warn (4xx) or logger.error (5xx, with stack), with requestId
  -> res.status(400).json({ success:false, error:{ code, message, details }, requestId })
Client: Axios interceptor normalizes it to { status, code, message, details }
  -> forms show details[] next to fields; other errors become a toast; 401 logs out
```

## 13. Logging flow (ETE)

`request → requestId middleware (uuid) → morgan (http line) → winston (console + logs/combined.log) → errorHandler (logs/error.log with stack and requestId)`. The `requestId` is returned in error responses, so a user's error can be matched to the log line.
