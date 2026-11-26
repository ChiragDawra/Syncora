const mongoose = require('mongoose');

const { Schema } = mongoose;

// Referenced (not embedded): comments grow without limit and are paginated on their own
const commentSchema = new Schema(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: [true, 'Comment text is required'], trim: true, minlength: 1, maxlength: 1000 },
    edited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// compound index: a task's comments, newest first
commentSchema.index({ task: 1, createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
