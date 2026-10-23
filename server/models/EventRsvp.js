import mongoose from 'mongoose';

const EventRsvpSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketNumber: { type: String, required: true, unique: true },
    qrCodeData: { type: String, required: true },
    verificationHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['REGISTERED', 'CHECKED_IN', 'CANCELLED'],
      default: 'REGISTERED',
    },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const EventRsvp = mongoose.model('EventRsvp', EventRsvpSchema);
