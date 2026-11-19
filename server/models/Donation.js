import mongoose from 'mongoose';

const DonationSchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    isAnonymous: { type: Boolean, default: false },
    isRecurring: { type: Boolean, default: false },
    donorPan: { type: String, default: '' },
    donorName: { type: String, required: true },
    donorEmail: { type: String, default: '' },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'NET_BANKING', 'CARD', 'RAZORPAY', 'RAZORPAY_SIMULATED'],
      default: 'UPI',
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    razorpayOrderId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '', index: true },
    razorpaySignature: { type: String, default: '' },
    receiptNumber: { type: String, default: '' },
    taxReceiptNumber: { type: String, default: '' },
    isTaxExemptEligible: { type: Boolean, default: false },
    receiptPdfContent: { type: String, default: '' },
    idempotencyKey: { type: String, default: '', index: true },
    failureReason: { type: String, default: '' },
    badgeAwarded: {
      type: String,
      enum: ['GOLD_PATRON', 'SILVER_BENEFACTOR', 'BRONZE_SUPPORTER', 'CONTRIBUTOR'],
      default: 'CONTRIBUTOR',
    },
  },
  { timestamps: true }
);

DonationSchema.index({ collegeId: 1, paymentStatus: 1, createdAt: -1 });
DonationSchema.index({ campaignId: 1, paymentStatus: 1 });

export const Donation = mongoose.model('Donation', DonationSchema);
