import mongoose from 'mongoose';

const projectInvitationSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
    },
    role: { type: String, default: 'Member' },
    message: { type: String, default: '' },
  },
  { timestamps: true, collection: 'project_invitations' }
);

projectInvitationSchema.index({ project: 1, status: 1 });
projectInvitationSchema.index({ invitee: 1, status: 1 });
projectInvitationSchema.index({ project: 1, invitee: 1 }, { unique: true });

export const ProjectInvitation = mongoose.model('ProjectInvitation', projectInvitationSchema);
