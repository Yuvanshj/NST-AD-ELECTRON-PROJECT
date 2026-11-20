import express from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/audit
 * Immutable audit log stream, tenant-scoped for college administrators
 */
router.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { collegeId, category, action, limit = 50, skip = 0 } = req.query;
    const query = {};

    // Tenant isolation: College Admin only sees logs for their college
    if (req.user && req.user.role === 'COLLEGE_ADMIN') {
      query.collegeId = req.user.collegeId?._id || req.user.collegeId;
    } else if (collegeId) {
      query.collegeId = collegeId;
    }

    if (category) query.category = category;
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .populate('userId', 'fullName email role')
      .populate('collegeId', 'name code')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({ success: true, count: logs.length, total, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/audit/summary
 */
router.get('/summary', optionalAuthenticate, async (req, res) => {
  try {
    const match = {};
    if (req.user && req.user.role === 'COLLEGE_ADMIN') {
      match.collegeId = req.user.collegeId?._id || req.user.collegeId;
    }

    const counts = await AuditLog.aggregate([
      ...(Object.keys(match).length ? [{ $match: match }] : []),
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, summary: counts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
