import mongoose from 'mongoose';

const twoFactorTempTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'two_factor_temp_tokens' }
);
twoFactorTempTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TwoFactorTempToken = mongoose.model('TwoFactorTempToken', twoFactorTempTokenSchema);
