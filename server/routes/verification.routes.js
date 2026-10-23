import express from 'express';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { Notification } from '../models/Notification.js';

export const verificationRouter = express.Router();

// Get queue
const getVerificationQueue = async (req, res) => {
  try {
    const { collegeId, status } = req.query;
    const filter = {};
    if (collegeId) filter.collegeId = collegeId;
    if (status) filter.status = status;

    const requests = await VerificationRequest.find(filter)
      .populate('userId', 'fullName email')
      .populate('collegeId', 'name code')
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
          collegeId: r.collegeId,
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
    res.status(500).json({ message: err.message });
  }
};

verificationRouter.get('/queue', getVerificationQueue);
verificationRouter.get('/pending', getVerificationQueue);
verificationRouter.get('/', getVerificationQueue);

// Submit request
verificationRouter.post('/submit', async (req, res) => {
  try {
    const { userId, collegeId, enrollmentNumber, degreeProofDoc, passingYear, notes } = req.body;

    const reqDoc = await VerificationRequest.create({
      userId,
      collegeId,
      enrollmentNumber,
      degreeProofDoc,
      passingYear,
      status: 'PENDING',
      notes: notes || '',
    });

    await Profile.findOneAndUpdate(
      { userId },
      { enrollmentNumber, verificationStatus: 'PENDING' }
    );

    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Review request
verificationRouter.post('/review', async (req, res) => {
  try {
    const { requestId, reviewerAdminId, action, rejectionReason } = req.body;
    const reqDoc = await VerificationRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });

    const isApprove = action === 'APPROVE';
    reqDoc.status = isApprove ? 'VERIFIED' : 'REJECTED';
    reqDoc.reviewedBy = reviewerAdminId;
    reqDoc.reviewedAt = new Date();
    reqDoc.rejectionReason = isApprove ? null : rejectionReason || 'Documents insufficient';
    await reqDoc.save();

    const profile = await Profile.findOneAndUpdate(
      { userId: reqDoc.userId },
      {
        verificationStatus: isApprove ? 'VERIFIED' : 'REJECTED',
        verifiedAt: isApprove ? new Date() : null,
        verifiedBy: isApprove ? reviewerAdminId : null,
        badge: isApprove ? 'VERIFIED_ALUMNUS' : 'NONE',
        rejectionReason: reqDoc.rejectionReason,
      },
      { new: true }
    );

    await Notification.create({
      userId: reqDoc.userId,
      title: isApprove ? 'Verification Approved!' : 'Verification Notice',
      message: isApprove
        ? 'Congratulations! Your alumni credentials have been verified by the college alumni cell.'
        : `Your verification request was not approved: ${reqDoc.rejectionReason}`,
      type: 'VERIFICATION',
    });

    await AuditLog.create({
      collegeId: reqDoc.collegeId,
      userId: reviewerAdminId,
      action: isApprove ? 'VERIFICATION_APPROVED' : 'VERIFICATION_REJECTED',
      category: 'VERIFICATION',
      details: { enrollmentNumber: reqDoc.enrollmentNumber, targetUserId: reqDoc.userId },
    });

    res.json({ success: true, request: reqDoc, profile });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Bulk CSV Import
verificationRouter.post('/bulk-import', async (req, res) => {
  try {
    const { collegeId, adminId, csvData } = req.body;
    const lines = csvData.split('\n').filter((l) => l.trim().length > 0);
    const startIndex = lines[0].toLowerCase().includes('enrollment') ? 1 : 0;

    let count = 0;
    const errors = [];

    for (let i = startIndex; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < 5) {
        errors.push(`Line ${i + 1}: Insufficient columns`);
        continue;
      }
      const [enrollment, fullName, email, batchStr, branch, company] = parts;
      const cleanEmail = email.toLowerCase();

      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        errors.push(`Line ${i + 1}: Email ${cleanEmail} already registered`);
        continue;
      }

      const user = await User.create({
        collegeId,
        email: cleanEmail,
        passwordHash: 'alumni123',
        role: 'ALUMNI',
        fullName,
      });

      await Profile.create({
        userId: user._id,
        batch: parseInt(batchStr, 10) || 2020,
        branch,
        enrollmentNumber: enrollment,
        currentCompany: company || '',
        designation: 'Alumnus',
        verificationStatus: 'VERIFIED',
        verifiedAt: new Date(),
        badge: 'VERIFIED_ALUMNUS',
        skills: [branch],
      });

      count++;
    }

    res.json({ success: true, importedCount: count, errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify alias: POST /api/verification/:id/verify
verificationRouter.post('/:id/verify', async (req, res) => {
  req.body.requestId = req.params.id;
  req.body.action = 'APPROVE';
  req.body.reviewerAdminId = req.body.reviewerId;
  req.url = '/review';
  verificationRouter.handle(req, res);
});

// Reject alias: POST /api/verification/:id/reject
verificationRouter.post('/:id/reject', async (req, res) => {
  req.body.requestId = req.params.id;
  req.body.action = 'REJECT';
  req.body.reviewerAdminId = req.body.reviewerId;
  req.url = '/review';
  verificationRouter.handle(req, res);
});

export default verificationRouter;
