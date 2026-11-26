const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

// validate(rules): run express-validator rules, then reject with 400 and per-field details
const validate = (rules) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array({ onlyFirstError: true });
    const details = errors.map((e) => ({ field: e.path, message: e.msg }));
    // a bad :id in the URL gets the dedicated INVALID_ID code
    const onlyParams = errors.every((e) => e.location === 'params');
    return next(
      onlyParams
        ? new AppError('Invalid id in URL', 400, 'INVALID_ID', details)
        : new AppError('Invalid input', 400, 'VALIDATION_ERROR', details)
    );
  },
];

module.exports = validate;
