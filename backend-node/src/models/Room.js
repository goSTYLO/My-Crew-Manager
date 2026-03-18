import mongoose from 'mongoose';

const roomMembershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isAdmin: { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: Number, unique: true, sparse: true }, // Legacy numeric ID for API compatibility
    name: { type: String, default: null },
    isPrivate: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    memberships: [roomMembershipSchema],
  },
  { timestamps: true, collection: 'rooms' }
);

roomSchema.index({ createdBy: 1 });

export const Room = mongoose.model('Room', roomSchema);
