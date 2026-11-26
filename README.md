# Syncora

A team task board built with the MERN stack for Back End Engineering-II (24CSE0315). Teams create boards, add tasks, assign them to members, attach files, comment, and move work from **To Do** to **In Progress** to **Done**. Each team's data is visible only to its members, and what you can do depends on your role (owner, admin, member).

- `server/`: Express REST API, MongoDB with Mongoose, JWT auth, team role checks, Multer uploads, aggregation stats, Winston logs, optional Redis cache.
- `client/`: React (Vite) SPA with React Router, Context + useReducer, Axios and Tailwind.
- `docs/`: the full spec (PRD, API, database, data flow, frontend, testing, DevOps, viva). Start at [docs/README.md](docs/README.md).

## Quick start

Needs Node 20+.

```bash
# 1. API
cd server
npm install
cp .env.example .env          # set MONGODB_URI (Atlas or local) and a 32+ char JWT_SECRET
npm run seed                  # demo data (refuses in production)
npm run dev                   # http://localhost:5000/api/health

# 2. Client (second terminal)
cd client
npm install
npm run dev                   # http://localhost:5173 (proxies /api and /uploads to :5000)
```

### No MongoDB handy?

`npm run dev:memory` (in `server/`) starts a local MongoDB through `mongodb-memory-server` (data kept in `server/.mongo-data/`), seeds it the first time, and starts the API. No Atlas, Docker or `.env` needed. Use `npm run dev:memory -- --reseed` to reset the demo data.

### macOS: port 5000 is taken

macOS uses port 5000 for AirPlay Receiver. Either turn it off (System Settings > General > AirDrop & Handoff), or run the API on another port and point the Vite proxy at it:

```bash
cd server && PORT=5050 npm run dev:memory
cd client && API_PROXY_TARGET=http://localhost:5050 npm run dev
```

### Demo logins

Password `Password123` for all: `owner@syncora.dev` (team owner and platform admin), `admin@syncora.dev`, `member@syncora.dev`, `outsider@syncora.dev` (a different team, for the 403 demo).

## Scripts

| Where | Command | Does |
|---|---|---|
| server | `npm run dev` | API with nodemon |
| server | `npm run dev:memory` | API with a zero-setup local MongoDB |
| server | `npm test` | Jest + Supertest against in-memory MongoDB (72 tests) |
| server | `npm run lint` | ESLint |
| server | `npm run seed` | Demo data |
| client | `npm run dev` / `build` / `lint` | Vite dev server, production build, ESLint |
| root | `docker compose up --build` | API, client, MongoDB (replica set) and Redis on http://localhost:8080 |

Postman collection and environment: [`postman/`](postman/). CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml).
