const router = require('express').Router();
const comment = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');
const { loadComment } = require('../middleware/loaders');
const { requireTeamRole } = require('../middleware/teamAccess');
const validate = require('../middleware/validate');
const cv = require('../validators/comment.validators');

router.use(protect);

router.patch('/:commentId', loadComment, requireTeamRole(), validate(cv.updateCommentRules), comment.update);
router.delete('/:commentId', loadComment, requireTeamRole(), comment.remove);

module.exports = router;
