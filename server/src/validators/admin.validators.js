const { query } = require('express-validator');
const { paginationRules } = require('./common.validators');

const listUsersRules = [...paginationRules, query('q').optional().isString().trim().isLength({ max: 60 })];

module.exports = { listUsersRules };
