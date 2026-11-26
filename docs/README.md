# Syncora: build documentation

Syncora is a team task management board. Teams create boards, add tasks, assign them to members, attach files, comment, and move work from **To Do** to **In Progress** to **Done**. Each team's data is visible only to its members, and what you can do depends on your role in the team.

It is built as the Back End Engineering-II (24CSE0315) project. The stack and features are chosen to cover the course handout (CHO): units 5 to 7 for CE-2, and unit 8 for the ETE.

> Status: built. `server/` (72 Jest + Supertest tests) and `client/` implement every P0 and P1 feature, plus the ETE pieces (Winston + Morgan, optional Redis cache, Dockerfiles, Compose, GitHub Actions). See the repo README for how to run it. Keep these docs in sync when you change behaviour.

## Read in this order

| # | File | What it answers |
|---|---|---|
| 1 | [PRD.md](PRD.md) | What Syncora is, who it's for, features, user stories, acceptance criteria, scope |
| 2 | [SYLLABUS_COVERAGE.md](SYLLABUS_COVERAGE.md) | Every CHO unit and topic mapped to a Syncora feature and file |
| 3 | [TECH_STACK.md](TECH_STACK.md) | Every library and tool, and why it was picked |
| 4 | [SYSTEM_DESIGN.md](SYSTEM_DESIGN.md) | Architecture, layers, middleware chain, security, roles, scaling |
| 5 | [DATABASE.md](DATABASE.md) | Collections, Mongoose schemas, indexes, virtuals, hooks, aggregation |
| 6 | [API_SPEC.md](API_SPEC.md) | Every endpoint, request and response shape, status codes, permissions |
| 7 | [DATA_FLOW.md](DATA_FLOW.md) | Step-by-step flows with sequence diagrams (login, CRUD, upload, stats, cache) |
| 8 | [FRONTEND.md](FRONTEND.md) | React pages, routes, contexts, hooks, components, UI states |
| 9 | [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) | The repo layout, file by file |
| 10 | [BUILD_PLAN.md](BUILD_PLAN.md) | Phases, day-by-day plan, and a minimum cut if your CE-2 slot is early |
| 11 | [TESTING.md](TESTING.md) | Test strategy, test cases, Postman collection, Jest and Supertest, seed data |
| 12 | [DEVOPS_DEPLOYMENT.md](DEVOPS_DEPLOYMENT.md) | Env vars, logging, Redis, Docker, GitHub Actions, deployment (unit 8, ETE) |
| 13 | [REPORT_AND_VIVA.md](REPORT_AND_VIVA.md) | Report chapter mapping, deck outline, demo checklist, viva Q&A |
| 14 | [AGENTS.md](AGENTS.md) | Rules for any AI coding agent working in the repo |
| 15 | [CLAUDE.md](CLAUDE.md) | Claude Code's project memory file (imports AGENTS.md) |

## Where these files go in the repo

```
syncora/
  CLAUDE.md          <- copy here (repo root)
  AGENTS.md          <- copy here (repo root)
  README.md          <- write a short repo README later; this one is the docs index
  docs/              <- put every other .md file here
```

`CLAUDE.md` and `AGENTS.md` refer to the other docs as `docs/<FILE>.md`, so keep that layout.

## One-paragraph summary (for the report abstract and the viva)

Syncora is a full-stack MERN application: a React (Vite) client talks to a stateless Express REST API over HTTPS with JWT bearer tokens; the API stores data in MongoDB Atlas through Mongoose. Users belong to teams with an owner, admin or member role. Teams own boards, boards hold tasks, and tasks carry an assignee, priority, due date, labels, comments and file attachments (Multer). The API validates every input (express-validator), hashes passwords (bcrypt), enforces team-level role-based access in middleware, paginates, searches and filters task lists, and computes board and team statistics with MongoDB aggregation pipelines. For the ETE it adds structured logging (Winston and Morgan), Redis caching of statistics, Docker Compose, a GitHub Actions CI pipeline, and cloud deployment.

## Decisions only you can make

1. **Team:** who is in your group, roll numbers, and who builds which part (backend, frontend, docs).
2. **Your CE-2 day:** 25 Nov, 26 Nov, 2 Dec or 3 Dec. If it's 25 or 26 Nov, follow the minimum cut in BUILD_PLAN.md.
3. **File storage:** local `uploads/` folder (simplest, fine for the demo) or Cloudinary (works after deploy). The docs default to local disk with Cloudinary as the upgrade.
4. **Token storage:** the docs keep the JWT in `localStorage` for simplicity and explain the httpOnly cookie alternative for the viva. Switch if your faculty prefers cookies.
5. **Stack:** Express, MongoDB, React and Tailwind are suggestions that match the CHO. Swapping to something outside the CHO (Next.js, Prisma, Supabase) would lose syllabus coverage.
