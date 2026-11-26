const router = require('express').Router();
const task = require('../controllers/task.controller');
const attachment = require('../controllers/attachment.controller');
const comment = require('../controllers/comment.controller');
const { protect } = require('../middleware/auth');
const { loadTask } = require('../middleware/loaders');
const { requireTeamRole } = require('../middleware/teamAccess');
const { uploadAttachments } = require('../middleware/upload');
const validate = require('../middleware/validate');
const { objectIdParam } = require('../validators/common.validators');
const tv = require('../validators/task.validators');
const cv = require('../validators/comment.validators');

router.use(protect);

// must come before '/:taskId' so "mine" is not read as an id
router.get('/mine', validate(tv.myTasksRules), task.listMine);

router.get('/:taskId', loadTask, requireTeamRole(), task.get);
router.patch('/:taskId', loadTask, requireTeamRole(), validate(tv.updateTaskRules), task.update);
router.patch('/:taskId/move', loadTask, requireTeamRole(), validate(tv.moveTaskRules), task.move);
router.delete('/:taskId', loadTask, requireTeamRole(), task.remove); // creator/admin check in the service

router.post('/:taskId/attachments', loadTask, requireTeamRole(), uploadAttachments, attachment.upload);
router.delete(
  '/:taskId/attachments/:attachmentId',
  loadTask,
  requireTeamRole(),
  validate([objectIdParam('attachmentId')]),
  attachment.remove
);

router.get('/:taskId/comments', loadTask, requireTeamRole(), validate(cv.listCommentsRules), comment.list);
router.post('/:taskId/comments', loadTask, requireTeamRole(), validate(cv.createCommentRules), comment.create);

module.exports = router;
