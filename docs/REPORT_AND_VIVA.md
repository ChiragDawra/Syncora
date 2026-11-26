# Syncora: report, deck, demo and viva

CE-2 (50 marks): report 10, PPT 10, execution 10, viva 20. Offline, in your Wednesday or Thursday lecture slot between 25 Nov and 3 Dec. Details come from the course notice of 17 Nov and the report format mail of 13 Nov.

## 1. Report: course format mapped to these docs

Formatting from the course format: headings Times New Roman 16, abstract 300 to 500 words, numbered and captioned figures and tables, one citation style throughout.

**Front matter:** title page ("Project Report on Syncora: A Team Task Management Board", BEE-II 24CSE0315, B.E. CSE batch 2024, July to Dec 2026, guide, students with roll numbers) → Certificate (Annexure C) → Declaration (Annexure D) → Acknowledgement (Annexure E) → Abstract → Contents → List of figures → List of tables.

| Chapter (Annexure F) | Source in these docs | Figures and tables to include |
|---|---|---|
| 1. Abstract and keywords | README summary paragraph, PRD §1 to 2 | none |
| 2.1 Background | PRD §1, SYSTEM_DESIGN §1 | Client-server diagram |
| 2.2 Problem statement, objectives, scope | PRD §1, §2, §4, §7 | Features table |
| 3.1 Methods | SYSTEM_DESIGN §1 to 7, DATA_FLOW §1 | Architecture diagram, request flow |
| 3.2 Working environment | TECH_STACK §2 to 5 | Stack table |
| 3.3 Requirements to run | TECH_STACK §4, DEVOPS §1 | Hardware and software table (4 GB RAM min, 8 GB recommended; Node 20; Atlas or local MongoDB; browser; Postman) |
| 4. Database analysis, design, implementation | DATABASE §1 to 7, §10 | ER diagram, collections table, index table, Compass screenshots, `explain()` screenshot |
| 5. Program structure and GUI | FOLDER_STRUCTURE, FRONTEND §1, §5 | Folder tree, module list, GUI screenshots |
| 6. Code implementation and DB connections | API_SPEC §4, SYSTEM_DESIGN §3 to 6, DATABASE §4 to 5 | Endpoint table, snippets: middleware order, `protect`, `requireTeamRole`, task controller, one aggregation, Multer config |
| 7. System testing | TESTING §1 to 6 | Test case table (filled), Postman runner screenshot, coverage screenshot |
| 8. Limitations | PRD §7, SYSTEM_DESIGN §12 | none |
| 9. Conclusion | PRD §2 objectives, what you learned | none |
| 10. Future scope | SYSTEM_DESIGN §12, DEVOPS (Redis, Docker, CI, deploy, microservices) | none |
| 11. References | Official docs: Node.js, Express, MongoDB, Mongoose, JWT (RFC 7519), bcrypt, React, React Router, Axios, Multer, Tailwind, Postman, OWASP | none |

Annexures (optional): GitHub link, full API_SPEC, sample JSON, extra screenshots.

## 2. Deck (10 to 12 slides on the course template)

The template gives a title slide, an Introduction slide and a Thank You slide, in Times New Roman.

1. Title (template): course, project title, names, roll numbers, guide, department.
2. Introduction and problem.
3. Objectives and scope.
4. Tech stack (one row per layer).
5. System architecture diagram.
6. Database design: ER diagram + embedding vs referencing.
7. API overview: 8 to 10 key endpoints, status codes.
8. Auth and role-based access: JWT flow + permission matrix (trimmed).
9. Key features: filters, search, pagination, uploads, aggregation stats (screenshots).
10. Testing: test summary + Postman runner screenshot.
11. Limitations and future scope (Redis, Docker, CI/CD, Socket.io).
12. Thank You (template).

## 3. Demo checklist (execution, 10 marks)

Before:

