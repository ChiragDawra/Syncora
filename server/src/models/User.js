const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 60 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // unique index: no two accounts with the same email
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    password: { type: String, required: true, minlength: 8, select: false }, // never returned by default
    avatarUrl: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }, // platform role, not team role
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      // hide password and __v whenever a user is sent as JSON
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        delete ret.id;
        return ret;
      },
    },
  }
);

// Mongoose middleware: hash the password before saving (only when it changed)
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Instance method
userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// Static method
userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

module.exports = mongoose.model('User', userSchema);
