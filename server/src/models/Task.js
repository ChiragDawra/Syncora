const mongoose = require('mongoose');

const { Schema } = mongoose;

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

// Embedded: attachments are bounded (max 20) and only meaningful with their task
const attachmentSchema = new Schema({
  originalName: { type: String, required: true },
  fileName: { type: String, required: true }, // stored relative path "<yyyy>/<mm>/<uuid><ext>"
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true }, // bytes
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const taskSchema = new Schema(
  {
    board: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true }, // denormalized for access checks + aggregation
    title: { type: String, required: [true, 'Title is required'], trim: true, minlength: 3, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    status: { type: String, enum: STATUSES, default: 'todo' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    priorityRank: { type: Number, default: 1, select: true }, // 0 low .. 3 urgent, so "sort by priority" is numeric
    assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    labels: { type: [String], validate: [(a) => a.length <= 10, 'At most 10 labels'], default: [] },
    position: { type: Number, default: 0 }, // order inside a status column
    attachments: { type: [attachmentSchema], validate: [(a) => a.length <= 20, 'At most 20 attachments'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// compound index (ESR rule): equality (board, status) then sort (position) -> board columns
taskSchema.index({ board: 1, status: 1, position: 1 });
// compound index: "my tasks", workload, due soon
taskSchema.index({ assignee: 1, status: 1, dueDate: 1 });
// team dashboard: due in the next 7 days, overdue
taskSchema.index({ team: 1, dueDate: 1 });
// default list sort
taskSchema.index({ board: 1, createdAt: -1 });
// text index for ?q= search; title matches weigh 5x more than description matches
taskSchema.index({ title: 'text', description: 'text' }, { weights: { title: 5, description: 1 }, name: 'task_text' });

// Virtual: computed on read, never stored
taskSchema.virtual('isOverdue').get(function isOverdue() {
  return !!this.dueDate && this.status !== 'done' && this.dueDate < new Date();
});

// Keep priorityRank in sync with priority (runs on create, save and insertMany)
taskSchema.pre('validate', function syncPriorityRank() {
  this.priorityRank = Math.max(0, PRIORITIES.indexOf(this.priority));
});

// Mongoose middleware: keep completedAt in sync with status
taskSchema.pre('save', function syncCompletedAt() {
  if (this.isModified('status')) this.completedAt = this.status === 'done' ? new Date() : null;
});

// Cascade (document middleware): deleting a task deletes its comments
taskSchema.pre('deleteOne', { document: true, query: false }, async function cascadeComments() {
  await mongoose.model('Comment').deleteMany({ task: this._id });
});

taskSchema.statics.STATUSES = STATUSES;
taskSchema.statics.PRIORITIES = PRIORITIES;

module.exports = mongoose.model('Task', taskSchema);
