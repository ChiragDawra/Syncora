const { body, query } = require('express-validator');

const color = () => body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a hex value like #6366f1');

const createBoardRules = [
  body('name').isString().withMessage('Board name is required').bail().trim().isLength({ min: 1, max: 80 }).withMessage('Board name must be 1 to 80 characters'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description can be at most 500 characters'),
  color(),
];

const updateBoardRules = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 80 }).withMessage('Board name must be 1 to 80 characters'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description can be at most 500 characters'),
  color(),
  body('archived').optional().isBoolean({ strict: true }).withMessage('archived must be true or false'),
];

const listBoardsRules = [query('archived').optional().isIn(['true', 'false', 'all']).withMessage('archived must be true, false or all')];

module.exports = { createBoardRules, updateBoardRules, listBoardsRules };
