import mongoose from 'mongoose';

const epicSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    ai: { type: Boolean, default: true },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'epics' }
);

epicSchema.index({ project: 1 });

export const Epic = mongoose.model('Epic', epicSchema);
