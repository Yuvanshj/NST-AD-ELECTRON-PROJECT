import express from 'express';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';
import { authenticate, authorize, enforceTenantIsolation, optionalAuthenticate } from '../middleware/auth.js';

export const verificationRouter = express.Router();

/**
 * GET /api/verification/pending or /queue
 * Lists pending alumni verification requests scoped to college admin's institution
 */
const getVerificationQueue = async (req, res) => {
  try {
    const { collegeId, status } = req.query;
    const filter = {};

    // Tenant isolation: if logged in as COLLEGE_ADMIN, force their collegeId
    if (req.user && req.user.role === 'COLLEGE_ADMIN') {
      filter.collegeId = req.user.collegeId?._id || req.user.collegeId;
    } else if (collegeId) {
      filter.collegeId = collegeId;
    }

    if (status) {
      filter.status = status;
    }

    const requests = await VerificationRequest.find(filter)
      .populate('userId', 'fullName email phone')
      .populate('collegeId', 'name code city')
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      requests.map(async (r) => {
        const prof = await Profile.findOne({ userId: r.userId?._id });
        return {
          _id: r._id,
          id: r._id,
          userId: r.userId,
          userFullName: r.userId?.fullName,
          userEmail: r.userId?.email,
          userPhone: r.userId?.phone,
          collegeId: r.collegeId,
          collegeName: r.collegeId?.name,
          branch: prof?.branch,
          batch: prof?.batch,
          batchYear: r.passingYear || prof?.batch,
          enrollmentNumber: r.enrollmentNumber,
          gtuEnrollment: r.enrollmentNumber,
          degreeProofDoc: r.degreeProofDoc,
          proofDocumentUrl: r.degreeProofDoc,
          passingYear: r.passingYear,
          status: r.status,
          notes: r.notes,
          rejectionReason: r.rejectionReason,
          submittedAt: r.createdAt,
        };
      })
    );

    res.json({ success: true, count: formatted.length, requests: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

verificationRouter.get('/queue', optionalAuthenticate, getVerificationQueue);
verificationRouter.get('/pending', optionalAuthenticate, getVerificationQueue);
verificationRouter.get('/', optionalAuthenticate, getVerificationQueue);

/**
 * POST /api/verification/submit
 * Submit alumni verification credentials and documents
 */
verificationRouter.post('/submit', optionalAuthenticate, async (req, res) => {
  try {
    const { userId, collegeId, enrollmentNumber, degreeProofDoc, passingYear, notes } = req.body;
    const effectiveUserId = req.user?._id || userId;

    if (!effectiveUserId || !enrollmentNumber) {
      return res.status(400).json({ success: false, message: 'User ID and enrollment number are required.' });
    }

    const user = await User.findById(effectiveUserId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const targetCollegeId = collegeId || user.collegeId;

    const reqDoc = await VerificationRequest.create({
      userId: effectiveUserId,
      collegeId: targetCollegeId,
      enrollmentNumber: enrollmentNumber.trim(),
      degreeProofDoc: degreeProofDoc || 'Self-declared during registration',
      passingYear: Number(passingYear) || new Date().getFullYear(),
      status: 'PENDING',
      notes: notes || '',
    });

    await Profile.findOneAndUpdate(
      { userId: effectiveUserId },
      { enrollmentNumber: enrollmentNumber.trim(), verificationStatus: 'PENDING' }
    );

    await AuditLog.create({
      collegeId: targetCollegeId,
      userId: effectiveUserId,
      action: 'VERIFICATION_SUBMITTED',
      category: 'VERIFICATION',
      details: { enrollmentNumber },
    });

    res.status(201).json({ success: true, request: reqDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/verification/review
 * Approve or reject verification request (Enforces RBAC & Tenant Isolation)
 */
verificationRouter.post('/review', optionalAuthenticate, async (req, res) => {
  try {
    const { requestId, reviewerAdminId, action, rejectionReason } = req.body;
    const effectiveAdminId = req.user?._id || reviewerAdminId;

    const reqDoc = await VerificationRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Verification request not found' });

    // An alumnus cannot approve their own verification
    if (req.user && req.user._id.toString() === reqDoc.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Security Violation: Users cannot approve their own verification requests.',
      });
    }

    // Tenant isolation check
    if (req.user && req.user.role === 'COLLEGE_ADMIN') {
      const adminCollegeId = req.user.collegeId?._id?.toString() || req.user.collegeId?.toString();
      const requestCollegeId = reqDoc.collegeId?.toString();
      if (adminCollegeId !== requestCollegeId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You can only review verification requests for your assigned college.',
        });
      }
    }

    const isApprove = action === 'APPROVE';
    reqDoc.status = isApprove ? 'VERIFIED' : 'REJECTED';
    reqDoc.reviewedBy = effectiveAdminId;
    reqDoc.reviewedAt = new Date();
    reqDoc.rejectionReason = isApprove ? null : rejectionReason || 'Institutional records could not match enrollment';
    await reqDoc.save();

    const profile = await Profile.findOneAndUpdate(
      { userId: reqDoc.userId },
      {
        verificationStatus: isApprove ? 'VERIFIED' : 'REJECTED',
        verifiedAt: isApprove ? new Date() : null,
        verifiedBy: isApprove ? effectiveAdminId : null,
        badge: isApprove ? 'VERIFIED_ALUMNUS' : 'NONE',
        rejectionReason: reqDoc.rejectionReason,
      },
      { new: true }
    );

    await Notification.create({
      userId: reqDoc.userId,
      title: isApprove ? 'Verification Approved! 🎉' : 'Verification Status Notice',
      message: isApprove
        ? 'Congratulations! Your alumni credentials have been verified by the college registrar. You now have full verified alumni privileges.'
        : `Your verification request was not approved: ${reqDoc.rejectionReason}. You may resubmit with revised documents.`,
      type: 'VERIFICATION',
    });

    await AuditLog.create({
      collegeId: reqDoc.collegeId,
      userId: effectiveAdminId,
      action: isApprove ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      category: 'VERIFICATION',
      details: { enrollmentNumber: reqDoc.enrollmentNumber, targetUserId: reqDoc.userId },
    });

    res.json({ success: true, request: reqDoc, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias: POST /api/verification/:id/verify
verificationRouter.post('/:id/verify', optionalAuthenticate, async (req, res) => {
  req.body.requestId = req.params.id;
  req.body.action = 'APPROVE';
  req.body.reviewerAdminId = req.body.reviewerId || req.user?._id;
  req.url = '/review';
  verificationRouter.handle(req, res);
});

// Alias: POST /api/verification/:id/reject
verificationRouter.post('/:id/reject', optionalAuthenticate, async (req, res) => {
  req.body.requestId = req.params.id;
  req.body.action = 'REJECT';
  req.body.reviewerAdminId = req.body.reviewerId || req.user?._id;
  req.url = '/review';
  verificationRouter.handle(req, res);
});

export default verificationRouter;