- [ ] Laptop charged; charger; phone hotspot in case campus Wi-Fi blocks Atlas.
- [ ] Atlas Network Access allows your IP (or `0.0.0.0/0`); local MongoDB in Docker as backup.
- [ ] `.env` present on the demo laptop; `npm run dev` in both folders works.
- [ ] `npm run seed` run that morning.
- [ ] Postman open with the environment selected and fresh tokens.
- [ ] MongoDB Compass open on the `tasks` collection.
- [ ] VS Code tabs: `models/Task.js`, `middleware/auth.js`, `middleware/teamAccess.js`, `services/stats.service.js`, `middleware/errorHandler.js`, `context/AuthContext.jsx`, `api/client.js`.
- [ ] Screen recording of the full demo as a fallback.

Demo script (about 6 minutes):

1. Log in as owner → teams → open "Syncora Core" (role-based buttons visible).
2. Board → create a task assigned to the member, priority high, due tomorrow.
3. Move a task to Done → stats strip updates (aggregation).
4. Filter Assignee = member, Priority = high; search "login"; show the URL holding the filters; page 2.
5. Open a task → comment → upload a PDF with the progress bar.
6. Postman: outsider token on the same board → **403**; no token → **401**; task without title → **400** with field details; 6 MB file → **413**.
7. Compass: show the new task document and `attachments[]` embedded; show indexes.
8. Owner's dashboard → workload per member.

## 4. Viva questions with short answers

### Project and design
1. **What is Syncora?** A team task board where members create boards and tasks, assign them, attach files and track status, with access limited to the team and permissions by role.
2. **Why this architecture?** A React SPA talks to a stateless Express REST API with JWT; MongoDB stores data. Stateless means any API instance can serve any request, so it scales horizontally.
3. **Why layers (routes, controllers, services, models)?** Each has one job. Routes wire middleware, controllers handle HTTP, services hold business rules and can be tested without HTTP, models own the data rules.

### Express and REST (CE-1 recap that still comes up)
4. **What is middleware? Name yours in order.** A function `(req, res, next)` between request and handler. Order: requestId, helmet, cors, compression, json parser, morgan, static uploads, routes (protect → loader → requireTeamRole → validate → upload), notFound, errorHandler.
5. **Why is the error handler last, with four arguments?** Express identifies error middleware by its four parameters and only calls it when `next(err)` is called; it must come after the routes.
6. **401 vs 403?** 401: not authenticated (no, bad or expired token). 403: authenticated but not allowed (not a member, or role too low).
7. **PUT vs PATCH?** PUT replaces the resource; PATCH changes part of it. Moving a task only changes status and position, so PATCH.
8. **How does JWT auth work?** Login signs `{ sub: userId }` with a secret and an expiry. The client sends it as `Bearer`; `protect` verifies the signature and expiry and loads the user. The server stores no session.
9. **How are passwords stored?** bcrypt hash with salt in a Mongoose `pre('save')` hook; `select: false` keeps it out of queries.

### MongoDB and Mongoose (unit 5)
10. **Embedding vs referencing in Syncora?** Embedded: team members and task attachments (small, bounded, read with the parent). Referenced: boards, tasks, comments (unbounded, queried alone). Unbounded arrays risk the 16 MB document limit.
11. **Why store `team` on each task?** Denormalization: one lookup for access checks and team-wide aggregation without `$lookup` through boards.
12. **What does populate do? Is it a join?** It runs a second query for referenced ids and replaces them with documents. It's done by Mongoose in the app, not by the database like a SQL join; `$lookup` is the database-side equivalent.
13. **Explain your board stats aggregation.** `$match` on the board, then `$facet` runs several sub-pipelines in one pass: `$group` by status, `$group` by priority, overdue `$match` + `$count`, and total `$count`.
14. **What is a compound index and why `{ board, status, position }`?** One index on several fields. The board view filters by board and status and sorts by position; following equality-sort-range order lets MongoDB use the index for both filter and sort.
15. **What is a text index?** An index on words in string fields; enables `$text` search with relevance scoring. Syncora weights title over description.
16. **What is a TTL index?** An index that makes MongoDB delete documents after a time; activity logs expire after 90 days.
17. **Virtuals and statics: examples?** Virtual `isOverdue` (computed, not stored), virtual populate `taskCount`. Static `Team.forUser(userId)`; instance method `user.comparePassword()`.
18. **Mongoose middleware examples?** `pre('save')` hashes passwords and sets `completedAt`; `pre('deleteOne')` deletes a task's comments.
19. **How do you stop NoSQL injection?** Whitelisted query params, express-validator types, and `mongoose.set('sanitizeFilter', true)`, which strips operator objects like `{ "$gt": "" }` from filters.
20. **How do you handle a bad ObjectId?** Mongoose throws `CastError`; the error handler turns it into 400 `INVALID_ID`.

