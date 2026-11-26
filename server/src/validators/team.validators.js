const { body, param } = require('express-validator');
const { paginationRules } = require('./common.validators');

const createTeamRules = [
  body('name').isString().withMessage('Team name is required').bail().trim().isLength({ min: 2, max: 60 }).withMessage('Team name must be 2 to 60 characters'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description can be at most 500 characters'),
];

const updateTeamRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 60 }).withMessage('Team name must be 2 to 60 characters'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description can be at most 500 characters'),
];

const addMemberRules = [
  body('email').isString().withMessage('Email is required').bail().trim().toLowerCase().isEmail().withMessage('Enter a valid email'),
  body('role').optional().isIn(['member', 'admin']).withMessage('role must be member or admin'),
];

const changeRoleRules = [
  param('userId').isMongoId().withMessage('Invalid userId'),
  body('role').isIn(['member', 'admin']).withMessage('role must be member or admin'),
];

const memberParamRules = [param('userId').isMongoId().withMessage('Invalid userId')];

const activityRules = [...paginationRules];

module.exports = { createTeamRules, updateTeamRules, addMemberRules, changeRoleRules, memberParamRules, activityRules };
