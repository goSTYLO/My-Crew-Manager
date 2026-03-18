import mongoose from 'mongoose';

const timelineWeekSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    week_number: { type: Number, required: true },
  },
  { timestamps: true, collection: 'timeline_weeks' }
);

timelineWeekSchema.index({ project: 1 });

export const TimelineWeek = mongoose.model('TimelineWeek', timelineWeekSchema);
