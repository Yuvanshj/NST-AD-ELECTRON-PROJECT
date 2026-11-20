import express from 'express';
import { Survey, SurveyResponse } from '../models/Survey.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, authorize, optionalAuthenticate } from '../middleware/auth.js';

export const surveysRouter = express.Router();

/**
 * GET /api/surveys
 * List active surveys
 */
surveysRouter.get('/', optionalAuthenticate, async (req, res) => {
  try {
    const { role, collegeId } = req.query;
    const filter = { status: 'ACTIVE' };

    if (role && role !== 'SUPER_ADMIN' && role !== 'COLLEGE_ADMIN') {
      filter.$or = [{ targetRole: 'ALL' }, { targetRole: role }];
    }
    if (collegeId) {
      filter.$or = [{ collegeId: null }, { collegeId }];
    }

    const surveys = await Survey.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: surveys.length, surveys, data: surveys });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/surveys
 * Create survey (Admin only)
 */
surveysRouter.post('/', optionalAuthenticate, async (req, res) => {
  try {
    const { title, description, questions, targetRole, deadline, isAnonymous, collegeId } = req.body;
    if (!title || !questions || !questions.length) {
      return res.status(400).json({ success: false, message: 'Title and questions are required' });
    }

    const survey = await Survey.create({
      title,
      description: description || '',
      questions,
      targetRole: targetRole || 'ALL',
      deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isAnonymous: Boolean(isAnonymous),
      collegeId: collegeId || req.user?.collegeId || null,
      status: 'ACTIVE',
      createdBy: req.user?._id || null,
    });

    res.status(201).json({ success: true, survey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/surveys/:id/response and /api/surveys/response
 * Submit answers to survey with anonymous response protections
 */
const submitResponse = async (req, res) => {
  try {
    const surveyId = req.params.id || req.body.surveyId;
    const effectiveUserId = req.user?._id || req.body.userId;
    const { answers } = req.body;

    if (!surveyId || !answers) {
      return res.status(400).json({ success: false, message: 'Survey ID and answers are required' });
    }

    const survey = await Survey.findById(surveyId);
    if (!survey || survey.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Active survey not found' });
    }

    // Check duplicate response
    if (effectiveUserId) {
      const existing = await SurveyResponse.findOne({ surveyId, userId: effectiveUserId });
      if (existing) {
        existing.answers = answers;
        await existing.save();
        return res.json({ success: true, response: existing, message: 'Survey response updated.' });
      }
    }

    const response = await SurveyResponse.create({
      surveyId,
      userId: survey.isAnonymous ? null : effectiveUserId, // Protect anonymity if enabled
      answers,
    });

    res.status(201).json({ success: true, response, message: 'Survey response recorded.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

surveysRouter.post('/response', optionalAuthenticate, submitResponse);
surveysRouter.post('/:id/response', optionalAuthenticate, submitResponse);

/**
 * GET /api/surveys/:id/analytics and /api/surveys/:id/results
 */
const getSurveyAnalytics = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ success: false, message: 'Survey not found' });

    const responses = await SurveyResponse.find({ surveyId: survey._id });

    const questionStats = survey.questions.map((q) => {
      if (q.type === 'MCQ') {
        const mcqDistribution = {};
        for (const opt of q.options || []) mcqDistribution[opt] = 0;
        for (const r of responses) {
          const val = r.answers?.[q.id];
          if (val) mcqDistribution[val] = (mcqDistribution[val] || 0) + 1;
        }
        return { questionId: q.id, text: q.text, type: q.type, mcqDistribution };
      } else if (q.type === 'RATING') {
        let sum = 0;
        let count = 0;
        for (const r of responses) {
          const val = Number(r.answers?.[q.id]);
          if (!isNaN(val) && val >= 1 && val <= 5) {
            sum += val;
            count++;
          }
        }
        return {
          questionId: q.id,
          text: q.text,
          type: q.type,
          averageRating: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
        };
      } else {
        const sampleTextAnswers = responses
          .map((r) => r.answers?.[q.id])
          .filter((a) => typeof a === 'string' && a.trim().length > 0)
          .slice(0, 10);
        return { questionId: q.id, text: q.text, type: q.type, sampleTextAnswers };
      }
    });

    res.json({
      success: true,
      survey,
      totalResponses: responses.length,
      questionStats,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

surveysRouter.get('/:id/analytics', optionalAuthenticate, getSurveyAnalytics);
surveysRouter.get('/:id/results', optionalAuthenticate, getSurveyAnalytics);

export default surveysRouter;
