import mongoose from 'mongoose';

const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeUrl: { type: String, required: true },
    resumeFileName: { type: String, default: 'resume.pdf' },
    coverNote: { type: String, default: '' },
    referralRequested: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['APPLIED', 'UNDER_REVIEW', 'REFERRED', 'SHORTLISTED', 'REJECTED'],
      default: 'APPLIED',
    },
  },
  { timestamps: true }
);

export const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);
