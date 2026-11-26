const AppError = require('../utils/AppError');
const activity = require('./activity.service');
const { removeFiles } = require('../utils/files');
const { relativeName } = require('../middleware/upload');

const MAX_PER_TASK = 20;

// browsers send UTF-8 filenames; busboy reads them as latin1
const fixName = (name) => Buffer.from(name, 'latin1').toString('utf8');

async function add(task, user, files = []) {
  const stored = files.map(relativeName);
  if (!files.length) throw new AppError('Attach at least one file in the "files" field', 400, 'VALIDATION_ERROR');
  if (task.attachments.length + files.length > MAX_PER_TASK) {
    await removeFiles(stored);
    throw new AppError(`A task can have at most ${MAX_PER_TASK} attachments`, 400, 'VALIDATION_ERROR');
  }

  files.forEach((file, i) => {
    task.attachments.push({
      originalName: fixName(file.originalname),
      fileName: stored[i],
      url: `/uploads/${stored[i]}`,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: user._id,
    });
  });

  try {
    await task.save();
  } catch (err) {
    await removeFiles(stored); // DB failed: don't leave orphan files on disk
    throw err;
  }

  const added = task.attachments.slice(-files.length).map((a) => ({ ...a.toObject(), uploadedBy: { _id: user._id, name: user.name } }));
  await activity.log({
    team: task.team,
    board: task.board,
    task: task._id,
    actor: user._id,
    action: 'attachment.added',
    meta: { title: task.title, files: added.map((a) => a.originalName) },
  });
  return added;
}

async function remove(task, user, role, attachmentId) {
  const att = task.attachments.id(attachmentId);
  if (!att) throw new AppError('Attachment not found', 404, 'NOT_FOUND');
  if (role === 'member' && !att.uploadedBy.equals(user._id)) {
    throw new AppError('Only the uploader, an admin or the owner can delete this file', 403, 'FORBIDDEN');
  }
  const { fileName, originalName } = att;
  att.deleteOne();
  await task.save();
  await removeFiles([fileName]); // after the DB change succeeded
  await activity.log({ team: task.team, board: task.board, task: task._id, actor: user._id, action: 'attachment.removed', meta: { title: task.title, file: originalName } });
  return { deleted: true };
}

module.exports = { add, remove };
