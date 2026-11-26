# Syncora: Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product | Syncora, a team task management board |
| Course | Back End Engineering-II (24CSE0315), Chitkara University |
| Evaluation | CE-2 (units 5 to 7), ETE (adds unit 8) |
| Version | 1.0 (pre-build) |
| Owners | _Team names and roll numbers here_ |

## 1. Problem

Student and small project teams track work in group chats and spreadsheets. Messages scroll away, nobody knows who owns a task, deadlines slip, and files end up scattered across chats. Tools such as Jira or Trello are either heavy or don't give a team a simple shared view of "who is doing what, by when".

## 2. Goal

Give a small team one place where every task has an owner, a status, a priority, a due date, its files and its discussion, with access limited to the team.

### Objectives (measurable)

1. A new user can register, create a team, invite a teammate and create a first task in under 2 minutes.
2. Every task shows owner, status, priority and due date on the board without opening it.
3. Only team members can read a team's boards and tasks (verified by 403 tests).
4. Task lists of 1,000+ tasks load page by page in under 300 ms on the API (paginated, indexed).
5. Board statistics (tasks per status, overdue count, workload per member) are computed server-side.

## 3. Users and roles

| Persona | Description | Needs |
|---|---|---|
| Team owner | Creates the team, usually the project lead | Manage members and roles, create and delete boards, see progress |
| Team admin | Trusted member promoted by the owner | Manage boards and members (but not the owner) |
| Team member | Regular contributor | Create and update tasks, comment, attach files, see own work |
| Platform admin (optional) | Site administrator | See all users and teams; deactivate abusive accounts |

Roles are **per team** (stored in `team.members[].role`). A person can be owner in one team and member in another. The optional platform admin is stored on `user.role`.

## 4. Features

Priority: **P0** must ship for CE-2, **P1** should ship for CE-2, **P2** ETE or later.

### 4.1 Accounts (P0)
- Register with name, email and password (min 8 characters, a letter and a number).
- Log in with email and password; receive a JWT valid for 7 days.
- View and edit own profile (name, avatar image upload is P1).
- Log out (client discards the token).

### 4.2 Teams (P0)
- Create a team; the creator becomes **owner**.
- List teams I belong to, with my role in each.
- Owner or admin adds a member by email (the user must already be registered).
- Owner changes a member's role (member ↔ admin).
- Owner or admin removes a member; a member can leave; the owner can't leave without deleting the team.
- Owner deletes the team, which deletes its boards, tasks, comments and attachment files.

### 4.3 Boards (P0)
- Owner or admin creates, renames, archives and deletes boards in a team.
- Any member lists the team's boards with a task count per board.

### 4.4 Tasks (P0)
- Any member creates a task: title (required), description, status, priority, assignee (must be a team member), due date, labels.
- Board view shows three columns (To Do, In Progress, Done), ordered by position.
- Move a task between columns and reorder within a column.
- Edit any field; reassign.
- Delete: the task's creator, or the team's owner or admin.
- "My tasks": every task assigned to me across all my teams.

### 4.5 Search, filter, sort and pagination (P0)
- Filter by status, priority, assignee (including `me`), label, overdue.
- Full-text search on title and description.
- Sort by created date, due date or priority.
- Paginate with `page` and `limit` (default 20, max 100).

### 4.6 Comments (P1)
- Members comment on a task; list newest first, paginated.
- The author, or the team's owner or admin, deletes a comment.

### 4.7 Attachments (P1)
- Upload up to 5 files per request to a task (max 5 MB each; PNG, JPG, WEBP, PDF, DOCX, TXT).
- Upload progress bar in the UI.
- Download and delete attachments (uploader, owner or admin).

### 4.8 Dashboard and statistics (P1)
- Board stats: count per status, overdue count, completion percentage.
- Team dashboard: workload per member (open tasks), tasks due in the next 7 days.
- Computed with MongoDB aggregation pipelines.

### 4.9 Activity log (P1)
- Record create, update, move, delete, comment, attach and member changes.
- Team activity feed, newest first, paginated. Entries auto-expire after 90 days (TTL index).

