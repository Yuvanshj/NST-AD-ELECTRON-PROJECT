import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['SCHOLARSHIP', 'LAB_EQUIPMENT', 'INFRASTRUCTURE', 'RESEARCH_INNOVATION', 'STUDENT_HARDSHIP'],
      default: 'SCHOLARSHIP',
    },
    description: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    donorCount: { type: Number, default: 0 },
    imageUrl: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model('Campaign', CampaignSchema);
