const mongoose = require('mongoose');

const { Schema } = mongoose;

const ACTIONS = [
  'team.created', 'team.updated', 'member.added', 'member.removed', 'member.role_changed',
  'board.created', 'board.updated', 'board.deleted',
  'task.created', 'task.updated', 'task.moved', 'task.deleted',
  'comment.added', 'attachment.added', 'attachment.removed',
];

// Append-only log in its own collection; entries expire automatically (TTL index)
const activitySchema = new Schema({
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  board: { type: Schema.Types.ObjectId, ref: 'Board' },
  task: { type: Schema.Types.ObjectId, ref: 'Task' },
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true, enum: ACTIONS },
  meta: { type: Schema.Types.Mixed, default: {} }, // e.g. { from: 'todo', to: 'done', title: '...' }
  createdAt: { type: Date, default: Date.now },
});

activitySchema.index({ team: 1, createdAt: -1 });
// TTL index: MongoDB deletes entries 90 days after createdAt
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

activitySchema.statics.ACTIONS = ACTIONS;

module.exports = mongoose.model('Activity', activitySchema);
