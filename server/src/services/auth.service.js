const { User } = require('../models');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/token');
const { removeFiles } = require('../utils/files');

const invalidCredentials = () => new AppError('Email or password is incorrect', 401, 'INVALID_CREDENTIALS');

async function register({ name, email, password }) {
  const exists = await User.findByEmail(email);
  if (exists) {
    throw new AppError('An account with this email already exists', 409, 'DUPLICATE', [
      { field: 'email', message: 'Email is already registered' },
    ]);
  }
  const user = await User.create({ name, email, password }); // pre('save') hook hashes the password
  return { user, token: signToken(user._id) };
}

async function login({ email, password }) {
  const user = await User.findByEmail(email).select('+password');
  // same error for unknown email and wrong password: don't reveal which one was wrong
  if (!user || !user.isActive) throw invalidCredentials();
  const ok = await user.comparePassword(password);
  if (!ok) throw invalidCredentials();
  return { user, token: signToken(user._id) };
}

async function updateMe(user, { name }) {
  user.name = name;
  await user.save();
  return user;
}

async function setAvatar(user, relativeFileName) {
  const old = user.avatarUrl && user.avatarUrl.startsWith('/uploads/') ? user.avatarUrl.replace('/uploads/', '') : null;
  user.avatarUrl = `/uploads/${relativeFileName}`;
  await user.save();
  if (old) await removeFiles([old]); // delete the previous file only after the DB save worked
  return user;
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+password');
  const ok = await user.comparePassword(currentPassword);
  if (!ok) throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
  user.password = newPassword;
  await user.save();
  return { user, token: signToken(user._id) };
}

module.exports = { register, login, updateMe, setAvatar, changePassword };
