const crypto = require('crypto');

// Attach a request id for log correlation; returned in error bodies and the X-Request-Id header
function requestId(req, res, next) {
  const incoming = req.get('X-Request-Id');
  req.id = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}

module.exports = requestId;
