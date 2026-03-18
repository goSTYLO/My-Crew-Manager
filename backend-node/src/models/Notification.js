import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'project_invitation', 'task_assigned', 'task_updated', 'task_completed',
  'mention', 'deadline_reminder', 'project_update', 'project_status_changed',
  'member_joined', 'member_left', 'task_due_date_set',
];

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notificationType: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    contentObject: { type: mongoose.Schema.Types.Mixed, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    actionUrl: { type: String, default: null },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true, collection: 'notifications' }
);

notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // TTL 90 days

export const Notification = mongoose.model('Notification', notificationSchema);
