import express from 'express';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { VerificationRequest } from '../models/VerificationRequest.js';
import { Donation } from '../models/Donation.js';
import { Job } from '../models/Job.js';
import { JobApplication } from '../models/JobApplication.js';
import { Event } from '../models/Event.js';
import { EventRsvp } from '../models/EventRsvp.js';
import { College } from '../models/College.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const analyticsRouter = express.Router();

/**
 * GET /api/analytics/dashboard
 * Aggregated administrative metrics with strict tenant scoping for college administrators
 */
analyticsRouter.get('/dashboard', optionalAuthenticate, async (req, res) => {
  try {
    let collegeId = req.query.collegeId;

    // Enforce tenant boundary: College Admin only sees their own institution's metrics
    if (req.user && req.user.role === 'COLLEGE_ADMIN') {
      collegeId = req.user.collegeId?._id || req.user.collegeId;
    }

    const userFilter = { role: 'ALUMNI', isActive: true };
    if (collegeId) userFilter.collegeId = collegeId;

    const alumniUsers = await User.find(userFilter);
    const studentUsers = await User.find({ role: 'STUDENT', isActive: true, ...(collegeId ? { collegeId } : {}) });
    const alumniIds = alumniUsers.map((u) => u._id);

    const profiles = await Profile.find({ userId: { $in: alumniIds } });
    const verifiedAlumni = profiles.filter((p) => p.verificationStatus === 'VERIFIED').length;
    const pendingVerifications = await VerificationRequest.countDocuments({
      status: 'PENDING',
      ...(collegeId ? { collegeId } : {}),
    });
    const activeMentors = profiles.filter((p) => p.isMentor && p.verificationStatus === 'VERIFIED').length;

    const donationFilter = { paymentStatus: 'PAID' };
    if (collegeId) donationFilter.collegeId = collegeId;
    const donations = await Donation.find(donationFilter);
    const totalRaised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
    const avgDonation = donations.length > 0 ? Math.round(totalRaised / donations.length) : 0;

    const jobFilter = { status: 'ACTIVE', ...(collegeId ? { collegeId } : {}) };
    const jobs = await Job.find(jobFilter);
    const referralJobs = jobs.filter((j) => j.canRefer).length;
    const totalJobApplications = await JobApplication.countDocuments();

    const eventFilter = collegeId ? { collegeId } : {};
    const events = await Event.find(eventFilter);
    const eventIds = events.map((e) => e._id);
    const rsvps = await EventRsvp.find({ eventId: { $in: eventIds } });
    const checkedInCount = rsvps.filter((r) => r.status === 'CHECKED_IN').length;

    // Demographic distributions
    const cityCounts = {};
    const branchCounts = {};
    const industryCounts = {};
    const batchCounts = {};

    for (const p of profiles) {
      if (p.city) cityCounts[p.city] = (cityCounts[p.city] || 0) + 1;
      if (p.branch) branchCounts[p.branch] = (branchCounts[p.branch] || 0) + 1;
      if (p.industry) industryCounts[p.industry] = (industryCounts[p.industry] || 0) + 1;
      if (p.batch) batchCounts[p.batch] = (batchCounts[p.batch] || 0) + 1;
    }

    const verificationPct = alumniUsers.length > 0 ? Math.round((verifiedAlumni / alumniUsers.length) * 100) : 0;

    res.json({
      success: true,
      stats: {
        totalAlumni: alumniUsers.length,
        verifiedAlumni,
        verificationRate: `${verificationPct}%`,
        totalDonationsAmount: totalRaised,
        activeMentorships: activeMentors,
      },
      overview: {
        totalAlumni: alumniUsers.length,
        verifiedAlumni,
        pendingVerifications,
        verificationRate: verificationPct,
        totalStudents: studentUsers.length,
        activeMentors,
        totalDonationsRaised: totalRaised,
        totalDonationsCount: donations.length,
        averageDonation: avgDonation,
        activeJobs: jobs.length,
        referralJobPercentage: jobs.length > 0 ? Math.round((referralJobs / jobs.length) * 100) : 0,
        totalJobApplications,
        totalEvents: events.length,
        totalEventRegistrations: rsvps.length,
        eventAttendanceRate: rsvps.length > 0 ? Math.round((checkedInCount / (rsvps.length || 1)) * 100) : 0,
      },
      cityDistribution: Object.entries(cityCounts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count),
      branchDistribution: Object.entries(branchCounts).map(([branch, count]) => ({ branch, count })).sort((a, b) => b.count - a.count),
      industryDistribution: Object.entries(industryCounts).map(([industry, count]) => ({ industry, count })).sort((a, b) => b.count - a.count),
      batchDistribution: Object.entries(batchCounts).map(([batch, count]) => ({ batch: Number(batch), count })).sort((a, b) => a.batch - b.batch),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/analytics/colleges-comparison
 * Cross-college benchmark metrics for State Administrators
 */
analyticsRouter.get('/colleges-comparison', optionalAuthenticate, async (req, res) => {
  try {
    const colleges = await College.find({ isActive: true });
    const comparison = await Promise.all(
      colleges.map(async (c) => {
        const alumniCount = await User.countDocuments({ collegeId: c._id, role: 'ALUMNI', isActive: true });
        const users = await User.find({ collegeId: c._id });
        const userIds = users.map((u) => u._id);
        const profiles = await Profile.find({ userId: { $in: userIds } });
        const verified = profiles.filter((p) => p.verificationStatus === 'VERIFIED').length;
        const mentors = profiles.filter((p) => p.isMentor).length;
        const donations = await Donation.find({ collegeId: c._id, paymentStatus: 'PAID' });
        const raised = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

        return {
          collegeId: c._id,
          collegeName: c.name,
          code: c.code,
          city: c.city,
          alumniCount,
          verifiedRate: `${alumniCount > 0 ? Math.round((verified / alumniCount) * 100) : 0}%`,
          donationsRaised: raised,
          mentorCount: mentors,
        };
      })
    );

    res.json({ success: true, count: comparison.length, comparison });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default analyticsRouter;
