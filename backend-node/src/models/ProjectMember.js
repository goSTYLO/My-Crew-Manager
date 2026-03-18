import mongoose from 'mongoose';

const projectMemberSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, default: 'Unknown User' },
    userEmail: { type: String, default: 'unknown@example.com' },
    role: { type: String, default: 'Member' },
  },
  { timestamps: true, collection: 'project_members' }
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

export const ProjectMember = mongoose.model('ProjectMember', projectMemberSchema);
