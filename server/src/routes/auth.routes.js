const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { uploadAvatar } = require('../middleware/upload');
const validate = require('../middleware/validate');
const v = require('../validators/auth.validators');

router.post('/register', authLimiter, validate(v.registerRules), ctrl.register);
router.post('/login', authLimiter, validate(v.loginRules), ctrl.login);

router.get('/me', protect, ctrl.me);
router.patch('/me', protect, validate(v.updateMeRules), ctrl.updateMe);
router.post('/me/avatar', protect, uploadAvatar, ctrl.uploadAvatar);
router.patch('/me/password', protect, validate(v.changePasswordRules), ctrl.changePassword);

module.exports = router;
