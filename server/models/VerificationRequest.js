import mongoose from 'mongoose';

const VerificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    enrollmentNumber: { type: String, required: true },
    degreeProofDoc: { type: String, required: true },
    passingYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    notes: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
  },
  { timestamps: true }
);

export const VerificationRequest = mongoose.model('VerificationRequest', VerificationRequestSchema);
