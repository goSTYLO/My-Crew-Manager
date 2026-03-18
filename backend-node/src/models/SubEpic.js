import mongoose from 'mongoose';

const subEpicSchema = new mongoose.Schema(
  {
    epic: { type: mongoose.Schema.Types.ObjectId, ref: 'Epic', required: true },
    title: { type: String, required: true },
    ai: { type: Boolean, default: true },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'sub_epics' }
);

subEpicSchema.index({ epic: 1 });

export const SubEpic = mongoose.model('SubEpic', subEpicSchema);
