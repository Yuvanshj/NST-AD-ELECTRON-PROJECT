import mongoose from 'mongoose';

const CollegeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, default: 'Gujarat' },
    establishedYear: { type: Number, required: true },
    website: { type: String },
    logoUrl: { type: String },
    has80GExemption: { type: Boolean, default: true },
    taxExemption80GNumber: { type: String, default: 'CIT(E)/AHM/80G/2021-22/A-412' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const College = mongoose.model('College', CollegeSchema);
