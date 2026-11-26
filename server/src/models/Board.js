const mongoose = require('mongoose');

const { Schema } = mongoose;

const boardSchema = new Schema(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    name: { type: String, required: [true, 'Board name is required'], trim: true, minlength: 1, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    color: { type: String, match: [/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #6366f1'], default: '#6366f1' },
    archived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// compound index: list a team's boards (equality team, archived) newest first (sort createdAt)
boardSchema.index({ team: 1, archived: 1, createdAt: -1 });
// unique compound index: no duplicate board names inside one team
boardSchema.index({ team: 1, name: 1 }, { unique: true });

// Virtual populate with count: number of tasks on this board
boardSchema.virtual('taskCount', { ref: 'Task', localField: '_id', foreignField: 'board', count: true });

module.exports = mongoose.model('Board', boardSchema);
