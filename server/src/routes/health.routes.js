const router = require('express').Router();
const mongoose = require('mongoose');

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// GET /api/health -> liveness for Docker, Render and the demo
router.get('/', (_req, res) => {
  const db = DB_STATES[mongoose.connection.readyState] || 'unknown';
  res.status(db === 'connected' ? 200 : 503).json({
    success: db === 'connected',
    data: { status: db === 'connected' ? 'ok' : 'degraded', uptime: Math.round(process.uptime()), db },
  });
});

module.exports = router;
