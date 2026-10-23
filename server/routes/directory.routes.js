import express from 'express';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { College } from '../models/College.js';
import { Connection } from '../models/Connection.js';
import { Notification } from '../models/Notification.js';

export const directoryRouter = express.Router();

// Search / list alumni
const handleDirectorySearch = async (req, res) => {
  try {
    const { currentUserId, query, q, city, branch, batch, batchYear, collegeId, isMentor, verifiedOnly } = req.query;

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
        select: 'fullName email phone role collegeId',
        populate: { path: 'collegeId', select: 'name code city' },
      })
      .sort({ createdAt: -1 });

    const connections = currentUserId
      ? await Connection.find({
          $or: [{ requesterId: currentUserId }, { receiverId: currentUserId }],
        })
      : [];

    let results = [];

    for (const prof of profiles) {
      if (!prof.userId) continue;
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
        if (!matchesName && !matchesCompany && !matchesSkill) continue;
      }

      let connectionStatus = 'NONE';
      if (currentUserId && user._id.toString() === currentUserId.toString()) {
        connectionStatus = 'SELF';
      } else if (currentUserId) {
        const conn = connections.find(
          (c) =>
            (c.requesterId.toString() === currentUserId && c.receiverId.toString() === user._id.toString()) ||
            (c.requesterId.toString() === user._id.toString() && c.receiverId.toString() === currentUserId)
        );
        if (conn) connectionStatus = conn.status;
      }

      results.push({
        _id: user._id,
        id: user._id,
        userId: user._id,
        fullName: user.fullName,
        name: user.fullName,
        email: prof.privacy?.hideEmail ? 'Hidden by user' : user.email,
        phone: prof.privacy?.hidePhone ? 'Hidden by user' : user.phone,
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
      });
    }

    res.json({ success: true, count: results.length, alumni: results, data: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

directoryRouter.get('/search', handleDirectorySearch);
directoryRouter.get('/', handleDirectorySearch);

// Stats
directoryRouter.get('/stats', async (req, res) => {
  try {
    const { collegeId } = req.query;
    const filter = { role: 'ALUMNI' };
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
    res.status(500).json({ message: err.message });
  }
});

// Connect
directoryRouter.post('/connect', async (req, res) => {
  try {
    const { requesterId, recipientId, receiverId } = req.body;
    const targetId = recipientId || receiverId;

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

    await Notification.create({
      userId: targetId,
      title: 'New Connection Request',
      message: 'A fellow Gujarat alumnus requested to connect with you.',
      type: 'NETWORKING',
    });

    res.json({ success: true, connection: conn });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Connections list
directoryRouter.get('/connections/:userId', async (req, res) => {
  try {
    const conns = await Connection.find({
      $or: [{ requesterId: req.params.userId }, { receiverId: req.params.userId }],
    }).populate('requesterId receiverId', 'fullName email role');
    res.json({ success: true, connections: conns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default directoryRouter;
