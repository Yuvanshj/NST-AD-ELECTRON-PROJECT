import express from 'express';
import { Story } from '../models/Story.js';
import { Profile } from '../models/Profile.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { optionalAuthenticate } from '../middleware/auth.js';

export const storiesRouter = express.Router();

/**
 * GET /api/stories
 */
storiesRouter.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { approvedOnly, collegeId } = req.query;
    const filter = {};
    if (approvedOnly === 'true') filter.status = 'APPROVED';
    if (collegeId) filter.collegeId = collegeId;

    const stories = await Story.find(filter)
      .populate('userId', 'fullName email')
      .populate('collegeId', 'name code city')
      .sort({ isFeatured: -1, createdAt: -1 });

    const formatted = await Promise.all(
      stories.map(async (s) => {
        const prof = await Profile.findOne({ userId: s.userId?._id });
        return {
          id: s._id,
          _id: s._id,
          userId: s.userId?._id,
          authorName: s.userId?.fullName,
          authorBatch: prof?.batch,
          authorBranch: prof?.branch,
          authorCompany: prof?.currentCompany,
          collegeName: s.collegeId?.name,
          title: s.title,
          summary: s.summary,
          content: s.content,
          milestone: s.milestone,
          imageUrl: s.imageUrl,
          isFeatured: s.isFeatured,
          isAlumniOfTheYear: s.isAlumniOfTheYear,
          status: s.status,
          createdAt: s.createdAt,
        };
      })
    );

    res.json({ success: true, count: formatted.length, stories: formatted, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/stories
 */
storiesRouter.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.body.userId;
    const { title, summary, content, milestone, imageUrl, collegeId } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and story content are required' });
    }

    const story = await Story.create({
      userId,
      collegeId: collegeId || req.user?.collegeId || null,
      title,
      summary: summary || content.substring(0, 150) + '...',
      content,
      milestone: milestone || 'Professional Milestone',
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop',
      status: 'PENDING',
    });

    res.status(201).json({ success: true, story });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/stories/:id/moderate and POST /api/stories/:id/approve
 */
const moderateStory = async (req, res) => {
  try {
    const { action, isApproved, adminId, isFeatured, isAlumniOfTheYear } = req.body;
    const isApprove = action === 'APPROVE' || isApproved === true;
    const status = isApprove ? 'APPROVED' : 'REJECTED';
    const reviewerId = req.user?._id || adminId;

    const story = await Story.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: isApprove ? reviewerId : null,
        isFeatured: isFeatured !== undefined ? isFeatured : true,
        isAlumniOfTheYear: isAlumniOfTheYear !== undefined ? isAlumniOfTheYear : false,
      },
      { new: true }
    );

    if (!story) return res.status(404).json({ success: false, message: 'Story not found' });

    if (story.userId) {
      await Notification.create({
        userId: story.userId,
        title: `Story ${status}`,
        message: `Your success story "${story.title}" has been ${status.toLowerCase()} by the editorial cell.`,
        type: 'SYSTEM',
      });
    }

    res.json({ success: true, story });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

storiesRouter.put('/:id/moderate', optionalAuthenticate, moderateStory);
storiesRouter.post('/:id/approve', optionalAuthenticate, moderateStory);

export default storiesRouter;
