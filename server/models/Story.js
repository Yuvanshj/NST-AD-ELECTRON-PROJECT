import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    content: { type: String, required: true },
    milestone: { type: String, required: true },
    imageUrl: { type: String },
    isFeatured: { type: Boolean, default: false },
    isAlumniOfTheYear: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const Story = mongoose.model('Story', StorySchema);
