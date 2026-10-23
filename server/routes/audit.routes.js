import express from 'express';
import { AuditLog } from '../models/AuditLog.js';

const router = express.Router();

// GET /api/audit - List audit logs with filters
router.get('/', async (req, res) => {
  try {
    const { collegeId, category, limit = 50, skip = 0 } = req.query;
    const query = {};
    if (collegeId) query.collegeId = collegeId;
    if (category) query.category = category;

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .populate('collegeId', 'name code')
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({ success: true, count: logs.length, total, logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/audit/summary - Category breakdown
router.get('/summary', async (req, res) => {
  try {
    const counts = await AuditLog.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    res.json({ success: true, summary: counts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
