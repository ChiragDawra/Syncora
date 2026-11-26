# Syncora: DevOps and deployment

Covers CHO unit 8 (ETE): logging, caching, Docker, CI/CD, deployment and environment configuration. Environment variables and logging are useful from day one; the rest can wait until after CE-2.

## 1. Environment variables

`server/.env.example` (commit this; never commit `.env`):

```bash
NODE_ENV=development            # development | test | production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/syncora?retryWrites=true&w=majority
JWT_SECRET=change-me-to-a-random-string-of-at-least-32-chars
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=5
LOG_LEVEL=info                  # error | warn | info | http | debug
AUTH_RATE_LIMIT_MAX=10          # failed login/register attempts per 15 min per IP
REDIS_URL=                      # empty = caching off, e.g. redis://localhost:6379
CLOUDINARY_URL=                 # empty = local disk uploads
```

`client/.env.example`:

```bash
VITE_API_URL=/api               # production: https://<your-api>.onrender.com/api
```

The Vite dev proxy targets `http://localhost:5000`; set `API_PROXY_TARGET` (shell env, not a `VITE_` var) to point it elsewhere. On macOS, AirPlay Receiver holds port 5000: turn it off or run the API with `PORT=5050` and `API_PROXY_TARGET=http://localhost:5050`.

No Atlas or Docker? `npm run dev:memory` in `server/` starts a single-node replica set through `mongodb-memory-server` (data in `server/.mongo-data/`), seeds it once, and starts the API.

`config/env.js` reads and checks them once at startup and exits with a clear message if a required one is missing:

```js
require('dotenv').config();
const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) { console.error(`Missing env vars: ${missing.join(', ')}`); process.exit(1); }
if (process.env.JWT_SECRET.length < 32) { console.error('JWT_SECRET must be at least 32 characters'); process.exit(1); }

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  redisUrl: process.env.REDIS_URL || '',
  logLevel: process.env.LOG_LEVEL || 'info',
});
```

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

| Environment | Where vars live | Notes |
|---|---|---|
| Local | `server/.env`, `client/.env` | `NODE_ENV=development`, verbose logs |
| Test | set in `tests/setup.js` | in-memory MongoDB, no Redis |
| CI | GitHub Actions `env:` and repository secrets | no real secrets needed for tests |
| Production | Render and Vercel dashboards | `NODE_ENV=production`, `LOG_LEVEL=info` |

## 2. Logging (Winston + Morgan)

`utils/logger.js`:

```js
const { createLogger, format, transports } = require('winston');
const env = require('../config/env');

const logger = createLogger({
  level: env.logLevel,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'syncora-api' },
  transports: [
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (env.nodeEnv !== 'production') {
  logger.add(new transports.Console({ format: format.combine(format.colorize(), format.simple()) }));
} else {
  logger.add(new transports.Console()); // hosts collect stdout
}

logger.stream = { write: msg => logger.http(msg.trim()) }; // for morgan
module.exports = logger;
```

In `app.js`: `morgan(':method :url :status :res[content-length] - :response-time ms :req[x-request-id]', { stream: logger.stream })`. Skip morgan in tests.

Structured logging means each log line is a JSON object (`{ level, message, timestamp, requestId, userId }`), so it can be searched and filtered, unlike free text. Never log passwords, tokens or request bodies from `/auth`.

## 3. Redis caching

`config/redis.js` creates an `ioredis` client only when `REDIS_URL` is set. `utils/cache.js`:

```js
const redis = require('../config/redis'); // null when caching is off
const logger = require('./logger');

async function getOrSet(key, ttlSeconds, fetchFn) {
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) return { ...JSON.parse(hit), cached: true };
    } catch (err) { logger.warn('cache get failed', { key, err: err.message }); }
  }
  const fresh = await fetchFn();
  if (redis) redis.set(key, JSON.stringify(fresh), 'EX', ttlSeconds).catch(err => logger.warn('cache set failed', { key, err: err.message }));
  return { ...fresh, cached: false };
}

async function del(...keys) {
  if (!redis || !keys.length) return;
  try { await redis.del(...keys); } catch (err) { logger.warn('cache del failed', { keys, err: err.message }); }
}
module.exports = { getOrSet, del };
```

| Strategy | Used? | Note |
|---|---|---|
| Cache-aside (lazy loading) | ✅ | Read from cache, fall back to DB, then fill the cache |
| TTL expiry | ✅ | 60 s, so stale data can't live long |
| Explicit invalidation on write | ✅ | `del` keys on task or member writes |
| Write-through | ❌ | Not needed; mention as an alternative |
| Rate limit store in Redis | Optional | `rate-limit-redis` when running several API instances |

