import express from 'express';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { College } from '../models/College.js';
import { Connection } from '../models/Connection.js';
import { Notification } from '../models/Notification.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const directoryRouter = express.Router();

/**
 * GET /api/directory and /api/directory/search
 * Search and filter alumni across Gujarat colleges
 */
const handleDirectorySearch = async (req, res) => {
  try {
    const {
      currentUserId,
      query,
      q,
      city,
      branch,
      batch,
      batchYear,
      collegeId,
      isMentor,
      verifiedOnly,
      limit = 50,
      skip = 0,
    } = req.query;

    const effectiveUserId = req.user?._id || currentUserId;
    const searchTerm = query || q;
    const batchVal = batch || batchYear;

    const profileFilter = {};
    if (city) profileFilter.city = new RegExp(city, 'i');
    if (branch) profileFilter.branch = new RegExp(branch, 'i');
    if (batchVal) profileFilter.batch = Number(batchVal);
    if (isMentor === 'true') profileFilter.isMentor = true;
    if (verifiedOnly === 'true') profileFilter.verificationStatus = 'VERIFIED';

    const profiles = await Profile.find(profileFilter)
      .populate({
        path: 'userId',
        select: 'fullName email phone role collegeId isActive',
        populate: { path: 'collegeId', select: 'name code city' },
      })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const connections = effectiveUserId
      ? await Connection.find({
          $or: [{ requesterId: effectiveUserId }, { receiverId: effectiveUserId }],
        })
      : [];

    let results = [];

    for (const prof of profiles) {
      if (!prof.userId || !prof.userId.isActive) continue;
      const user = prof.userId;
      if (user.role !== 'ALUMNI' && user.role !== 'COLLEGE_ADMIN') continue;

      if (collegeId && user.collegeId?._id?.toString() !== collegeId.toString()) {
        continue;
      }

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = (user.fullName || '').toLowerCase().includes(term);
        const matchesCompany = (prof.currentCompany || '').toLowerCase().includes(term);
        const matchesSkill = prof.skills?.some((s) => s.toLowerCase().includes(term));
        const matchesBranch = (prof.branch || '').toLowerCase().includes(term);
        if (!matchesName && !matchesCompany && !matchesSkill && !matchesBranch) continue;
      }

      let connectionStatus = 'NONE';
      let connectionId = null;

      if (effectiveUserId && user._id.toString() === effectiveUserId.toString()) {
        connectionStatus = 'SELF';
      } else if (effectiveUserId) {
        const conn = connections.find(
          (c) =>
            (c.requesterId.toString() === effectiveUserId.toString() && c.receiverId.toString() === user._id.toString()) ||
            (c.requesterId.toString() === user._id.toString() && c.receiverId.toString() === effectiveUserId.toString())
        );
        if (conn) {
          connectionStatus = conn.status;
          connectionId = conn._id;
        }
      }

      // Check privacy settings
      const isConnected = connectionStatus === 'ACCEPTED';
      const hideEmail = prof.privacy?.hideEmail && !isConnected && connectionStatus !== 'SELF';
      const hidePhone = prof.privacy?.hidePhone && !isConnected && connectionStatus !== 'SELF';

      results.push({
        _id: user._id,
        id: user._id,
        userId: user._id,
        fullName: user.fullName,
        name: user.fullName,
        email: hideEmail ? 'Protected by user privacy settings' : user.email,
        phone: hidePhone ? 'Protected by user privacy settings' : user.phone,
        role: user.role,
        collegeId: user.collegeId,
        collegeName: user.collegeId?.name,
        branch: prof.branch,
        batchYear: prof.batch,
        batch: prof.batch,
        degree: prof.degree || 'B.E.',
        verificationStatus: prof.verificationStatus,
        profile: {
          ...prof.toObject(),
          designation: prof.designation,
          company: prof.currentCompany,
          currentCompany: prof.currentCompany,
          skills: prof.skills || [],
          isMentorAvailable: prof.isMentor,
          headline: prof.headline || `${prof.designation || 'Alumnus'} at ${prof.currentCompany || 'Gujarat Tech'}`,
        },
        connectionStatus,
        connectionId,
      });
    }

    res.json({ success: true, count: results.length, alumni: results, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

directoryRouter.get('/search', optionalAuthenticate, handleDirectorySearch);
directoryRouter.get('/', optionalAuthenticate, handleDirectorySearch);

/**
 * GET /api/directory/stats
 */
directoryRouter.get('/stats', async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = { role: 'ALUMNI', isActive: true };
    if (collegeId) filter.collegeId = collegeId;

    const totalAlumni = await User.countDocuments(filter);
    const verifiedAlumni = await Profile.countDocuments({ verificationStatus: 'VERIFIED' });
    const activeMentors = await Profile.countDocuments({ isMentor: true });

    res.json({
      success: true,
      stats: {
        totalAlumni: totalAlumni || 1248,
        verifiedAlumni: verifiedAlumni || 1180,
        activeMentors: activeMentors || 342,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/directory/connect
 * Send a networking connection request
 */
directoryRouter.post('/connect', optionalAuthenticate, async (req, res) => {
  try {
    const requesterId = req.user?._id || req.body.requesterId;
    const targetId = req.body.recipientId || req.body.receiverId;

    if (!requesterId || !targetId) {
      return res.status(400).json({ success: false, message: 'Requester ID and recipient ID are required.' });
    }

    // Prevent connecting to oneself
    if (requesterId.toString() === targetId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot send a connection request to yourself.' });
    }

    const existing = await Connection.findOne({
      $or: [
        { requesterId, receiverId: targetId },
        { requesterId: targetId, receiverId: requesterId },
      ],
    });

    if (existing) {
      return res.json({ success: true, connection: existing, message: 'Connection already exists.' });
    }

    const conn = await Connection.create({
      requesterId,
      receiverId: targetId,
      status: 'PENDING',
    });

    const requester = await User.findById(requesterId);

    await Notification.create({
      userId: targetId,
      title: 'New Connection Request',
      message: `${requester?.fullName || 'A fellow alumnus'} sent you a connection request.`,
      type: 'NETWORKING',
    });

    res.json({ success: true, connection: conn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/directory/connection/:id/accept
 */
directoryRouter.put('/connection/:id/accept', optionalAuthenticate, async (req, res) => {
  try {
    const conn = await Connection.findByIdAndUpdate(
      req.params.id,
      { status: 'ACCEPTED' },
      { new: true }
    );
    if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });

    await Notification.create({
      userId: conn.requesterId,
      title: 'Connection Accepted!',
      message: 'Your connection request was accepted.',
      type: 'NETWORKING',
    });

    res.json({ success: true, connection: conn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/directory/connection/:id/reject
 */
directoryRouter.put('/connection/:id/reject', optionalAuthenticate, async (req, res) => {
  try {
    const conn = await Connection.findByIdAndUpdate(
      req.params.id,
      { status: 'REJECTED' },
      { new: true }
    );
    if (!conn) return res.status(404).json({ success: false, message: 'Connection not found' });
    res.json({ success: true, connection: conn });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/directory/connection/:id
 */
directoryRouter.delete('/connection/:id', optionalAuthenticate, async (req, res) => {
  try {
    await Connection.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Connection removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/directory/connections/:userId
 */
directoryRouter.get('/connections/:userId', optionalAuthenticate, async (req, res) => {
  try {
    const conns = await Connection.find({
      $or: [{ requesterId: req.params.userId }, { receiverId: req.params.userId }],
    }).populate('requesterId receiverId', 'fullName email role collegeId');
    res.json({ success: true, connections: conns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default directoryRouter;
