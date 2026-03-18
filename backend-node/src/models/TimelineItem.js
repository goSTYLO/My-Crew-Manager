import mongoose from 'mongoose';

const timelineItemSchema = new mongoose.Schema(
  {
    week: { type: mongoose.Schema.Types.ObjectId, ref: 'TimelineWeek', required: true },
    title: { type: String, required: true },
  },
  { timestamps: true, collection: 'timeline_items' }
);

timelineItemSchema.index({ week: 1 });

export const TimelineItem = mongoose.model('TimelineItem', timelineItemSchema);
