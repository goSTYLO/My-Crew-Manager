import mongoose from 'mongoose';

const storyTaskSchema = new mongoose.Schema(
  {
    userStory: { type: mongoose.Schema.Types.ObjectId, ref: 'UserStory', required: true },
    title: { type: String, required: true },
    status: { type: String, default: 'pending' },
    ai: { type: Boolean, default: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectMember', default: null },
    commitTitle: { type: String, default: null },
    commitBranch: { type: String, default: null },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true, collection: 'story_tasks' }
);

storyTaskSchema.index({ userStory: 1 });

storyTaskSchema.post('save', async function () {
  if (this.status === 'done') {
    const UserStory = mongoose.model('UserStory');
    const SubEpic = mongoose.model('SubEpic');
    const Epic = mongoose.model('Epic');

    const story = await UserStory.findById(this.userStory);
    if (!story) return;

    const tasks = await mongoose.model('StoryTask').find({ userStory: story._id });
    const allDone = tasks.every((t) => t.status === 'done');
    if (allDone && !story.isComplete) {
      story.isComplete = true;
      await story.save();
    } else if (!allDone && story.isComplete) {
      story.isComplete = false;
      await story.save();
    }

    const subEpic = await SubEpic.findById(story.subEpic);
    if (subEpic) {
      const stories = await UserStory.find({ subEpic: subEpic._id });
      const allStoriesComplete = stories.every((s) => s.isComplete);
      if (allStoriesComplete && !subEpic.isComplete) {
        subEpic.isComplete = true;
        await subEpic.save();
      } else if (!allStoriesComplete && subEpic.isComplete) {
        subEpic.isComplete = false;
        await subEpic.save();
      }

      const epic = await Epic.findById(subEpic.epic);
      if (epic) {
        const subEpics = await SubEpic.find({ epic: epic._id });
        const allSubEpicsComplete = subEpics.every((s) => s.isComplete);
        if (allSubEpicsComplete && !epic.isComplete) {
          epic.isComplete = true;
          await epic.save();
        } else if (!allSubEpicsComplete && epic.isComplete) {
          epic.isComplete = false;
          await epic.save();
        }
      }
    }
  }
});

export const StoryTask = mongoose.model('StoryTask', storyTaskSchema);
