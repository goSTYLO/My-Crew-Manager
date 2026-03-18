import mongoose from 'mongoose';

const projectFeatureSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    ai: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'project_features' }
);

projectFeatureSchema.index({ project: 1 });

export const ProjectFeature = mongoose.model('ProjectFeature', projectFeatureSchema);
