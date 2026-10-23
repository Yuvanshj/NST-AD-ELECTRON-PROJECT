import express from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';

export const chatRouter = express.Router();

// Get Threads
chatRouter.get('/threads/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const peerMap = new Map();

    for (const msg of messages) {
      const peerId = msg.senderId.toString() === userId ? msg.receiverId.toString() : msg.senderId.toString();
      const isUnread = msg.receiverId.toString() === userId && !msg.isRead;

      if (!peerMap.has(peerId)) {
        peerMap.set(peerId, { lastMsg: msg, unread: isUnread ? 1 : 0 });
      } else if (isUnread) {
        peerMap.get(peerId).unread++;
      }
    }

    const threads = [];
    for (const [peerId, data] of peerMap.entries()) {
      const peer = await User.findById(peerId);
      const prof = await Profile.findOne({ userId: peerId });
      if (peer) {
        threads.push({
          peerId,
          peerName: peer.fullName,
          peerAvatar: prof?.avatarUrl || '',
          peerCompany: prof?.currentCompany || '',
          lastMessage: data.lastMsg.content,
          lastMessageAt: data.lastMsg.createdAt,
          unreadCount: data.unread,
        });
      }
    }

    res.json(threads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Conversation
chatRouter.get('/conversation', async (req, res) => {
  try {
    const { userId, peerId } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { senderId: peerId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send Message
chatRouter.post('/send', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    const msg = await Message.create({ senderId, receiverId, content });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
