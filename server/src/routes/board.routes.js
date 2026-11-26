const router = require('express').Router();
const board = require('../controllers/board.controller');
const task = require('../controllers/task.controller');
const stats = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth');
const { loadBoard } = require('../middleware/loaders');
const { requireTeamRole } = require('../middleware/teamAccess');
const validate = require('../middleware/validate');
const bv = require('../validators/board.validators');
const tv = require('../validators/task.validators');

const ADMINS = ['owner', 'admin'];

router.use(protect);

router.get('/:boardId', loadBoard, requireTeamRole(), board.get);
router.patch('/:boardId', loadBoard, requireTeamRole(...ADMINS), validate(bv.updateBoardRules), board.update);
router.delete('/:boardId', loadBoard, requireTeamRole(...ADMINS), board.remove);
router.get('/:boardId/stats', loadBoard, requireTeamRole(), stats.boardStats);

router.post('/:boardId/tasks', loadBoard, requireTeamRole(), validate(tv.createTaskRules), task.create);
router.get('/:boardId/tasks', loadBoard, requireTeamRole(), validate(tv.listTasksRules), task.listForBoard);

module.exports = router;
