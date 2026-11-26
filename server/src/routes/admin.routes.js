const router = require('express').Router();
const admin = require('../controllers/admin.controller');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const av = require('../validators/admin.validators');

// platform admin only (user.role === 'admin'), not team admins
router.use(protect, restrictTo('admin'));

router.get('/users', validate(av.listUsersRules), admin.listUsers);
router.get('/stats', admin.stats);

module.exports = router;
