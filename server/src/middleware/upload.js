// Multer config: random stored names, size/count/type limits, files sorted into <yyyy>/<mm>/ folders.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const { uploadRoot } = require('../utils/files');

// MIME type -> allowed extensions (both must match)
const ATTACHMENT_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};
const AVATAR_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp'],
};

function storageIn(subFolder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      const now = new Date();
      const rel = subFolder
        ? subFolder
        : path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
      const dir = path.join(uploadRoot, rel);
      fs.mkdir(dir, { recursive: true }, (err) => cb(err, dir));
    },
    // never use the user's filename on disk: stops path tricks and overwrites
    filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
  });
}

function filterFor(types) {
  return (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = types[file.mimetype];
    if (!allowed || !allowed.includes(ext)) {
      const list = [...new Set(Object.values(types).flat())].join(', ');
      return cb(new AppError(`Unsupported file type. Allowed: ${list}`, 400, 'UNSUPPORTED_FILE_TYPE'));
    }
    return cb(null, true);
  };
}

const attachmentUpload = multer({
  storage: storageIn(null),
  limits: { fileSize: env.maxFileSizeMb * 1024 * 1024, files: 5 },
  fileFilter: filterFor(ATTACHMENT_TYPES),
});

const avatarUpload = multer({
  storage: storageIn('avatars'),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: filterFor(AVATAR_TYPES),
});

// The relative path stored in the DB, e.g. "2026/11/<uuid>.pdf"
const relativeName = (file) => path.relative(uploadRoot, file.path).split(path.sep).join('/');

module.exports = {
  uploadAttachments: attachmentUpload.array('files', 5),
  uploadAvatar: avatarUpload.single('avatar'),
  relativeName,
  ATTACHMENT_TYPES,
};
