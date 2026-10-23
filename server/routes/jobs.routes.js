import express from 'express';
import { Job } from '../models/Job.js';
import { JobApplication } from '../models/JobApplication.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Notification } from '../models/Notification.js';

export const jobsRouter = express.Router();

// Get jobs
jobsRouter.get('/', async (req, res) => {
  try {
    const { currentUserId, canReferOnly, hasReferral, employmentType, query } = req.query;

    const filter = { status: 'ACTIVE' };
    if (canReferOnly === 'true' || hasReferral === 'true') filter.canRefer = true;
    if (employmentType) filter.employmentType = employmentType;
    if (query) {
      filter.$or = [
        { title: new RegExp(query, 'i') },
        { company: new RegExp(query, 'i') },
        { skillsRequired: new RegExp(query, 'i') },
      ];
    }

    const jobs = await Job.find(filter)
      .populate('posterId', 'fullName email')
      .populate('collegeId', 'name code')
      .sort({ createdAt: -1 });

    const applications = await JobApplication.find();

    const formatted = await Promise.all(
      jobs.map(async (j) => {
        const posterProfile = await Profile.findOne({ userId: j.posterId?._id });
        const appCount = applications.filter((a) => a.jobId.toString() === j._id.toString()).length;
        const hasApplied = currentUserId
          ? applications.some((a) => a.jobId.toString() === j._id.toString() && a.applicantId.toString() === currentUserId)
          : false;

        return {
          _id: j._id,
          id: j._id,
          posterId: j.posterId?._id,
          postedBy: {
            _id: j.posterId?._id,
            name: j.posterId?.fullName,
            collegeId: j.collegeId,
          },
          posterName: j.posterId?.fullName,
          posterCompany: posterProfile?.currentCompany,
          collegeName: j.collegeId?.name,
          title: j.title,
          company: j.company,
          location: j.location,
          employmentType: j.employmentType,
          experienceYears: j.experienceYears,
          skillsRequired: j.skillsRequired,
          salaryRange: j.salaryRange,
          description: j.description,
          canRefer: j.canRefer,
          isReferralAvailable: j.canRefer,
          referralInstructions: j.referralInstructions,
          deadline: j.deadline,
          status: j.status,
          applicationCount: appCount,
          hasApplied,
          createdAt: j.createdAt,
        };
      })
    );

    res.json({ success: true, count: formatted.length, jobs: formatted, data: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create job
jobsRouter.post('/', async (req, res) => {
  try {
    const job = await Job.create(req.body);
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Apply for job
jobsRouter.post('/apply', async (req, res) => {
  try {
    const { jobId, applicantId, resumeUrl, coverNote, referralRequested } = req.body;

    const existing = await JobApplication.findOne({ jobId, applicantId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this role.' });
    }

    const app = await JobApplication.create({
      jobId,
      applicantId,
      resumeUrl,
      coverNote,
      referralRequested: !!referralRequested,
    });

    const job = await Job.findById(jobId);
    const applicant = await User.findById(applicantId);

    if (job) {
      await Notification.create({
        userId: job.posterId,
        title: 'New Job Applicant',
        message: `${applicant?.fullName || 'A candidate'} applied for "${job.title}" at ${job.company}${referralRequested ? ' with a referral request' : ''}.`,
        type: 'JOB',
      });
    }

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get poster's applications
jobsRouter.get('/poster/:posterId', async (req, res) => {
  try {
    const jobs = await Job.find({ posterId: req.params.posterId });

    const result = await Promise.all(
      jobs.map(async (job) => {
        const apps = await JobApplication.find({ jobId: job._id }).populate('applicantId', 'fullName email');
        const formattedApps = await Promise.all(
          apps.map(async (a) => {
            const prof = await Profile.findOne({ userId: a.applicantId?._id });
            return {
              id: a._id,
              jobId: a.jobId,
              applicantId: a.applicantId?._id,
              applicantName: a.applicantId?.fullName,
              applicantEmail: a.applicantId?.email,
              applicantBatch: prof?.batch,
              applicantBranch: prof?.branch,
              resumeUrl: a.resumeUrl,
              coverNote: a.coverNote,
              referralRequested: a.referralRequested,
              status: a.status,
            };
          })
        );
        return { job, applications: formattedApps };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status
jobsRouter.put('/application/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const app = await JobApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    await Notification.create({
      userId: app.applicantId,
      title: 'Application Status Updated',
      message: `Your application status has been updated to: ${status.replace('_', ' ')}`,
      type: 'JOB',
    });

    res.json(app);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default jobsRouter;
