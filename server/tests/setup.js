const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
require('../src/config/db'); // same mongoose settings as the real app (sanitizeFilter, strictQuery)
const models = require('../src/models');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // build indexes (unique email, text search) before the tests run
  await Promise.all(Object.values(models).map((m) => m.init()));
});

afterEach(async () => {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  fs.rmSync(process.env.UPLOAD_DIR, { recursive: true, force: true });
});
