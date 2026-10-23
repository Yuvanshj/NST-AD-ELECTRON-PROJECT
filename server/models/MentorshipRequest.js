import mongoose from 'mongoose';

const MentorshipRequestSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'],
      default: 'PENDING',
    },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const MentorshipRequest = mongoose.model('MentorshipRequest', MentorshipRequestSchema);
