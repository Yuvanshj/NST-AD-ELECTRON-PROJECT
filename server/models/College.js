import mongoose from 'mongoose';

const CollegeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: 'Gujarat' },
    establishedYear: { type: Number, required: true },
    website: { type: String },
    logoUrl: { type: String },
  },
  { timestamps: true }
);

export const College = mongoose.model('College', CollegeSchema);
