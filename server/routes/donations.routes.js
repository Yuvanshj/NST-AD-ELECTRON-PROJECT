import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Campaign } from '../models/Campaign.js';
import { Donation } from '../models/Donation.js';
import { FundDisbursement } from '../models/FundDisbursement.js';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { verifyRazorpaySignature, verifyRazorpayWebhookSignature } from '../utils/crypto.js';
import { generateReceiptHtml } from '../utils/receiptGenerator.js';
import { authenticate, authorize, optionalAuthenticate, enforceTenantIsolation } from '../middleware/auth.js';

export const donationsRouter = express.Router();

// Initialize Razorpay client if credentials are configured
let razorpayClient = null;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  try {
    razorpayClient = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
    console.log('[Donations] Real Razorpay SDK client initialized.');
  } catch (err) {
    console.error('[Donations] Failed to initialize Razorpay SDK:', err.message);
  }
}

/**
 * GET /api/donations/campaigns
 * List active campaigns with financial progress
 */
donationsRouter.get('/campaigns', async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = { status: { $ne: 'ARCHIVED' } };
    if (collegeId) filter.collegeId = collegeId;

    const campaigns = await Campaign.find(filter)
      .populate('collegeId', 'name code city has80GExemption taxExemption80GNumber')
      .sort({ createdAt: -1 });

    const donations = await Donation.find({ paymentStatus: 'PAID' }).sort({ createdAt: -1 });

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
        has80GExemption: camp.collegeId?.has80GExemption ?? true,
      };
    });

    res.json({ success: true, count: formatted.length, campaigns: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/donations/create-order
 * Create an order for a donation (using real Razorpay order or secure dev/test mode)
 */
donationsRouter.post('/create-order', optionalAuthenticate, async (req, res) => {
  try {
    const { campaignId, donorId, userId, amount, donorPan, isAnonymous, donorName, donorEmail } = req.body;
    const effectiveUserId = req.user?._id || donorId || userId;
    const numericAmount = Number(amount);

    if (!campaignId) {
      return res.status(400).json({ success: false, message: 'Campaign ID is required.' });
    }
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Donation amount must be greater than zero.' });
    }

    const campaign = await Campaign.findById(campaignId).populate('collegeId');
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found.' });
    }

    let user = null;
    if (effectiveUserId) {
      user = await User.findById(effectiveUserId);
    }

    const effectiveDonorName = donorName || user?.fullName || 'Gujarat Alumnus';
    const effectiveDonorEmail = donorEmail || user?.email || '';

    // Check 80G tax exemption eligibility on the institution
    const isTaxExemptEligible = campaign.collegeId?.has80GExemption === true;
    const receiptPrefix = isTaxExemptEligible ? '80G-GOG' : 'RCP-GOG';
    const receiptNo = `${receiptPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let razorpayOrderId = '';
    let isSandbox = false;

    // Check if live Razorpay keys are configured
    if (razorpayClient && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
      try {
        const rzpOrder = await razorpayClient.orders.create({
          amount: Math.round(numericAmount * 100), // in paise
          currency: 'INR',
          receipt: receiptNo,
          notes: {
            campaignId: String(campaign._id),
            collegeId: String(campaign.collegeId?._id || campaign.collegeId),
            userId: String(effectiveUserId || ''),
            donorPan: donorPan || '',
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error('[Razorpay Order Creation Failed]', rzpErr);
        if (process.env.NODE_ENV === 'production') {
          return res.status(502).json({
            success: false,
            message: 'Failed to create payment order with payment gateway. Please try again.',
          });
        }
      }
    }

    // Fallback for development / test environments when credentials are unset
    if (!razorpayOrderId) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({
          success: false,
          message: 'Payment gateway credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) must be configured in production.',
        });
      }
      isSandbox = true;
      razorpayOrderId = `order_${Math.random().toString(36).substring(2, 12)}`;
    }

    // Create pending donation record
    const donation = await Donation.create({
      campaignId,
      collegeId: campaign.collegeId?._id || campaign.collegeId,
      userId: effectiveUserId || null,
      donorName: effectiveDonorName,
      donorEmail: effectiveDonorEmail,
      donorPan: donorPan ? donorPan.trim().toUpperCase() : '',
      amount: numericAmount,
      currency: 'INR',
      isAnonymous: Boolean(isAnonymous),
      paymentMethod: isSandbox ? 'RAZORPAY_SIMULATED' : 'RAZORPAY',
      paymentStatus: 'PENDING',
      receiptNumber: receiptNo,
      taxReceiptNumber: isTaxExemptEligible ? receiptNo : '',
      isTaxExemptEligible,
      razorpayOrderId,
    });

    res.json({
      success: true,
      donation,
      orderId: razorpayOrderId,
      keyId: RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: numericAmount,
      currency: 'INR',
      isSandbox,
      isTaxExemptEligible,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/donations/verify-payment
 * Verify Razorpay payment signature, finalize donation, issue receipt
 */
donationsRouter.post('/verify-payment', optionalAuthenticate, async (req, res) => {
  try {
    const { donationId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!donationId) {
      return res.status(400).json({ success: false, message: 'donationId is required for verification.' });
    }

    const donation = await Donation.findById(donationId).populate('campaignId collegeId');
    if (!donation) {
      return res.status(404).json({ success: false, message: 'Donation record not found.' });
    }

    // Idempotency: If already paid, return existing verified state
    if (donation.paymentStatus === 'PAID') {
      const receiptHtml = generateReceiptHtml({
        receiptNumber: donation.taxReceiptNumber || donation.receiptNumber,
        collegeName: donation.collegeId?.name || 'Gujarat Technical Education',
        donorName: donation.isAnonymous ? 'Anonymous Alumnus' : donation.donorName,
        donorPan: donation.donorPan,
        campaignTitle: donation.campaignId?.title || 'Higher Education Fund',
        amount: donation.amount,
        paymentReference: donation.razorpayPaymentId,
        date: donation.createdAt,
        isTaxExempt: donation.isTaxExemptEligible,
        taxExemptionNumber: donation.collegeId?.taxExemption80GNumber,
      });

      return res.json({
        success: true,
        donation,
        receiptHtml,
        message: 'Payment already verified.',
      });
    }

    const effectiveOrderId = razorpayOrderId || donation.razorpayOrderId;
    const effectivePaymentId = razorpayPaymentId || `pay_sim_${Date.now()}`;
    const effectiveSignature = razorpaySignature || `sig_sim_${Date.now()}`;

    // Verify cryptographic signature
    const isValidSignature = verifyRazorpaySignature(
      effectiveOrderId,
      effectivePaymentId,
      effectiveSignature,
      RAZORPAY_KEY_SECRET
    );

    if (!isValidSignature && process.env.NODE_ENV === 'production') {
      donation.paymentStatus = 'FAILED';
      donation.failureReason = 'Cryptographic signature mismatch';
      await donation.save();

      await AuditLog.create({
        collegeId: donation.collegeId?._id,
        userId: donation.userId,
        userEmail: donation.donorName,
        action: 'PAYMENT_VERIFICATION_FAILED',
        category: 'SECURITY',
        details: { donationId: donation._id, orderId: effectiveOrderId },
      });

      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Potential tampering detected.',
      });
    }

    // Update donation status to PAID
    donation.paymentStatus = 'PAID';
    donation.razorpayPaymentId = effectivePaymentId;
    donation.razorpaySignature = effectiveSignature;
    if (!donation.taxReceiptNumber && donation.isTaxExemptEligible) {
      donation.taxReceiptNumber = donation.receiptNumber;
    }
    await donation.save();

    // Increment campaign totals atomically
    if (donation.campaignId?._id) {
      await Campaign.findByIdAndUpdate(donation.campaignId._id, {
        $inc: { raisedAmount: donation.amount, donorCount: 1 },
      });
    }

    // Generate compliant receipt HTML
    const receiptHtml = generateReceiptHtml({
      receiptNumber: donation.taxReceiptNumber || donation.receiptNumber,
      collegeName: donation.collegeId?.name || 'Gujarat Technical Education',
      donorName: donation.isAnonymous ? 'Anonymous Alumnus' : donation.donorName,
      donorPan: donation.donorPan,
      campaignTitle: donation.campaignId?.title || 'Higher Education Fund',
      amount: donation.amount,
      paymentReference: donation.razorpayPaymentId,
      date: donation.createdAt || new Date(),
      isTaxExempt: donation.isTaxExemptEligible,
      taxExemptionNumber: donation.collegeId?.taxExemption80GNumber,
    });

    await AuditLog.create({
      collegeId: donation.collegeId?._id,
      userId: donation.userId,
      userEmail: donation.donorName,
      action: donation.isTaxExemptEligible ? 'DONATION_80G_ISSUED' : 'DONATION_PAID',
      category: 'DONATION',
      details: {
        receiptNumber: donation.taxReceiptNumber || donation.receiptNumber,
        amount: donation.amount,
        donorPan: donation.donorPan,
        isTaxExemptEligible: donation.isTaxExemptEligible,
      },
    });

    res.json({
      success: true,
      donation,
      receiptHtml,
      message: donation.isTaxExemptEligible
        ? 'Donation verified and Section 80G tax certificate generated.'
        : 'Donation verified and official acknowledgement receipt generated.',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/donations/webhook
 * Razorpay Webhook handler for asynchronous payment capture and status reconciliation
 */
donationsRouter.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (webhookSecret && !verifyRazorpayWebhookSignature(req.body, signature, webhookSecret)) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id;

      if (orderId) {
        const donation = await Donation.findOne({ razorpayOrderId: orderId });
        if (donation && donation.paymentStatus !== 'PAID') {
          donation.paymentStatus = 'PAID';
          donation.razorpayPaymentId = payment.id;
          await donation.save();

          await Campaign.findByIdAndUpdate(donation.campaignId, {
            $inc: { raisedAmount: donation.amount, donorCount: 1 },
          });

          await AuditLog.create({
            collegeId: donation.collegeId,
            userId: donation.userId,
            action: 'WEBHOOK_PAYMENT_CAPTURED',
            category: 'PAYMENT',
            details: { orderId, paymentId: payment.id, amount: donation.amount },
          });
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload?.payment?.entity;
      const orderId = payment?.order_id;
      if (orderId) {
        await Donation.findOneAndUpdate(
          { razorpayOrderId: orderId },
          { paymentStatus: 'FAILED', failureReason: payment?.error_description || 'Gateway reported failure' }
        );
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/donations/transparency or /api/donations/ledger
 * Public financial ledger of all verified contributions and disbursed funds
 */
const handleTransparencyLedger = async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = { paymentStatus: 'PAID' };
    if (collegeId) filter.collegeId = collegeId;

    const disbFilter = {};
    if (collegeId) disbFilter.collegeId = collegeId;

    const disbursements = await FundDisbursement.find(disbFilter)
      .populate('campaignId', 'title')
      .populate('collegeId', 'name code')
      .sort({ disbursedAt: -1, createdAt: -1 });

    const donations = await Donation.find(filter)
      .select('-donorPan') // protect donor PAN from public transparency API
      .sort({ createdAt: -1 });

    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const totalDisbursed = disbursements.reduce((sum, d) => sum + (d.amount || 0), 0);

    const formattedDisbursements = disbursements.map((d) => ({
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
      donations: donations.map((d) => ({
        _id: d._id,
        donorName: d.isAnonymous ? 'Anonymous Alumnus' : d.donorName,
        amount: d.amount,
        receiptNumber: d.receiptNumber,
        createdAt: d.createdAt,
      })),
      disbursements: formattedDisbursements,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

donationsRouter.get('/transparency', handleTransparencyLedger);
donationsRouter.get('/ledger', handleTransparencyLedger);

/**
 * GET /api/donations/leaderboard or /honor-roll
 */
const handleHonorRoll = async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = { paymentStatus: 'PAID' };
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
    res.status(500).json({ success: false, message: err.message });
  }
};

donationsRouter.get('/leaderboard', handleHonorRoll);
donationsRouter.get('/honor-roll', handleHonorRoll);

/**
 * POST /api/donations/disburse
 * Admin fund disbursement with institutional validation and audit trail
 */
donationsRouter.post('/disburse', authenticate, authorize('SUPER_ADMIN', 'STATE_DIRECTOR', 'COLLEGE_ADMIN'), async (req, res) => {
  try {
    const { campaignId, collegeId, recipientVendor, vendorName, amount, purpose, invoiceUrl } = req.body;
    const targetCollegeId = collegeId || req.user.collegeId?._id || req.user.collegeId;

    if (!enforceTenantIsolation(req, targetCollegeId)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot disburse funds belonging to another college.',
      });
    }

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid disbursement amount is required.' });
    }

    const disbursement = await FundDisbursement.create({
      campaignId: campaignId || null,
      collegeId: targetCollegeId,
      amount: numericAmount,
      recipientVendor: recipientVendor || vendorName,
      vendorName: vendorName || recipientVendor,
      purpose,
      invoiceUrl,
      approvedBy: req.user._id,
      disbursedAt: new Date(),
    });

    await AuditLog.create({
      collegeId: targetCollegeId,
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'FUND_DISBURSED',
      category: 'DONATION',
      details: { amount: numericAmount, vendor: recipientVendor || vendorName, purpose },
    });

    res.json({ success: true, disbursement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default donationsRouter;
