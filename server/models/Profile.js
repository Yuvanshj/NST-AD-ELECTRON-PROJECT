import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    batch: { type: Number, required: true },
    branch: { type: String, required: true },
    enrollmentNumber: { type: String, default: '' },
    currentCompany: { type: String, default: '' },
    designation: { type: String, default: '' },
    industry: { type: String, default: 'Technology' },
    city: { type: String, default: 'Ahmedabad' },
    country: { type: String, default: 'India' },
    skills: [{ type: String }],
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    linkedinUrl: { type: String, default: '' },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
    isMentor: { type: Boolean, default: false },
    mentorDomain: { type: String, default: null },
    mentorMaxMentees: { type: Number, default: 3 },
    mentorAvailability: { type: String, default: null },
    privacy: {
      hidePhone: { type: Boolean, default: false },
      hideEmail: { type: Boolean, default: false },
      hideCompany: { type: Boolean, default: false },
    },
    badge: {
      type: String,
      enum: ['NONE', 'VERIFIED_ALUMNUS', 'DISTINGUISHED_ALUMNUS', 'FOUNDING_MEMBER'],
      default: 'NONE',
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model('Profile', ProfileSchema);
