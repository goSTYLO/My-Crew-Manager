import mongoose from 'mongoose';

const projectFeatureSchema = new mongoose.Schema({
  title: { type: String, required: true },
}, { _id: true });

const projectRoleSchema = new mongoose.Schema({
  role: { type: String, required: true },
}, { _id: true });

const projectGoalSchema = new mongoose.Schema({
  title: { type: String, required: true },
  role: { type: String, default: null },
}, { _id: true });

const timelineItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
}, { _id: true });

const timelineWeekSchema = new mongoose.Schema({
  weekNumber: { type: Number, required: true },
  items: [timelineItemSchema],
}, { _id: true });

const repositorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  branch: { type: String, default: 'main' },
}, { _id: true, timestamps: true });

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    summary: { type: String, default: null },
    status: {
      type: String,
      enum: ['setting_up', 'in_progress', 'complete', 'on_hold'],
      default: 'in_progress',
    },
    statusUpdatedAt: { type: Date, default: null },
    statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    features: [projectFeatureSchema],
    roles: [projectRoleSchema],
    goals: [projectGoalSchema],
    timeline: [timelineWeekSchema],
    repositories: [repositorySchema],
  },
  { timestamps: true, collection: 'projects' }
);

projectSchema.index({ createdBy: 1 });
projectSchema.index({ status: 1 });

export const Project = mongoose.model('Project', projectSchema);
