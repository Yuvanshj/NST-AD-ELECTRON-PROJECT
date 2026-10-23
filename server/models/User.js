import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'ALUMNI', 'STUDENT'],
      required: true,
    },
    fullName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
