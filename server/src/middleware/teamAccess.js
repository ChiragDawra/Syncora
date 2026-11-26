const Team = require('../models/Team');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// requireTeamRole(): any member. requireTeamRole('owner', 'admin'): only those roles.
// Runs after a loader, which set req.teamId. Attaches req.team and req.membership = { team, role }.
// Role checks live here; ownership checks ("is this your comment?") live in the services.
const requireTeamRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    const team = req.team && req.team._id.equals(req.teamId) ? req.team : await Team.findById(req.teamId);
    if (!team) throw new AppError('Team not found', 404, 'NOT_FOUND');

    const role = team.getRole(req.user._id);
    if (!role) throw new AppError('You are not a member of this team', 403, 'FORBIDDEN');
    if (roles.length && !roles.includes(role)) {
      throw new AppError(`This action needs one of these roles: ${roles.join(', ')}`, 403, 'FORBIDDEN');
    }

    req.team = team;
    req.membership = { team, role };
    next();
  });

module.exports = { requireTeamRole };
