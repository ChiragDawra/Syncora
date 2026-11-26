const mongoose = require('mongoose');
const logger = require('./logger');

let supportsTx = null;

// Transactions need a replica set (Atlas is one). A plain local mongod or the test server is not,
// so we fall back to running the same work without a session there.
async function transactionsSupported() {
  if (supportsTx !== null) return supportsTx;
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    supportsTx = Boolean(hello.setName) || hello.msg === 'isdbgrid';
  } catch {
    supportsTx = false;
  }
  return supportsTx;
}

// fn(session) receives a session (or null) and must pass it to every query: Model.deleteMany(f, { session })
async function runInTransaction(fn) {
  if (!(await transactionsSupported())) return fn(null);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    logger.error('transaction failed', { err: err.message });
    throw err;
  } finally {
    await session.endSession();
  }
}

module.exports = { runInTransaction };
