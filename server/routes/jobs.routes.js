import express from 'express';
import { Job } from '../models/Job.js';
import { JobApplication } from '../models/JobApplication.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { College } from '../models/College.js';
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
          jobType: j.employmentType, // Safe alias for frontend
          experienceYears: j.experienceYears,
          experienceLevel: j.experienceYears,
          skillsRequired: j.skillsRequired || [],
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

// Create job with robust field normalization
jobsRouter.post('/', async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      salaryRange,
      description,
      skillsRequired,
      referralInstructions,
    } = req.body;

    const posterId = req.body.posterId || req.body.postedBy || req.body.userId;
    if (!posterId) {
      return res.status(400).json({ message: 'posterId is required to post an opening' });
    }

    let collegeId = req.body.collegeId;
    if (!collegeId) {
      const user = await User.findById(posterId);
      collegeId = user?.collegeId;
    }
    if (!collegeId) {
      const firstCol = await College.findOne();
      collegeId = firstCol?._id;
    }

    const employmentType = req.body.employmentType || req.body.jobType || 'FULL_TIME';
    const canRefer =
      req.body.canRefer !== undefined
        ? Boolean(req.body.canRefer)
        : req.body.isReferralAvailable !== undefined
        ? Boolean(req.body.isReferralAvailable)
        : true;

    const deadline =
      req.body.deadline ||
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const experienceYears = req.body.experienceYears || req.body.experienceLevel || '1-3 Years';

    const parsedSkills = Array.isArray(skillsRequired)
      ? skillsRequired
      : typeof skillsRequired === 'string'
      ? skillsRequired
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const job = await Job.create({
      posterId,
      collegeId,
      title: title || 'Software Engineer',
      company: company || 'Gujarat Tech Co.',
      location: location || 'Ahmedabad, Gujarat',
      employmentType,
      experienceYears,
      skillsRequired: parsedSkills,
      salaryRange: salaryRange || 'Competitive',
      description: description || 'Exciting engineering role with GTU alumni referral support.',
      canRefer,
      referralInstructions:
        referralInstructions ||
        'Alumni referral available for qualified Gujarat engineering candidates.',
      deadline,
      status: 'ACTIVE',
    });

    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Apply for job / Request referral
jobsRouter.post('/apply', async (req, res) => {
  try {
    const { jobId } = req.body;
    const applicantId = req.body.applicantId || req.body.userId;
    const resumeUrl = req.body.resumeUrl || 'https://drive.google.com/sample-resume.pdf';
    const coverNote = req.body.coverNote || req.body.coverLetter || '';
    const referralRequested =
      req.body.referralRequested !== undefined
        ? Boolean(req.body.referralRequested)
        : req.body.requestReferral !== undefined
        ? Boolean(req.body.requestReferral)
        : true;

    if (!jobId || !applicantId) {
      return res.status(400).json({ message: 'jobId and applicantId are required' });
    }

    const existing = await JobApplication.findOne({ jobId, applicantId });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this role.' });
    }

    const app = await JobApplication.create({
      jobId,
      applicantId,
      resumeUrl,
      coverNote,
      referralRequested,
      status: 'APPLIED',
    });

    const job = await Job.findById(jobId);
    const applicant = await User.findById(applicantId);

    if (job) {
      await Notification.create({
        userId: job.posterId,
        title: 'New Referral Application',
        message: `${applicant?.fullName || 'A candidate'} applied for "${job.title}" at ${job.company}${
          referralRequested ? ' with an internal referral request' : ''
        }.`,
        type: 'JOB',
      });
    }

    res.status(201).json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get applicant's submitted applications
jobsRouter.get('/applications/:userId', async (req, res) => {
  try {
    const apps = await JobApplication.find({ applicantId: req.params.userId })
      .populate({
        path: 'jobId',
        populate: [
          { path: 'posterId', select: 'fullName email' },
          { path: 'collegeId', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 });

    const formatted = apps.map((a) => ({
      _id: a._id,
      id: a._id,
      job: a.jobId,
      resumeUrl: a.resumeUrl,
      coverNote: a.coverNote,
      referralRequested: a.referralRequested,
      status: a.status,
      appliedAt: a.createdAt,
    }));

    res.json({ success: true, count: formatted.length, applications: formatted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get poster's jobs and referral applicant pipeline
jobsRouter.get('/poster/:posterId', async (req, res) => {
  try {
    const jobs = await Job.find({ posterId: req.params.posterId }).sort({ createdAt: -1 });

    const result = await Promise.all(
      jobs.map(async (job) => {
        const apps = await JobApplication.find({ jobId: job._id }).populate('applicantId', 'fullName email');
        const formattedApps = await Promise.all(
          apps.map(async (a) => {
            const prof = await Profile.findOne({ userId: a.applicantId?._id });
            return {
              id: a._id,
              _id: a._id,
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
              createdAt: a.createdAt,
            };
          })
        );
        return { job, applications: formattedApps };
      })
    );

    res.json({ success: true, postings: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update application status (e.g. UNDER_REVIEW, REFERRED, SHORTLISTED, REJECTED)
jobsRouter.put('/application/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const app = await JobApplication.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ message: 'Application not found' });

    await Notification.create({
      userId: app.applicantId,
      title: 'Referral Status Updated',
      message: `Your referral application status has been updated to: ${status.replace('_', ' ')}`,
      type: 'JOB',
    });

    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default jobsRouter;
