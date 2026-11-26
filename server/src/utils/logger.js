// Structured logging (unit 8): JSON lines with level, timestamp and requestId.
// Never log passwords, tokens, Authorization headers or file contents.
const path = require('path');
const fs = require('fs');
const { createLogger, format, transports } = require('winston');
const env = require('../config/env');

const logDir = path.resolve(__dirname, '../../logs');
if (!env.isTest) fs.mkdirSync(logDir, { recursive: true });

const logger = createLogger({
  level: env.logLevel,
  silent: env.isTest,
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'syncora-api' },
  transports: env.isTest
    ? [new transports.Console()]
    : [
        new transports.File({ filename: path.join(logDir, 'error.log'), level: 'error' }),
        new transports.File({ filename: path.join(logDir, 'combined.log') }),
      ],
});

if (!env.isTest) {
  logger.add(
    env.isProd
      ? new transports.Console() // hosts like Render collect stdout
      : new transports.Console({ format: format.combine(format.colorize(), format.simple()) })
  );
}

// morgan writes access lines through this stream into winston's "http" level
logger.stream = { write: (msg) => logger.http(msg.trim()) };

module.exports = logger;
