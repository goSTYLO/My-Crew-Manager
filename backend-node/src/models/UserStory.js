import mongoose from 'mongoose';

const userStorySchema = new mongoose.Schema(
  {
    subEpic: { type: mongoose.Schema.Types.ObjectId, ref: 'SubEpic', required: true },
    title: { type: String, required: true },
    ai: { type: Boolean, default: true },
    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'user_stories' }
);

userStorySchema.index({ subEpic: 1 });

export const UserStory = mongoose.model('UserStory', userStorySchema);
