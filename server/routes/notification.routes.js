import express from 'express';
import { Notification } from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications/:userId - Get notifications for user
router.get('/:userId', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({
      userId: req.params.userId,
      isRead: false,
    });
    res.json({ success: true, count: notifications.length, unreadCount, notifications });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/read-all/:userId - Mark all as read
router.post('/read-all/:userId', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
