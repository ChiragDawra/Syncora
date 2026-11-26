const { body } = require('express-validator');

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/;
const passwordMsg = 'Password must be 8 to 64 characters with at least one letter and one number';

const email = () =>
  body('email').isString().withMessage('Email is required').bail().trim().toLowerCase().isEmail().withMessage('Enter a valid email');

const registerRules = [
  body('name').isString().withMessage('Name is required').bail().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
  email(),
  body('password').isString().withMessage('Password is required').bail().matches(PASSWORD_RULE).withMessage(passwordMsg),
];

const loginRules = [
  email(),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const updateMeRules = [
  body('name').isString().withMessage('Name is required').bail().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2 to 60 characters'),
];

const changePasswordRules = [
  body('currentPassword').isString().notEmpty().withMessage('Current password is required'),
  body('newPassword').isString().withMessage('New password is required').bail().matches(PASSWORD_RULE).withMessage(passwordMsg),
];

module.exports = { registerRules, loginRules, updateMeRules, changePasswordRules };
