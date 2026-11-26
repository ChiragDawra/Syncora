const { body, query } = require('express-validator');
const { STATUSES, PRIORITIES } = require('../models/Task');
const { paginationRules, csvOf } = require('./common.validators');
const { SORTS } = require('../utils/buildTaskQuery');

const title = () => body('title').isString().withMessage('Title is required').bail().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3 to 120 characters');
const description = () => body('description').optional().isString().trim().isLength({ max: 2000 }).withMessage('Description can be at most 2000 characters');
const priority = () => body('priority').optional().isIn(PRIORITIES).withMessage(`priority must be one of: ${PRIORITIES.join(', ')}`);
const assignee = () => body('assignee').optional({ values: 'null' }).isMongoId().withMessage('assignee must be a user id or null');
const dueDate = () => body('dueDate').optional({ values: 'null' }).isISO8601().withMessage('dueDate must be a date (YYYY-MM-DD)');
const labels = () => [
  body('labels').optional().isArray({ max: 10 }).withMessage('labels must be a list of at most 10 items'),
  body('labels.*').isString().trim().isLength({ min: 1, max: 20 }).withMessage('Each label must be 1 to 20 characters'),
];

const createTaskRules = [
  title(),
  description(),
  body('status').optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  priority(),
  assignee(),
  dueDate(),
  ...labels(),
];

const updateTaskRules = [
  body('title').optional().isString().trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3 to 120 characters'),
  description(),
  priority(),
  assignee(),
  dueDate(),
  ...labels(),
];

const moveTaskRules = [
  body('status').isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(', ')}`),
  body('position').optional().isInt({ min: 0 }).withMessage('position must be 0 or more').toInt(),
];

const sharedListRules = [
  ...paginationRules,
  csvOf('status', STATUSES),
  csvOf('priority', PRIORITIES),
  query('sort').optional().isIn(Object.keys(SORTS)).withMessage(`sort must be one of: ${Object.keys(SORTS).join(', ')}`),
  query('overdue').optional().isIn(['true', 'false']).withMessage('overdue must be true or false'),
];

const listTasksRules = [
  ...sharedListRules,
  query('assignee')
    .optional()
    .isString()
    .bail()
    .custom((v) => v === 'me' || v === 'none' || /^[a-f\d]{24}$/i.test(v))
    .withMessage('assignee must be me, none or a user id'),
  query('label').optional().isString().trim().isLength({ min: 1, max: 20 }).withMessage('label must be 1 to 20 characters'),
  query('q').optional().isString().trim().isLength({ max: 100 }).withMessage('q can be at most 100 characters'),
  query('dueBefore').optional().isISO8601().withMessage('dueBefore must be a date'),
  query('dueAfter').optional().isISO8601().withMessage('dueAfter must be a date'),
];

module.exports = { createTaskRules, updateTaskRules, moveTaskRules, listTasksRules, myTasksRules: sharedListRules };
