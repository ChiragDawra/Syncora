# Syncora: REST API specification

- Base URL (local): `http://localhost:5000/api`
- Format: JSON (`Content-Type: application/json`), except uploads (`multipart/form-data`).
- Auth: `Authorization: Bearer <JWT>` on every route except register, login and health.
- IDs: MongoDB ObjectIds (24 hex characters). An invalid id returns 400 `INVALID_ID`.

## 1. Response envelope

Success:

```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 57, "totalPages": 3, "hasNext": true } }
```

`meta` appears only on paginated lists.

Error:

```json
{ "success": false, "error": { "code": "FORBIDDEN", "message": "You are not a member of this team", "details": [] }, "requestId": "b2c1..." }
```

## 2. Status codes

| Code | When |
|---|---|
| 200 OK | Read, update, delete succeeded |
| 201 Created | Resource created |
| 400 Bad Request | Validation failed, invalid id, unsupported file type |
| 401 Unauthorized | No token, bad token, expired token, wrong login credentials |
| 403 Forbidden | Logged in but not a member, or role too low |
| 404 Not Found | Resource or route doesn't exist |
| 409 Conflict | Duplicate email, duplicate board name, already a member |
| 413 Payload Too Large | File over 5 MB, JSON body over 1 MB |
| 429 Too Many Requests | Auth rate limit hit |
| 500 Internal Server Error | Unexpected failure (details only in logs) |

## 3. Error codes

`VALIDATION_ERROR`, `INVALID_ID`, `NO_TOKEN`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `FORBIDDEN`, `NOT_FOUND`, `DUPLICATE`, `ALREADY_MEMBER`, `OWNER_CANNOT_LEAVE`, `FILE_TOO_LARGE`, `PAYLOAD_TOO_LARGE` (JSON body over 1 MB), `UNSUPPORTED_FILE_TYPE`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## 4. Endpoint summary

Roles: **any** = no login, **auth** = logged in, **M** = team member (any role), **A** = owner or admin, **O** = owner only.

| # | Method | Path | Access | Purpose |
|---|---|---|---|---|
| 1 | GET | `/health` | any | Liveness: `{ status, uptime, db }` |
| 2 | POST | `/auth/register` | any | Create account, return token |
| 3 | POST | `/auth/login` | any | Return token |
| 4 | GET | `/auth/me` | auth | Current user |
| 5 | PATCH | `/auth/me` | auth | Update name |
| 6 | POST | `/auth/me/avatar` | auth | Upload avatar image (Multer, single) |
| 7 | PATCH | `/auth/me/password` | auth | Change password (needs current password) |
| 8 | POST | `/teams` | auth | Create team (caller = owner) |
| 9 | GET | `/teams` | auth | My teams with my role |
| 10 | GET | `/teams/:teamId` | M | Team with populated members |
| 11 | PATCH | `/teams/:teamId` | A | Edit name, description |
| 12 | DELETE | `/teams/:teamId` | O | Delete team (cascade) |
| 13 | POST | `/teams/:teamId/members` | A | Add member by email |
| 14 | PATCH | `/teams/:teamId/members/:userId` | O | Change role (admin ↔ member) |
| 15 | DELETE | `/teams/:teamId/members/:userId` | A or self | Remove member or leave |
| 16 | GET | `/teams/:teamId/dashboard` | M | Workload, due soon, completed per day (aggregation, cached) |
| 17 | GET | `/teams/:teamId/activity` | M | Activity feed (paginated) |
| 18 | POST | `/teams/:teamId/boards` | A | Create board |
| 19 | GET | `/teams/:teamId/boards` | M | List boards with task counts |
| 20 | GET | `/boards/:boardId` | M | One board |
| 21 | PATCH | `/boards/:boardId` | A | Rename, describe, color, archive |
| 22 | DELETE | `/boards/:boardId` | A | Delete board (cascade) |
| 23 | GET | `/boards/:boardId/stats` | M | Counts by status and priority, overdue (aggregation, cached) |
| 24 | POST | `/boards/:boardId/tasks` | M | Create task |
| 25 | GET | `/boards/:boardId/tasks` | M | List, filter, search, sort, paginate |
| 26 | GET | `/tasks/mine` | auth | Tasks assigned to me across teams (paginated) |
| 27 | GET | `/tasks/:taskId` | M | One task, populated |
| 28 | PATCH | `/tasks/:taskId` | M | Edit fields |
| 29 | PATCH | `/tasks/:taskId/move` | M | Change status and position |
| 30 | DELETE | `/tasks/:taskId` | A or creator | Delete task |
| 31 | POST | `/tasks/:taskId/attachments` | M | Upload 1 to 5 files (field `files`) |
| 32 | DELETE | `/tasks/:taskId/attachments/:attachmentId` | A or uploader | Remove file |
| 33 | GET | `/tasks/:taskId/comments` | M | List comments (paginated) |
| 34 | POST | `/tasks/:taskId/comments` | M | Add comment |
| 35 | PATCH | `/comments/:commentId` | author | Edit comment |
| 36 | DELETE | `/comments/:commentId` | A or author | Delete comment |
| 37 | GET | `/admin/users` | platform admin | All users (paginated, search) |
| 38 | GET | `/admin/stats` | platform admin | Counts of users, teams, tasks |

