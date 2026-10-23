import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    userEmail: { type: String, default: null },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ['AUTH', 'VERIFICATION', 'DONATION', 'CAREER', 'ADMIN', 'SECURITY', 'SYSTEM'],
      default: 'SYSTEM',
    },
    ipAddress: { type: String, default: '127.0.0.1' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', AuditLogSchema);

const OtpSessionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const OtpSession = mongoose.model('OtpSession', OtpSessionSchema);
