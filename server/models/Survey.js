import mongoose from 'mongoose';

const SurveyQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  type: {
    type: String,
    enum: ['MCQ', 'RATING', 'TEXT'],
    required: true,
  },
  options: [{ type: String }],
});

const SurveySchema = new mongoose.Schema(
  {
    collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    targetRole: {
      type: String,
      enum: ['ALL', 'ALUMNI', 'STUDENT'],
      default: 'ALL',
    },
    questions: [SurveyQuestionSchema],
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED'],
      default: 'ACTIVE',
    },
    deadline: { type: String },
  },
  { timestamps: true }
);

export const Survey = mongoose.model('Survey', SurveySchema);

const SurveyResponseSchema = new mongoose.Schema(
  {
    surveyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    answers: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const SurveyResponse = mongoose.model('SurveyResponse', SurveyResponseSchema);
