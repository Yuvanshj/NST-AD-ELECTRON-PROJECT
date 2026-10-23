import express from 'express';
import { Story } from '../models/Story.js';
import { Profile } from '../models/Profile.js';
import { Notification } from '../models/Notification.js';

export const storiesRouter = express.Router();

// Get stories
storiesRouter.get('/', async (req, res) => {
  try {
    const { approvedOnly } = req.query;
    const filter = {};
    if (approvedOnly === 'true') filter.status = 'APPROVED';

    const stories = await Story.find(filter)
      .populate('userId', 'fullName')
      .populate('collegeId', 'name')
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      stories.map(async (s) => {
        const prof = await Profile.findOne({ userId: s.userId?._id });
        return {
          id: s._id,
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

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit story
storiesRouter.post('/', async (req, res) => {
  try {
    const story = await Story.create({ ...req.body, status: 'PENDING' });
    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Moderate story
storiesRouter.put('/:id/moderate', async (req, res) => {
  try {
    const { action, adminId, isFeatured, isAlumniOfTheYear } = req.body;
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const story = await Story.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: action === 'APPROVE' ? adminId : null,
        isFeatured: isFeatured !== undefined ? isFeatured : true,
        isAlumniOfTheYear: isAlumniOfTheYear !== undefined ? isAlumniOfTheYear : false,
      },
      { new: true }
    );

    await Notification.create({
      userId: story.userId,
      title: `Story ${status}`,
      message: `Your success story submission has been ${status.toLowerCase()}.`,
      type: 'SYSTEM',
    });

    res.json(story);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
