import express from 'express';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Notification } from '../models/Notification.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const chatRouter = express.Router();

/**
 * GET /api/chat/threads/:userId and /api/chat/conversations/:userId
 */
const getThreads = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ createdAt: -1 });

    const peerMap = new Map();

    for (const msg of messages) {
      const peerId = msg.senderId.toString() === userId.toString() ? msg.receiverId.toString() : msg.senderId.toString();
      const isUnread = msg.receiverId.toString() === userId.toString() && !msg.isRead;

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

    res.json({ success: true, count: threads.length, threads, conversations: threads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

chatRouter.get('/threads/:userId', optionalAuthenticate, getThreads);
chatRouter.get('/conversations/:userId', optionalAuthenticate, getThreads);

/**
 * GET /api/chat/messages/:user1/:user2 and /api/chat/conversation
 */
const getConversation = async (req, res) => {
  try {
    const userId = req.params.user1 || req.query.userId || req.user?._id;
    const peerId = req.params.user2 || req.query.peerId;

    if (!userId || !peerId) {
      return res.status(400).json({ success: false, message: 'User ID and peer ID are required' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: peerId },
        { senderId: peerId, receiverId: userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages received by current user as read
    await Message.updateMany(
      { senderId: peerId, receiverId: userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true, count: messages.length, messages, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

chatRouter.get('/messages/:user1/:user2', optionalAuthenticate, getConversation);
chatRouter.get('/conversation', optionalAuthenticate, getConversation);

/**
 * POST /api/chat/messages and /api/chat/send
 */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user?._id || req.body.senderId;
    const { receiverId, recipientId, content } = req.body;
    const targetReceiverId = receiverId || recipientId;

    if (!senderId || !targetReceiverId || !content) {
      return res.status(400).json({ success: false, message: 'Sender ID, receiver ID, and message content are required.' });
    }

    const msg = await Message.create({
      senderId,
      receiverId: targetReceiverId,
      content: content.trim(),
    });

    const sender = await User.findById(senderId);

    await Notification.create({
      userId: targetReceiverId,
      title: 'New Message',
      message: `${sender?.fullName || 'An alumnus'}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
      type: 'NETWORKING',
    });

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

chatRouter.post('/messages', optionalAuthenticate, sendMessage);
chatRouter.post('/send', optionalAuthenticate, sendMessage);

export default chatRouter;
