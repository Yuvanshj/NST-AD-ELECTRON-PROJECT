import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema(
  {
    posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT', 'REMOTE'],
      default: 'FULL_TIME',
    },
    experienceYears: { type: String, default: '1-3 Years' },
    skillsRequired: [{ type: String }],
    salaryRange: { type: String, default: 'Competitive' },
    description: { type: String, required: true },
    canRefer: { type: Boolean, default: false },
    referralInstructions: { type: String, default: '' },
    deadline: { type: String, required: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'CLOSED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export const Job = mongoose.model('Job', JobSchema);
