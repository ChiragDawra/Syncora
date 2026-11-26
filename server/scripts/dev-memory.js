/* Zero-setup local run: starts a MongoDB on this machine through mongodb-memory-server
 * (data kept in server/.mongo-data), seeds it the first time, then starts the API.
 * Use when you have neither Atlas nor Docker handy. Not for production.
 */
const fs = require('fs');
const path = require('path');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

async function main() {
  const dbPath = path.resolve(__dirname, '../.mongo-data');
  fs.mkdirSync(dbPath, { recursive: true });
  // single-node replica set, so transactions work like on Atlas
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
    instanceOpts: [{ dbPath, port: 27018 }],
  });
  process.env.MONGODB_URI = replSet.getUri('syncora');
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'local-dev-only-secret-change-me-0123456789abcdef';
  console.log(`MongoDB (memory server) at ${process.env.MONGODB_URI}`);

  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI);
  const { User } = require('../src/models');
  if ((await User.estimatedDocumentCount()) === 0 || process.argv.includes('--reseed')) {
    await require('./seed')();
  }
  await mongoose.disconnect();

  require('../src/server');
  const stop = async () => {
    await replSet.stop({ doCleanup: false });
  };
  process.on('exit', stop);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
