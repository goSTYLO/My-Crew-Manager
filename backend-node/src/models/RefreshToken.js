import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    rememberMe: { type: Boolean, default: false },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true, collection: 'refresh_tokens' }
);
refreshTokenSchema.index({ user: 1, expiresAt: 1 });
refreshTokenSchema.index({ expiresAt: 1 });

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);
