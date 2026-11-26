const mongoose = require('mongoose');

const { Schema } = mongoose;

const TEAM_ROLES = ['owner', 'admin', 'member'];

// Embedded sub-document: members are small, bounded and always read with the team
const memberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: TEAM_ROLES, default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const teamSchema = new Schema(
  {
    name: { type: String, required: [true, 'Team name is required'], trim: true, minlength: 2, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: {
      type: [memberSchema],
      validate: [(arr) => arr.length <= 50, 'A team can have at most 50 members'],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// multikey index: "teams I belong to"
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ owner: 1 });

// Instance method: my role in this team, or null if not a member
teamSchema.methods.getRole = function getRole(userId) {
  const m = this.members.find((x) => x.user && (x.user._id || x.user).equals(userId));
  return m ? m.role : null;
};

// Static method: teams a user belongs to, most recently updated first
teamSchema.statics.forUser = function forUser(userId) {
  return this.find({ 'members.user': userId }).sort('-updatedAt');
};

// Virtual: member count (not stored)
teamSchema.virtual('memberCount').get(function memberCount() {
  return this.members ? this.members.length : 0;
});

// Virtual populate: boards of this team (not stored)
teamSchema.virtual('boards', { ref: 'Board', localField: '_id', foreignField: 'team' });

teamSchema.statics.ROLES = TEAM_ROLES;

module.exports = mongoose.model('Team', teamSchema);
