const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('./logger');

// Absolute folder where Multer stores files (server/uploads by default)
const uploadRoot = path.resolve(__dirname, '../..', env.uploadDir);

// fileName is the stored relative path, e.g. "2026/11/<uuid>.pdf"
function absolutePath(fileName) {
  const full = path.resolve(uploadRoot, fileName);
  // never touch anything outside the upload folder
  if (!full.startsWith(uploadRoot + path.sep)) throw new Error('Invalid file path');
  return full;
}

// Delete files after the DB work succeeded. A failed unlink is only logged.
async function removeFiles(fileNames = []) {
  await Promise.all(
    fileNames.filter(Boolean).map(async (name) => {
      try {
        await fs.promises.unlink(absolutePath(name));
      } catch (err) {
        if (err.code !== 'ENOENT') logger.warn('file delete failed', { file: name, err: err.message });
      }
    })
  );
}

module.exports = { uploadRoot, absolutePath, removeFiles };
