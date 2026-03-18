import mongoose from 'mongoose';

const projectRoleSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    role: { type: String, required: true },
    ai: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'project_roles' }
);

projectRoleSchema.index({ project: 1 });

export const ProjectRole = mongoose.model('ProjectRole', projectRoleSchema);
