// Express app: global middleware, routes, 404, error handler. Exported without listen() so tests can use it.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { uploadRoot } = require('./utils/files');
const routes = require('./routes');

require('./models'); // register every model once

const app = express();

app.set('trust proxy', 1); // real client IPs behind Render/nginx, so rate limits work
app.disable('x-powered-by');

// Order matters: each line runs top to bottom for every request
app.use(requestId); // 1. req.id for log correlation
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // 2. security headers (allow <img> of uploads from the client origin)
app.use(cors({ origin: env.clientUrl, credentials: true })); // 3. only the React origin
app.use(compression()); // 4. gzip
app.use(express.json({ limit: '1mb' })); // 5. JSON body with a size cap
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
morgan.token('id', (req) => req.id);
if (!env.isTest) {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms :id', { stream: logger.stream })); // 6. access log
}
app.use('/uploads', express.static(uploadRoot, { index: false, dotfiles: 'deny' })); // 7. attachment files
app.use('/api', routes); // 8. feature routes
app.use(notFound); // 9. 404
app.use(errorHandler); // 10. central error handler, always last

module.exports = app;
