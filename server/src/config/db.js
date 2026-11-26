const mongoose = require('mongoose');
const logger = require('../utils/logger');

mongoose.set('strictQuery', true);
// NoSQL injection guard: any { $op: ... } object coming from user input inside a query
// filter is wrapped in $eq. Operators the server builds itself are marked with mongoose.trusted().
mongoose.set('sanitizeFilter', true);

async function connectDB(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  mongoose.connection.on('error', (err) => logger.error('MongoDB error', { err: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
}

module.exports = connectDB;
