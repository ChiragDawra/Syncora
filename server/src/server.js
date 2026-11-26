const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const redis = require('./config/redis');
const logger = require('./utils/logger');
const app = require('./app');

async function start() {
  try {
    await connectDB(env.mongoUri);
  } catch (err) {
    logger.error(`Could not connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(env.port, () => logger.info(`Syncora API listening on :${env.port} (${env.nodeEnv})`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // macOS: AirPlay Receiver uses port 5000. Turn it off in System Settings, or set PORT=5050 in .env
      logger.error(
        `Port ${env.port} is already in use. Set another PORT in server/.env (and API_PROXY_TARGET for the client).`
      );
    } else {
      logger.error(`Server error: ${err.message}`);
    }
    process.exit(1);
  });

  // Graceful shutdown: finish in-flight requests, then close DB and Redis
  const shutdown = (signal) => {
    logger.info(`${signal} received, closing`);
    server.close(async () => {
      await mongoose.connection.close();
      if (redis) await redis.quit().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  ['SIGTERM', 'SIGINT'].forEach((s) => process.on(s, () => shutdown(s)));
  process.on('unhandledRejection', (err) => {
    logger.error('unhandledRejection', { err: err && err.message, stack: err && err.stack });
    shutdown('unhandledRejection');
  });
}

start();
