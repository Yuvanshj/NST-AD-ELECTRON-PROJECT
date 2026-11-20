import express from 'express';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { MentorshipRequest } from '../models/MentorshipRequest.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const mentorshipRouter = express.Router();

/**
 * GET /api/mentorship/mentors
 * Explainable skill and branch matching between alumni mentors and students
 */
mentorshipRouter.get('/mentors', optionalAuthenticate, async (req, res) => {
  try {
    const { studentUserId, collegeId, branch } = req.query;
    const effectiveStudentId = req.user?._id || studentUserId;

    const mentorProfiles = await Profile.find({ isMentor: true, verificationStatus: 'VERIFIED' })
      .populate('userId', 'fullName email collegeId');

    let studentProfile = null;
    if (effectiveStudentId) {
      studentProfile = await Profile.findOne({ userId: effectiveStudentId });
    }

    const requests = await MentorshipRequest.find();

    const mentorCards = mentorProfiles
      .filter((p) => {
        if (!p.userId) return false;
        if (collegeId && p.userId.collegeId?.toString() !== collegeId.toString()) return false;
        if (branch && !p.branch?.toLowerCase().includes(branch.toLowerCase())) return false;
        return true;
      })
      .map((p) => {
        const activeCount = requests.filter(
          (r) => r.mentorId.toString() === p.userId?._id.toString() && (r.status === 'ACCEPTED' || r.status === 'PENDING')
        ).length;

        let matchScore = 50;
        let matchReasons = [];

        if (studentProfile) {
          if (studentProfile.branch?.toLowerCase() === p.branch?.toLowerCase()) {
            matchScore += 25;
            matchReasons.push(`Same academic discipline (${p.branch})`);
          }
          if (studentProfile.city?.toLowerCase() === p.city?.toLowerCase()) {
            matchScore += 15;
            matchReasons.push(`Located in ${p.city}`);
          }
          const commonSkills = studentProfile.skills?.filter((sk) =>
            p.skills?.some((ms) => ms.toLowerCase().includes(sk.toLowerCase()))
          );
          if (commonSkills && commonSkills.length > 0) {
            matchScore += Math.min(25, commonSkills.length * 10);
            matchReasons.push(`Shared expertise: ${commonSkills.join(', ')}`);
          }
        }

        return {
          userId: p.userId?._id,
          fullName: p.userId?.fullName,
          email: p.userId?.email,
          collegeId: p.userId?.collegeId,
          batch: p.batch,
          branch: p.branch,
          currentCompany: p.currentCompany,
          designation: p.designation,
          city: p.city,
          skills: p.skills,
          avatarUrl: p.avatarUrl,
          mentorDomain: p.mentorDomain,
          mentorAvailability: p.mentorAvailability,
          mentorMaxMentees: p.mentorMaxMentees,
          activeMenteesCount: activeCount,
          matchScore: Math.min(100, matchScore),
          matchReasons,
        };
      });

    res.json(mentorCards.sort((a, b) => b.matchScore - a.matchScore));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alias for smart matches
mentorshipRouter.get('/smart-matches/:studentId', optionalAuthenticate, async (req, res) => {
  req.query.studentUserId = req.params.studentId;
  req.url = '/mentors';
  mentorshipRouter.handle(req, res);
});

/**
 * POST /api/mentorship/request
 * Request mentorship session from an alumnus
 */
mentorshipRouter.post('/request', optionalAuthenticate, async (req, res) => {
  try {
    const { mentorId, topic, message } = req.body;
    const menteeId = req.user?._id || req.body.menteeId;

    if (!mentorId || !menteeId) {
      return res.status(400).json({ success: false, message: 'mentorId and menteeId are required' });
    }

    if (mentorId.toString() === menteeId.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot request mentorship from yourself.' });
    }

    let reqDoc = await MentorshipRequest.findOne({
      mentorId,
      menteeId,
      status: { $in: ['PENDING', 'ACCEPTED'] },
    });

    if (reqDoc) {
      return res.json(reqDoc);
    }

    reqDoc = await MentorshipRequest.create({
      mentorId,
      menteeId,
      topic: topic || 'Career Guidance',
      message: message || 'I would like to seek guidance on industry opportunities.',
      status: 'PENDING',
    });

    const mentee = await User.findById(menteeId);
    await Notification.create({
      userId: mentorId,
      title: 'New Mentorship Request',
      message: `${mentee?.fullName || 'A student'} requested mentorship guidance on: "${topic}"`,
      type: 'MENTORSHIP',
    });

    res.status(201).json(reqDoc);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/mentorship/respond and /api/mentorship/respond/:id
 */
const handleRespond = async (req, res) => {
  try {
    const requestId = req.params.requestId || req.params.id || req.body.requestId;
    const { action, status, responseNote } = req.body;

    const reqDoc = await MentorshipRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ success: false, message: 'Request not found' });

    const statusMap = {
      ACCEPT: 'ACCEPTED',
      ACCEPTED: 'ACCEPTED',
      REJECT: 'REJECTED',
      REJECTED: 'REJECTED',
      COMPLETE: 'COMPLETED',
      COMPLETED: 'COMPLETED',
    };

    reqDoc.status = statusMap[action] || statusMap[status] || reqDoc.status;
    reqDoc.respondedAt = new Date();
    if (responseNote) reqDoc.responseNote = responseNote;
    await reqDoc.save();

    await Notification.create({
      userId: reqDoc.menteeId,
      title: `Mentorship ${reqDoc.status}`,
      message: `Your mentorship request status has been updated to: ${reqDoc.status}`,
      type: 'MENTORSHIP',
    });

    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

mentorshipRouter.post('/respond', optionalAuthenticate, handleRespond);
mentorshipRouter.post('/respond/:requestId', optionalAuthenticate, handleRespond);

/**
 * GET /api/mentorship/requests/:userId and /api/mentorship/user/:userId
 */
const getUserMentorships = async (req, res) => {
  try {
    const { userId } = req.params;

    const asMentorDocs = await MentorshipRequest.find({ mentorId: userId }).populate('menteeId', 'fullName email phone');
    const asMenteeDocs = await MentorshipRequest.find({ menteeId: userId }).populate('mentorId', 'fullName email phone');

    const asMentor = await Promise.all(
      asMentorDocs.map(async (m) => {
        const prof = await Profile.findOne({ userId: m.menteeId?._id });
        return {
          id: m._id,
          _id: m._id,
          topic: m.topic,
          message: m.message,
          status: m.status,
          menteeName: m.menteeId?.fullName,
          menteeEmail: m.menteeId?.email,
          menteePhone: m.menteeId?.phone,
          menteeBranch: prof?.branch,
          createdAt: m.createdAt,
        };
      })
    );

    const asMentee = await Promise.all(
      asMenteeDocs.map(async (m) => {
        const prof = await Profile.findOne({ userId: m.mentorId?._id });
        return {
          id: m._id,
          _id: m._id,
          mentorId: m.mentorId?._id,
          topic: m.topic,
          message: m.message,
          status: m.status,
          mentorName: m.mentorId?.fullName,
          mentorEmail: m.mentorId?.email,
          mentorCompany: prof?.currentCompany,
          createdAt: m.createdAt,
        };
      })
    );

    res.json({ asMentor, asMentee, requests: [...asMentor, ...asMentee] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

mentorshipRouter.get('/user/:userId', optionalAuthenticate, getUserMentorships);
mentorshipRouter.get('/requests/:userId', optionalAuthenticate, getUserMentorships);

export default mentorshipRouter;
