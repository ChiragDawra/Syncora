const { param, query } = require('express-validator');

const objectIdParam = (name) => param(name).isMongoId().withMessage(`Invalid ${name}`);

// ?page=&limit= : integers; limit is capped at 100 later in parsePagination
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1 }).withMessage('limit must be a positive integer'),
];

// "todo,in_progress" -> each value must be in the allowed list. Rejects arrays/objects such as status[$ne]=x.
const csvOf = (field, allowed) =>
  query(field)
    .optional()
    .isString()
    .withMessage(`${field} must be a string`)
    .bail()
    .custom((value) => {
      const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
      if (!parts.length || parts.some((p) => !allowed.includes(p))) {
        throw new Error(`${field} must be one or more of: ${allowed.join(', ')}`);
      }
      return true;
    });

module.exports = { objectIdParam, paginationRules, csvOf };
