const router = require('express').Router();
const team = require('../controllers/team.controller');
const board = require('../controllers/board.controller');
const stats = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth');
const { loadTeam } = require('../middleware/loaders');
const { requireTeamRole } = require('../middleware/teamAccess');
const validate = require('../middleware/validate');
const tv = require('../validators/team.validators');
const bv = require('../validators/board.validators');

const OWNER = 'owner';
const ADMINS = ['owner', 'admin'];

router.use(protect); // every team route needs a logged-in user

router.post('/', validate(tv.createTeamRules), team.create);
router.get('/', team.listMine);

// chain: protect -> loadTeam (404) -> requireTeamRole (403) -> validate (400) -> controller
router.get('/:teamId', loadTeam, requireTeamRole(), team.get);
router.patch('/:teamId', loadTeam, requireTeamRole(...ADMINS), validate(tv.updateTeamRules), team.update);
router.delete('/:teamId', loadTeam, requireTeamRole(OWNER), team.remove);

router.post('/:teamId/members', loadTeam, requireTeamRole(...ADMINS), validate(tv.addMemberRules), team.addMember);
router.patch('/:teamId/members/:userId', loadTeam, requireTeamRole(OWNER), validate(tv.changeRoleRules), team.changeRole);
// any member may call this (to leave); the service decides who may remove whom
router.delete('/:teamId/members/:userId', loadTeam, requireTeamRole(), validate(tv.memberParamRules), team.removeMember);

router.get('/:teamId/dashboard', loadTeam, requireTeamRole(), stats.teamDashboard);
router.get('/:teamId/activity', loadTeam, requireTeamRole(), validate(tv.activityRules), team.activity);

router.post('/:teamId/boards', loadTeam, requireTeamRole(...ADMINS), validate(bv.createBoardRules), board.create);
router.get('/:teamId/boards', loadTeam, requireTeamRole(), validate(bv.listBoardsRules), board.listForTeam);

module.exports = router;