Routes 37 and 38 are optional (P2).

## 5. Endpoint details

### 5.1 Auth

**POST `/auth/register`**

Request:
```json
{ "name": "Chirag Dawra", "email": "chirag@example.com", "password": "Password123" }
```
Rules: `name` 2 to 60 chars; `email` valid, normalized; `password` 8 to 64 chars with at least one letter and one number.

201:
```json
{ "success": true, "data": { "user": { "_id": "665f...", "name": "Chirag Dawra", "email": "chirag@example.com", "role": "user", "avatarUrl": "", "createdAt": "..." }, "token": "eyJhbGciOi..." } }
```
Errors: 400 `VALIDATION_ERROR`, 409 `DUPLICATE` (email), 429.

**POST `/auth/login`**

Request: `{ "email": "...", "password": "..." }`. 200 same shape as register. Errors: 401 `INVALID_CREDENTIALS` (same message for unknown email and wrong password), 429.

**GET `/auth/me`** → 200 `{ user }`. Errors: 401.

**PATCH `/auth/me/password`** → body `{ currentPassword, newPassword }`; 200 with a fresh token; 401 if current password is wrong.

**POST `/auth/me/avatar`** → `multipart/form-data`, field `avatar`, image only, max 2 MB; 200 `{ user }`.

### 5.2 Teams

**POST `/teams`** → `{ "name": "Syncora Core", "description": "BEE-II project team" }` → 201 `{ team }` with `members: [{ user, role: "owner" }]`.

**GET `/teams`** → 200 `[ { _id, name, description, memberCount, myRole, updatedAt } ]`.

**GET `/teams/:teamId`** → 200 `{ team }` with `members[].user` populated (`name`, `email`, `avatarUrl`).

**POST `/teams/:teamId/members`** → `{ "email": "friend@example.com", "role": "member" }` (role optional, `member` or `admin`; only the owner may add an admin) → 201 `{ team }`. Errors: 404 user not found, 409 `ALREADY_MEMBER`, 403.

**PATCH `/teams/:teamId/members/:userId`** → `{ "role": "admin" }` → 200. Can't change the owner's role (400).

**DELETE `/teams/:teamId/members/:userId`** → 200 `{ removed: true, left }`. Owner leaving returns 400 `OWNER_CANNOT_LEAVE`; anyone else trying to remove the owner gets 403. Admins can remove members but not other admins (403). The removed member's tasks in this team become unassigned.

**GET `/teams/:teamId/dashboard`** → 200:
```json
{ "success": true, "data": {
  "totals": { "total": 16, "open": 11, "done": 5, "overdue": 3 },
  "workload": [ { "user": { "_id": "...", "name": "Aman" }, "open": 5, "overdue": 1, "urgent": 2 }, { "user": null, "open": 2, "overdue": 0, "urgent": 0 } ],
  "dueSoon": [ { "_id": "...", "title": "Write ER diagram", "dueDate": "...", "assignee": { "name": "Riya" }, "board": { "name": "Report" } } ],
  "completedPerDay": [ { "date": "2026-11-24", "done": 3 } ],
  "cached": false
} }
```

**GET `/teams/:teamId/activity?page=1&limit=20`** → 200 list `[ { action, actor: { name }, task: { title }, meta, createdAt } ]` + `meta`.

### 5.3 Boards

**POST `/teams/:teamId/boards`** → `{ "name": "Sprint 1", "description": "...", "color": "#6366f1" }` → 201. 409 on duplicate name in the team.

**GET `/teams/:teamId/boards?archived=false`** → 200 `[ { _id, name, color, archived, taskCount, createdAt } ]`.

**PATCH `/boards/:boardId`** → any of `name`, `description`, `color`, `archived` → 200.

