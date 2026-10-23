import express from 'express';
import { Profile } from '../models/Profile.js';
import { User } from '../models/User.js';
import { MentorshipRequest } from '../models/MentorshipRequest.js';
import { Notification } from '../models/Notification.js';

export const mentorshipRouter = express.Router();

// Get Available Mentors
mentorshipRouter.get('/mentors', async (req, res) => {
  try {
    const { studentUserId } = req.query;

    const mentorProfiles = await Profile.find({ isMentor: true, verificationStatus: 'VERIFIED' })
      .populate('userId', 'fullName email collegeId');

    let studentProfile = null;
    if (studentUserId) {
      studentProfile = await Profile.findOne({ userId: studentUserId });
    }

    const requests = await MentorshipRequest.find();

    const mentorCards = mentorProfiles.map((p) => {
      const activeCount = requests.filter(
        (r) => r.mentorId.toString() === p.userId?._id.toString() && (r.status === 'ACCEPTED' || r.status === 'PENDING')
      ).length;

      let matchScore = 50;
      if (studentProfile) {
        if (studentProfile.branch?.toLowerCase() === p.branch?.toLowerCase()) matchScore += 30;
        if (studentProfile.city?.toLowerCase() === p.city?.toLowerCase()) matchScore += 10;
        const commonSkills = studentProfile.skills?.filter((sk) =>
          p.skills?.some((ms) => ms.toLowerCase().includes(sk.toLowerCase()))
        );
        matchScore += Math.min(30, (commonSkills?.length || 0) * 10);
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
      };
    });

    res.json(mentorCards.sort((a, b) => b.matchScore - a.matchScore));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request Mentorship
mentorshipRouter.post('/request', async (req, res) => {
  try {
    const { mentorId, menteeId, topic, message } = req.body;

    let reqDoc = await MentorshipRequest.findOne({ mentorId, menteeId, status: { $ne: 'REJECTED' } });
    if (!reqDoc) {
      reqDoc = await MentorshipRequest.create({
        mentorId,
        menteeId,
        topic,
        message,
        status: 'PENDING',
      });

      const mentee = await User.findById(menteeId);
      await Notification.create({
        userId: mentorId,
        title: 'New Mentorship Request',
        message: `${mentee?.fullName || 'A student'} requested mentorship on: "${topic}"`,
        type: 'MENTORSHIP',
      });
    }

    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Respond Mentorship
mentorshipRouter.post('/respond', async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const reqDoc = await MentorshipRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Request not found' });

    const statusMap = { ACCEPT: 'ACCEPTED', REJECT: 'REJECTED', COMPLETE: 'COMPLETED' };
    reqDoc.status = statusMap[action] || reqDoc.status;
    reqDoc.respondedAt = new Date();
    await reqDoc.save();

    await Notification.create({
      userId: reqDoc.menteeId,
      title: `Mentorship ${reqDoc.status}`,
      message: `Your mentorship request status has been updated to: ${reqDoc.status}`,
      type: 'MENTORSHIP',
    });

    res.json(reqDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User Mentorships
mentorshipRouter.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const asMentorDocs = await MentorshipRequest.find({ mentorId: userId }).populate('menteeId', 'fullName email');
    const asMenteeDocs = await MentorshipRequest.find({ menteeId: userId }).populate('mentorId', 'fullName email');

    const asMentor = await Promise.all(
      asMentorDocs.map(async (m) => {
        const prof = await Profile.findOne({ userId: m.menteeId?._id });
        return {
          id: m._id,
          topic: m.topic,
          message: m.message,
          status: m.status,
          menteeName: m.menteeId?.fullName,
          menteeEmail: m.menteeId?.email,
          menteeBranch: prof?.branch,
        };
      })
    );

    const asMentee = await Promise.all(
      asMenteeDocs.map(async (m) => {
        const prof = await Profile.findOne({ userId: m.mentorId?._id });
        return {
          id: m._id,
          mentorId: m.mentorId?._id,
          topic: m.topic,
          message: m.message,
          status: m.status,
          mentorName: m.mentorId?.fullName,
          mentorEmail: m.mentorId?.email,
          mentorCompany: prof?.currentCompany,
        };
      })
    );

    res.json({ asMentor, asMentee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
