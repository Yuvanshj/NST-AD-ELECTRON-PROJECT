import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    userEmail: { type: String, default: null },
    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['AUTH', 'VERIFICATION', 'DONATION', 'CAREER', 'ADMIN', 'SECURITY', 'SYSTEM', 'PAYMENT', 'EVENT'],
      default: 'SYSTEM',
      index: true,
    },
    ipAddress: { type: String, default: '127.0.0.1' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

AuditLogSchema.index({ collegeId: 1, createdAt: -1 });
AuditLogSchema.index({ category: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

const OtpSessionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    otp: { type: String }, // stored for backward compatibility in dev, but hashed below
    otpHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['LOGIN', 'REGISTER', 'PASSWORD_RESET', 'EMAIL_VERIFICATION'],
      default: 'LOGIN',
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    expiresAt: { type: Date, required: true, index: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

OtpSessionSchema.index({ email: 1, isUsed: 1, expiresAt: 1 });

export const OtpSession = mongoose.model('OtpSession', OtpSessionSchema);