### React (unit 6)
21. **Why Context and useReducer for auth?** Many components need the user; Context avoids prop drilling, and a reducer keeps login, logout and restore as explicit state transitions.
22. **What does your useFetch hook do?** Runs the request in `useEffect`, tracks `loading`, `error`, `data`, aborts stale requests with `AbortController`, and exposes `refetch`.
23. **Controlled vs uncontrolled inputs?** Controlled inputs take their value from React state and update through `onChange`, so validation and reset are simple.
24. **Why keys in lists?** They let React match items between renders; using `_id` avoids bugs when items reorder, unlike array indexes.
25. **Nested routes example?** `/teams/:teamId` layout with dashboard, activity and settings children rendered in `<Outlet/>`; the task drawer is nested under the board route.

### Full-stack integration (unit 7)
26. **What is CORS and why only in production for you?** The browser blocks cross-origin calls unless the server allows the origin. Locally the Vite proxy makes calls same-origin; in production the Vercel client calls the Render API, so `cors({ origin: CLIENT_URL })` is needed.
27. **Where do you store the JWT and what's the risk?** localStorage, sent by an Axios interceptor. Risk: XSS can read it. Mitigation: React escapes output, no `dangerouslySetInnerHTML`, Helmet. Alternative: httpOnly cookie, which then needs CSRF protection.
28. **How do protected routes work?** `ProtectedRoute` waits while the session is being restored, redirects anonymous users to `/login` with the original location, and renders children otherwise. The server still checks every request.
29. **How does pagination work end to end?** The UI keeps `page` in the URL; the API uses `skip` and `limit` with a capped limit and returns `meta.total` from `countDocuments` run in parallel; the UI renders pages from `meta`.
30. **How does the upload progress bar work?** Axios `onUploadProgress` gives loaded and total bytes; the hook turns that into a percentage for the progress bar. Multer enforces size and type limits on the server.

### Testing and DevOps (unit 8, ETE)
31. **How did you test?** Jest + Supertest against an in-memory MongoDB for every route including 401, 403, 400, 409, 413 cases; a Postman collection with assertions; a manual end-to-end script.
32. **Why Winston and Morgan?** Morgan logs each HTTP request; Winston gives levels, JSON (structured) output and file transports. A `requestId` links an error response to its log line.
33. **How does your Redis cache work?** Cache-aside: check Redis, else run the aggregation and store the result with a 60 s TTL; writes delete the keys. If Redis is down the app falls back to MongoDB.
34. **What does Docker Compose give you?** One command starts API, client, MongoDB and Redis with networking; services find each other by name, which is basic service discovery.
35. **What is your CI pipeline?** GitHub Actions runs lint, tests and the client build on every push and pull request; Render and Vercel redeploy when `main` changes.
36. **How would you scale Syncora?** Indexes and pagination first, Redis caching, multiple stateless API containers behind a load balancer, object storage for files, Socket.io with a Redis adapter for live updates, and only then split services behind an API gateway.

## 5. Who answers what (fill in)

| Area | Team member |
|---|---|
| Auth, teams, roles, middleware | |
| Boards, tasks, filters, aggregation | |
| React client, contexts, routing | |
| Testing, Postman, report, deck | |
