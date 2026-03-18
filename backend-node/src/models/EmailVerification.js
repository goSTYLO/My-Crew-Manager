import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    status: { type: String, default: 'PENDING' },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: true, collection: 'email_verifications' }
);

emailVerificationSchema.index({ email: 1, status: 1 });
emailVerificationSchema.index({ expiresAt: 1 });

export const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
