import mongoose from 'mongoose';

const ConnectionSchema = new mongoose.Schema(
  {
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING',
    },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Connection = mongoose.model('Connection', ConnectionSchema);
