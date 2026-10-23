import express from 'express';
import { Survey, SurveyResponse } from '../models/Survey.js';

export const surveysRouter = express.Router();

// Get surveys
surveysRouter.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = { status: 'ACTIVE' };
    if (role && role !== 'SUPER_ADMIN' && role !== 'COLLEGE_ADMIN') {
      filter.$or = [{ targetRole: 'ALL' }, { targetRole: role }];
    }

    const surveys = await Survey.find(filter).sort({ createdAt: -1 });
    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Submit response
surveysRouter.post('/response', async (req, res) => {
  try {
    const { surveyId, userId, answers } = req.body;

    const response = await SurveyResponse.findOneAndUpdate(
      { surveyId, userId },
      { answers },
      { upsert: true, new: true }
    );

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Analytics
surveysRouter.get('/:id/analytics', async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey) return res.status(404).json({ message: 'Survey not found' });

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
      survey,
      totalResponses: responses.length,
      questionStats,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
