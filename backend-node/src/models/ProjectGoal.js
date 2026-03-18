import mongoose from 'mongoose';

const projectGoalSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    role: { type: String, default: null },
    ai: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'project_goals' }
);

projectGoalSchema.index({ project: 1 });

export const ProjectGoal = mongoose.model('ProjectGoal', projectGoalSchema);