**GET `/boards/:boardId/stats`** → 200:
```json
{ "success": true, "data": { "total": 12, "byStatus": { "todo": 5, "in_progress": 4, "done": 3 }, "byPriority": { "low": 2, "medium": 6, "high": 3, "urgent": 1 }, "overdue": 3, "completionRate": 25, "cached": true } }
```

### 5.4 Tasks

**POST `/boards/:boardId/tasks`**
```json
{ "title": "Build login API", "description": "JWT + bcrypt", "status": "todo", "priority": "high", "assignee": "665f...", "dueDate": "2026-11-27", "labels": ["backend", "auth"] }
```
Rules: `title` 3 to 120; `status` in `todo|in_progress|done`; `priority` in `low|medium|high|urgent`; `assignee` valid ObjectId **and a member of the board's team** (else 400); `dueDate` ISO date; `labels` ≤ 10 strings of ≤ 20 chars. Server sets `team`, `createdBy`, `position` (end of column). → 201 `{ task }` populated.

**GET `/boards/:boardId/tasks`**

| Query | Example | Meaning |
|---|---|---|
| `page` | `1` | Page number, default 1 |
| `limit` | `20` | Page size, default 20, max 100 |
| `status` | `todo` or `todo,in_progress` | One or more statuses |
| `priority` | `high,urgent` | One or more priorities |
| `assignee` | `me`, `<userId>`, `none` | Filter by assignee |
| `label` | `backend` | Has this label |
| `overdue` | `true` | Due date passed, not done |
| `dueBefore` / `dueAfter` | `2026-11-30` | Due date range |
| `q` | `login bug` | Text search on title and description |
| `sort` | `position`, `createdAt`, `-createdAt`, `dueDate`, `-dueDate`, `priority` (urgent first), `-priority` | Whitelisted sort; with `q` and no sort, best match first |

→ 200 `[ task, ... ]` + `meta`. Each task has `assignee` populated (`name`, `avatarUrl`) and `isOverdue`.

**GET `/tasks/mine?status=todo,in_progress&sort=dueDate`** → tasks assigned to me in all my teams, with `board.name` and `team.name`.

**PATCH `/tasks/:taskId`** → any of `title`, `description`, `priority`, `assignee` (or `null`), `dueDate` (or `null`), `labels` → 200. Logs `task.updated` with the changed fields.

**PATCH `/tasks/:taskId/move`** → `{ "status": "done", "position": 2 }` → 200. `position` is the position of the card the task is dropped in front of, as the client saw the column before the move (omit it to append to the end). The server closes the gap in the source column, shifts tasks at or after the slot in the target column, and keeps every column numbered 0..n-1. Logs `task.moved` with `{ from, to }`. Clears cached stats.

**DELETE `/tasks/:taskId`** → 200 `{ "deleted": true }`. Removes comments and files.

### 5.5 Attachments

**POST `/tasks/:taskId/attachments`** (`multipart/form-data`, field name `files`, 1 to 5 files)

```bash
curl -X POST http://localhost:5000/api/tasks/<taskId>/attachments \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@report-draft.pdf" -F "files=@er-diagram.png"
```

201 → `{ attachments: [ { _id, originalName, url, mimeType, size, uploadedBy, uploadedAt } ] }`. Errors: 400 `UNSUPPORTED_FILE_TYPE`, 413 `FILE_TOO_LARGE`, 400 if the task would exceed 20 attachments.

**DELETE `/tasks/:taskId/attachments/:attachmentId`** → 200; file removed from disk or Cloudinary.

### 5.6 Comments

**POST `/tasks/:taskId/comments`** → `{ "text": "Pushed the auth middleware" }` → 201 `{ comment }` with `author` populated.

**GET `/tasks/:taskId/comments?page=1&limit=20`** → newest first + `meta`.

**PATCH `/comments/:commentId`** → `{ text }` → 200, sets `edited: true`. Author only.

**DELETE `/comments/:commentId`** → 200.

## 6. Rate limits

| Route group | Limit |
|---|---|
| `/auth/login`, `/auth/register` | 10 failed requests per 15 minutes per IP (successful logins don't count; `AUTH_RATE_LIMIT_MAX`) |
| Everything else | 300 requests per 15 minutes per IP (optional) |

## 7. Versioning

Start at `/api`. If a breaking change is needed later, add `/api/v2` and keep `/api` working. Mention this as API design practice in the viva.

## 8. Postman

The collection mirrors this file folder by folder. See TESTING.md for the environment variables, the token capture script and the negative test cases.