## 4. Docker

`server/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p uploads logs && chown -R node:node /app
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:5000/api/health || exit 1
CMD ["node", "src/server.js"]
```

`client/Dockerfile` (multi-stage):

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

`client/nginx.conf` (SPA fallback + API proxy inside Compose):

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location /api/     { proxy_pass http://api:5000; client_max_body_size 30m; }
  location /uploads/ { proxy_pass http://api:5000; }
  location /         { try_files $uri /index.html; }
}
```

Add `.dockerignore` files with `node_modules`, `.env`, `logs`, `uploads`, `coverage`, `dist`.

## 5. Docker Compose

`docker-compose.yml`:

```yaml
services:
  mongo:
    image: mongo:7
    volumes: [mongo-data:/data/db]
    ports: ["27017:27017"]
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
  api:
    build: ./server
    env_file: ./server/.env
    environment:
      MONGODB_URI: mongodb://mongo:27017/syncora
      REDIS_URL: redis://redis:6379
      CLIENT_URL: http://localhost:8080
    depends_on: [mongo, redis]
    volumes: [uploads:/app/uploads]
    ports: ["5000:5000"]
  client:
    build: ./client
    depends_on: [api]
    ports: ["8080:80"]
volumes:
  mongo-data:
  uploads:
```

Run: `docker compose up --build`, open `http://localhost:8080`. Seed: `docker compose exec api node scripts/seed.js` (copy `scripts/` into the image or mount it).

Service names (`mongo`, `redis`, `api`) resolve through Compose's internal DNS. That is a small, concrete example of **service discovery** for the viva.

Note: transactions need a replica set. The committed `docker-compose.yml` runs `mongo` as a single-node replica set (`--replSet rs0`, initiated by the healthcheck) and the API waits for it to be healthy. On a standalone `mongod` the cascade service falls back to non-transactional deletes automatically.

## 6. CI with GitHub Actions

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  server:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: server } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: server/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm test
        env: { NODE_ENV: test, JWT_SECRET: ci-secret-that-is-at-least-32-characters, MONGODB_URI: mongodb://unused }
  client:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: client } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: client/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
  docker:
    needs: [server, client]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build
```

CD: Render and Vercel both redeploy automatically when `main` changes, so the pipeline is **CI on GitHub → auto-deploy on merge**. Turn on branch protection for `main` so it needs the CI checks to pass.

## 7. Deployment

| Part | Host | Steps |
|---|---|---|
| Database | MongoDB Atlas (M0) | Create a DB user; Network Access allow `0.0.0.0/0` (Render IPs change); copy the SRV string into `MONGODB_URI` |
| API | Render Web Service (free) | Root `server`, build `npm ci`, start `node src/server.js`, health check path `/api/health`; set env vars from §1 with `NODE_ENV=production` and `CLIENT_URL=https://<app>.vercel.app` |
| Client | Vercel | Root `client`, framework Vite, env `VITE_API_URL=https://<api>.onrender.com/api`; add `vercel.json` rewrite `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }` so deep links work |
| Redis | Upstash (free) | Copy the `rediss://` URL into `REDIS_URL` |
| Files | Cloudinary (free) | Set `CLOUDINARY_URL`; switch Multer storage, since Render's disk is wiped on redeploy |

Deployment checklist:

- [ ] `NODE_ENV=production` on the API host.
- [ ] CORS `CLIENT_URL` matches the Vercel domain exactly (no trailing slash).
- [ ] `app.set('trust proxy', 1)` so rate limiting sees real client IPs behind Render's proxy.
- [ ] Health check passes; logs show "MongoDB connected".
- [ ] Seed only a demo database, never production data.
- [ ] Free Render services sleep after inactivity; open the API URL a minute before the demo to wake it.

## 8. Graceful shutdown (`server.js`)

```js
const server = app.listen(env.port, () => logger.info(`API on :${env.port}`));
const shutdown = signal => {
  logger.info(`${signal} received, closing`);
  server.close(async () => { await mongoose.connection.close(); if (redis) await redis.quit(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
};
['SIGTERM', 'SIGINT'].forEach(s => process.on(s, () => shutdown(s)));
process.on('unhandledRejection', err => { logger.error('unhandledRejection', { err }); shutdown('unhandledRejection'); });
```

Containers and hosts send SIGTERM before stopping, so in-flight requests finish cleanly.
