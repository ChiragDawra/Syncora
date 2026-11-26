const { body } = require('express-validator');
const { paginationRules } = require('./common.validators');

const textRules = [
  body('text').isString().withMessage('Comment text is required').bail().trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1 to 1000 characters'),
];

module.exports = { createCommentRules: textRules, updateCommentRules: textRules, listCommentsRules: paginationRules };
