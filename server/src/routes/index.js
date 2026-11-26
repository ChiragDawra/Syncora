const router = require('express').Router();
const { apiLimiter } = require('../middleware/rateLimit');

router.use('/health', require('./health.routes'));
router.use(apiLimiter);
router.use('/auth', require('./auth.routes'));
router.use('/teams', require('./team.routes'));
router.use('/boards', require('./board.routes'));
router.use('/tasks', require('./task.routes'));
router.use('/comments', require('./comment.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
