import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    key: { type: String, required: true, unique: true },
  },
  { timestamps: true, collection: 'tokens' }
);

export const Token = mongoose.model('Token', tokenSchema);
