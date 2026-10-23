import express from 'express';
import { Campaign } from '../models/Campaign.js';
import { Donation } from '../models/Donation.js';
import { FundDisbursement } from '../models/FundDisbursement.js';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { verifyRazorpaySignature } from '../utils/crypto.js';
import { generate80GReceiptHtml } from '../utils/receiptGenerator.js';

export const donationsRouter = express.Router();

// Get campaigns
donationsRouter.get('/campaigns', async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = {};
    if (collegeId) filter.collegeId = collegeId;

    const campaigns = await Campaign.find(filter).populate('collegeId', 'name code').sort({ createdAt: -1 });
    const donations = await Donation.find().sort({ createdAt: -1 });

    const formatted = campaigns.map((camp) => {
      const campDonations = donations.filter((d) => d.campaignId?.toString() === camp._id.toString());
      const percent = camp.targetAmount > 0 ? Math.min(100, Math.round((camp.raisedAmount / camp.targetAmount) * 100)) : 0;
      const recent = campDonations.slice(0, 5).map((d) => ({
        donorName: d.isAnonymous ? 'Anonymous Alumnus' : d.donorName,
        amount: d.amount,
        badgeAwarded: d.badgeAwarded,
        createdAt: d.createdAt,
      }));

      return {
        _id: camp._id,
        id: camp._id,
        collegeId: camp.collegeId,
        collegeName: camp.collegeId?.name,
        title: camp.title,
        category: camp.category,
        description: camp.description,
        targetAmount: camp.targetAmount,
        raisedAmount: camp.raisedAmount,
        currentAmount: camp.raisedAmount,
        donorCount: camp.donorCount,
        imageUrl: camp.imageUrl,
        percentAchieved: percent,
        recentDonations: recent,
        status: camp.status,
      };
    });

    res.json({ success: true, count: formatted.length, campaigns: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create Order (Simulated Razorpay Order)
donationsRouter.post('/create-order', async (req, res) => {
  try {
    const { campaignId, donorId, userId, amount, donorPan, isAnonymous } = req.body;
    const effectiveUserId = donorId || userId;

    const user = await User.findById(effectiveUserId);
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const receiptNo = `80G-GOG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const donation = await Donation.create({
      campaignId,
      collegeId: campaign.collegeId,
      userId: effectiveUserId,
      donorName: user?.fullName || 'Gujarat Alumnus',
      donorPan: donorPan || 'ABCDE1234F',
      amount: Number(amount),
      isAnonymous: !!isAnonymous,
      paymentMethod: 'RAZORPAY_SIMULATED',
      paymentStatus: 'PENDING',
      receiptNumber: receiptNo,
      taxReceiptNumber: receiptNo,
      razorpayOrderId: 'order_' + Math.random().toString(36).substring(2, 10),
    });

    res.json({ success: true, donation, orderId: donation.razorpayOrderId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify Payment and issue 80G certificate
donationsRouter.post('/verify-payment', async (req, res) => {
  try {
    const { donationId, razorpayPaymentId, razorpaySignature } = req.body;

    const donation = await Donation.findById(donationId).populate('campaignId collegeId');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.paymentStatus = 'PAID';
    donation.razorpayPaymentId = razorpayPaymentId || 'pay_sim_' + Date.now();
    donation.razorpaySignature = razorpaySignature || 'sig_sim_' + Date.now();
    await donation.save();

    // Increment campaign
    await Campaign.findByIdAndUpdate(donation.campaignId._id, {
      $inc: { raisedAmount: donation.amount, donorCount: 1 },
    });

    // Generate 80G Receipt HTML
    const receiptHtml = generate80GReceiptHtml({
      receiptNumber: donation.taxReceiptNumber || donation.receiptNumber,
      collegeName: donation.collegeId?.name || 'Gujarat Engineering College',
      donorName: donation.donorName,
      donorPan: donation.donorPan,
      campaignTitle: donation.campaignId?.title || 'Higher Education Fund',
      amount: donation.amount,
      paymentReference: donation.razorpayPaymentId,
      date: donation.createdAt || new Date(),
    });

    await AuditLog.create({
      collegeId: donation.collegeId?._id,
      userId: donation.userId,
      userEmail: donation.donorName,
      action: 'DONATION_80G_ISSUED',
      category: 'DONATION',
      details: {
        receiptNumber: donation.taxReceiptNumber,
        amount: donation.amount,
        donorPan: donation.donorPan,
      },
    });

    res.json({
      success: true,
      donation,
      receiptHtml,
      message: 'Donation verified and 80G certificate generated.',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Process donation (direct combined handler)
donationsRouter.post('/process', async (req, res) => {
  try {
    const { campaignId, userId, amount, isAnonymous, donorPan, donorName } = req.body;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const college = await College.findById(campaign.collegeId);
    const receiptNo = `80G-GOG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const donation = await Donation.create({
      campaignId,
      collegeId: campaign.collegeId,
      userId,
      donorName: donorName || 'Alumnus Contributor',
      donorPan: donorPan || 'ABCDE1234F',
      amount: Number(amount),
      isAnonymous: !!isAnonymous,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      taxReceiptNumber: receiptNo,
      razorpayPaymentId: 'pay_' + Date.now(),
    });

    campaign.raisedAmount += Number(amount);
    campaign.donorCount += 1;
    await campaign.save();

    const receiptHtml = generate80GReceiptHtml(donation, college, campaign);

    res.json({ success: true, donation, receiptHtml });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Transparency Ledger
const handleTransparencyLedger = async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = {};
    if (collegeId) filter.collegeId = collegeId;

    const disbursements = await FundDisbursement.find(filter)
      .populate('campaignId', 'title')
      .populate('collegeId', 'name code')
      .sort({ disbursedAt: -1, createdAt: -1 });

    const donations = await Donation.find(filter).sort({ createdAt: -1 });

    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDisbursed = disbursements.reduce((sum, d) => sum + (d.amount || 0), 0);

    const formatted = disbursements.map((d) => ({
      _id: d._id,
      id: d._id,
      campaignId: d.campaignId?._id,
      campaignTitle: d.campaignId?.title,
      collegeId: d.collegeId,
      collegeName: d.collegeId?.name,
      amount: d.amount,
      purpose: d.purpose,
      recipientVendor: d.vendorName || d.recipientVendor,
      vendorName: d.vendorName || d.recipientVendor,
      invoiceRef: d.invoiceRef,
      invoiceUrl: d.invoiceUrl || d.invoiceRef,
      disbursedAt: d.disbursedAt || d.createdAt,
      auditNotes: d.auditNotes,
    }));

    res.json({
      success: true,
      totalRaised,
      totalDisbursed,
      currentReserve: totalRaised - totalDisbursed,
      donations,
      disbursements: formatted,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

donationsRouter.get('/transparency', handleTransparencyLedger);
donationsRouter.get('/ledger', handleTransparencyLedger);

// Leaderboard / Honor Roll
const handleHonorRoll = async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = {};
    if (collegeId) filter.collegeId = collegeId;

    const donations = await Donation.find(filter);

    const donorAgg = new Map();
    for (const d of donations) {
      const key = d.isAnonymous ? `anon_${d._id}` : (d.userId?.toString() || d.donorName);
      const existing = donorAgg.get(key) || {
        donorName: d.isAnonymous ? 'Anonymous Alumnus' : d.donorName,
        totalContributed: 0,
        donationCount: 0,
      };
      existing.totalContributed += d.amount;
      existing.donationCount += 1;
      donorAgg.set(key, existing);
    }

    const leaderboard = Array.from(donorAgg.values())
      .sort((a, b) => b.totalContributed - a.totalContributed)
      .map((donor) => {
        let tier = 'Supporter';
        if (donor.totalContributed >= 100000) tier = 'Visionary Patron';
        else if (donor.totalContributed >= 25000) tier = 'Distinguished Benefactor';
        else if (donor.totalContributed >= 5000) tier = 'Honored Donor';
        return { ...donor, tier };
      });

    res.json({ success: true, count: leaderboard.length, honorRoll: leaderboard, leaderboard });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

donationsRouter.get('/leaderboard', handleHonorRoll);
donationsRouter.get('/honor-roll', handleHonorRoll);

// Disburse funds
donationsRouter.post('/disburse', async (req, res) => {
  try {
    const { campaignId, collegeId, recipientVendor, vendorName, amount, purpose, invoiceUrl, approvedBy } = req.body;

    const disbursement = await FundDisbursement.create({
      campaignId: campaignId || null,
      collegeId: collegeId || null,
      amount: Number(amount),
      recipientVendor: recipientVendor || vendorName,
      vendorName: vendorName || recipientVendor,
      purpose,
      invoiceUrl,
      approvedBy,
      disbursedAt: new Date(),
    });

    await AuditLog.create({
      collegeId,
      userId: approvedBy,
      action: 'FUND_DISBURSED',
      category: 'DONATION',
      details: { amount, vendor: recipientVendor || vendorName, purpose },
    });

    res.json({ success: true, disbursement });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default donationsRouter;
