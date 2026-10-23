import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['REUNION', 'WEBINAR', 'WORKSHOP', 'NETWORKING_MEET', 'ANNUAL_GALA'],
      default: 'REUNION',
    },
    description: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    meetingLink: { type: String, default: null },
    capacity: { type: Number, required: true },
    registeredCount: { type: Number, default: 0 },
    ticketPrice: { type: Number, default: 0 },
    bannerUrl: { type: String },
    status: {
      type: String,
      enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'UPCOMING',
    },
  },
  { timestamps: true }
);

export const Event = mongoose.model('Event', EventSchema);
