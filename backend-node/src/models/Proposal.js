import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    file: { type: String, default: null },
    parsedText: { type: String, default: null },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'proposals' }
);

proposalSchema.index({ project: 1 });

export const Proposal = mongoose.model('Proposal', proposalSchema);
