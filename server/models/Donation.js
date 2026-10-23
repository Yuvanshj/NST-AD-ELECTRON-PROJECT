import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    isAnonymous: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    donorPan: { type: String, default: '' },
    donorName: { type: String, required: true },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'NET_BANKING', 'CARD', 'RAZORPAY_SIMULATED'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED'],
      default: 'PAID',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    taxReceiptNumber: { type: String, default: '' },
    receiptPdfContent: { type: String, default: '' },
    badgeAwarded: {
      type: String,
      enum: ['GOLD_PATRON', 'SILVER_BENEFACTOR', 'BRONZE_SUPPORTER', 'CONTRIBUTOR'],
      default: 'CONTRIBUTOR',
    },
  },
  { timestamps: true }
);

export const Donation = mongoose.model('Donation', DonationSchema);
