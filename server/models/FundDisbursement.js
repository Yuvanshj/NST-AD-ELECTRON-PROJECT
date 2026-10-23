import mongoose from 'mongoose';

const FundDisbursementSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    amount: { type: Number, required: true },
    purpose: { type: String, required: true },
    vendorName: { type: String, required: true },
    invoiceRef: { type: String, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    disbursedAt: { type: Date, default: Date.now },
    auditNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const FundDisbursement = mongoose.model('FundDisbursement', FundDisbursementSchema);