### 4.10 Operations (P2, ETE)
- Request logging (Morgan) into structured logs (Winston), with a request id.
- Redis cache for board stats and team dashboard (60 s TTL, cleared on writes).
- Docker Compose for API, MongoDB, Redis and client.
- GitHub Actions CI: lint, test, build on every push and pull request.
- Deployment: API on Render (or Railway), client on Vercel, DB on MongoDB Atlas, Redis on Upstash.

## 5. User stories and acceptance criteria

| ID | Story | Acceptance criteria |
|---|---|---|
| US-01 | As a visitor I register so I can use Syncora | 201 with user and token; duplicate email returns 409; weak password returns 400 with a field error |
| US-02 | As a user I log in | Correct credentials return 200 and a token; wrong password returns 401 with a generic message (no hint which field is wrong) |
| US-03 | As a user I create a team | 201; I'm listed as owner; team appears in my teams list |
| US-04 | As an owner I add a teammate by email | 201; unknown email returns 404; already-member returns 409; a plain member trying it gets 403 |
| US-05 | As an owner I promote a member to admin | 200; role changes; admins can now create boards |
| US-06 | As an admin I create a board | 201; it appears for every member |
| US-07 | As a member I add a task and assign it | 201; assignee must be a team member, else 400 |
| US-08 | As a member I move a task to Done | 200; status and position update; activity entry recorded; board stats change |
| US-09 | As a member I filter the board to my high-priority tasks | Only matching tasks return; `meta.total` is correct |
| US-10 | As a member I search "login bug" | Tasks whose title or description match are returned, best match first |
| US-11 | As a member I attach a PDF to a task | 201; file stored; attachment listed with name, size, type; a 6 MB file returns 413; an `.exe` returns 400 |
| US-12 | As a member I comment on a task | 201; comment shows author name and time |
| US-13 | As a non-member I try to open another team's board | 403, no data leaks |
| US-14 | As an owner I see who has the most open tasks | Dashboard shows open-task count per member, sorted |
| US-15 | As an owner I delete the team | 200; boards, tasks, comments and files are removed |

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Security | bcrypt (cost 10 to 12); JWT signed with a 32+ character secret from env; Helmet headers; CORS limited to the client origin; rate limit on auth routes (10 per 15 min per IP); inputs validated and sanitized; no stack traces in production responses; NoSQL injection guarded (express-validator plus Mongoose `sanitizeFilter`) |
| Performance | Indexed queries for every list endpoint; pagination everywhere; stats cached in Redis (ETE) |
| Reliability | Central error handler; consistent JSON error shape; health endpoint; graceful shutdown on SIGTERM |
| Usability | Loading, empty and error states on every page; forms validate before submit; mobile-friendly layout (Tailwind) |
| Maintainability | MVC-style layering; ESLint and Prettier; tests for every route; docs kept in sync |
| Portability | Runs locally with `npm run dev` or with `docker compose up` |

## 7. Out of scope (future scope for the report)

- Real-time updates (Socket.io) and notifications.
- Email invites and password reset by email.
- OAuth sign-in (Google, GitHub).
- Custom columns per board, sub-tasks, time tracking.
- Microservices split, API gateway, service discovery (discussed in SYSTEM_DESIGN.md as a scaling path only).

## 8. Success metrics for the evaluation

| CE-2 component | Marks | What "done" looks like |
|---|---|---|
| Execution (live demo) | 10 | The demo script in REPORT_AND_VIVA.md runs end to end without errors |
| Report | 10 | Every chapter of the course format filled from these docs, with real screenshots |
| PPT | 10 | 10 to 12 slides on the course template |
| Viva | 20 | Every member can explain the middleware chain, JWT flow, schema design and one aggregation |

## 9. Risks

| Risk | Mitigation |
|---|---|
| Not enough time before the CE-2 slot | Minimum cut in BUILD_PLAN.md: API + Postman + login and board pages |
| Campus Wi-Fi blocks Atlas | Phone hotspot; local MongoDB via Docker as fallback |
| Uploads lost on free hosting (ephemeral disk) | Use Cloudinary once deployed |
| One person writes all the code and others can't answer the viva | Split by module; everyone reads SYSTEM_DESIGN.md and DATA_FLOW.md |
