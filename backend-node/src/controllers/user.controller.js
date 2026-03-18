import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

import { User, Token, EmailVerification, TwoFactorTempToken, RefreshToken } from '../models/index.js';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
const REFRESH_COOKIE = 'refresh_token';
const VERIFICATION_TTL_MIN = parseInt(process.env.VERIFICATION_CODE_TTL_MIN || '10', 10);
const VERIFICATION_MAX_ATTEMPTS = parseInt(process.env.VERIFICATION_MAX_ATTEMPTS || '5', 10);
const RESEND_COOLDOWN_SEC = parseInt(process.env.VERIFICATION_RESEND_COOLDOWN_SEC || '60', 10);

function setRefreshCookie(res, token, rememberMe) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : undefined;
  res.cookie(REFRESH_COOKIE, token, {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

async function createRefreshToken(user, rememberMe, req) {
  await RefreshToken.deleteMany({ user: user._id, expiresAt: { $lt: new Date() } });
  const value = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));
  await RefreshToken.create({
    user: user._id,
    token: value,
    expiresAt,
    rememberMe,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.headers?.['user-agent']?.slice(0, 255),
  });
  return value;
}

async function getOrCreateToken(user) {
  let token = await Token.findOne({ user: user._id });
  if (!token) {
    const key = crypto.randomBytes(40).toString('hex');
    token = await Token.create({ user: user._id, key });
  }
  return token.key;
}

function userToResponse(user) {
  return {
    id: user._id.toString(),
    user_id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    profile_picture: user.profilePicture ? `/media/${user.profilePicture}` : null,
  };
}

async function sendVerificationEmail(email, code, subject, message) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_USE_SSL !== 'false',
    auth: process.env.EMAIL_HOST_USER ? {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    } : undefined,
  });
  try {
    await transporter.sendMail({
      from: process.env.DEFAULT_FROM_EMAIL || 'no-reply@example.com',
      to: email,
      subject,
      text: message,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
}

const signupSchema = z.object({ email: z.string().email(), name: z.string().min(1), password: z.string().min(1), role: z.string().optional() });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1), remember_me: z.boolean().optional() });
const emailRequestSchema = z.object({ email: z.string().email() });
const emailVerifySchema = z.object({ email: z.string().email(), code: z.string().regex(/^\d{6}$/) });
const accountDeleteSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const twoFactorVerifySchema = z.object({ code: z.string().regex(/^\d{6}$/) });
const twoFactorDisableSchema = z.object({ password: z.string().min(1) });
const twoFactorLoginSchema = z.object({ temp_token: z.string().min(1), code: z.string().regex(/^\d{6}$/), remember_me: z.boolean().optional() });
const changeEmailPasswordSchema = z.object({ password: z.string().min(1) });
const changeEmailRequestSchema = z.object({ new_email: z.string().email() });
const changeEmailVerifySchema = z.object({ new_email: z.string().email(), code: z.string().regex(/^\d{6}$/) });

export async function signup(req, res, next) {
  try {
    const { email, name, password, role } = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ email: ['User with this email already exists.'] });
    const user = await User.create({ email: email.toLowerCase(), name, password, role: role || null });
    const tokenKey = await getOrCreateToken(user);
    return res.status(201).json({ id: user._id.toString(), email: user.email, name: user.name, role: user.role, token: tokenKey });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, remember_me } = loginSchema.parse(req.body);
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (user.twoFactorEnabled && process.env.DISABLE_2FA !== 'true') {
      await TwoFactorTempToken.deleteMany({ user: user._id });
      const tempToken = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      await TwoFactorTempToken.create({ user: user._id, token: tempToken, expiresAt });
      return res.json({ requires_2fa: true, temp_token: tempToken, message: 'Please enter your 2FA code' });
    }
    const tokenKey = await getOrCreateToken(user);
    if (remember_me) {
      const refreshToken = await createRefreshToken(user, true, req);
      setRefreshCookie(res, refreshToken, true);
    }
    return res.json({ id: user._id.toString(), email: user.email, name: user.name, role: user.role, token: tokenKey });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await Token.deleteOne({ user: req.user._id });
    await RefreshToken.deleteMany({ user: req.user._id });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const value = req.cookies?.[REFRESH_COOKIE];
    if (!value) return res.status(401).json({ error: 'No refresh token found' });
    const rt = await RefreshToken.findOne({ token: value, expiresAt: { $gt: new Date() } }).populate('user');
    if (!rt) {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      return res.status(401).json({ error: 'Refresh token expired or invalid' });
    }
    const tokenKey = await getOrCreateToken(rt.user);
    return res.json({ token: tokenKey, id: rt.user._id.toString(), email: rt.user.email, name: rt.user.name, role: rt.user.role });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = userToResponse(req.user);
    if (req.user.profilePicture) data.profile_picture = `${baseUrl}/media/${req.user.profilePicture}`;
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { name, email, role, password } = req.body;
    const user = req.user;
    if (name) user.name = name;
    if (role !== undefined) user.role = role;
    if (email) {
      const lower = email.toLowerCase();
      const taken = await User.findOne({ email: lower, _id: { $ne: user._id } });
      if (taken) return res.status(400).json({ error: 'Email already in use by another account' });
      user.email = lower;
    }
    if (password && password.length > 0) user.password = password;
    if (req.file) user.profilePicture = req.file.path || req.file.filename;
    await user.save();
    return res.json(userToResponse(user));
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const email = req.query.email;
    const filter = email ? { email: email.toLowerCase() } : {};
    const users = await User.find(filter).select('-password');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const data = users.map((u) => {
      const d = { user_id: u._id.toString(), name: u.name, email: u.email, role: u.role };
      d.profile_picture = u.profilePicture ? `${baseUrl}/media/${u.profilePicture}` : null;
      return d;
    });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'No account found with this email address' });
    user.password = password;
    await user.save();
    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { email, password } = accountDeleteSchema.parse(req.body);
    if (email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'Email does not match your account' });
    }
    if (!(await req.user.comparePassword(password))) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }
    await Token.deleteOne({ user: req.user._id });
    await RefreshToken.deleteMany({ user: req.user._id });
    try {
      await User.deleteOne({ _id: req.user._id });
    } catch (e) {
      req.user.isActive = false;
      req.user.email = `deleted_${req.user._id}@example.invalid`;
      req.user.name = 'Deleted User';
      await req.user.save();
      return res.json({ deleted: true, soft_deleted: true, user_id: req.user._id.toString(), message: 'Account deleted successfully' });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ deleted: true, soft_deleted: false, user_id: req.user._id.toString(), message: 'Account deleted successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function emailRequest(req, res, next) {
  try {
    const { email } = emailRequestSchema.parse(req.body);
    const lower = email.toLowerCase();
    const now = new Date();
    const last = await EmailVerification.findOne({ email: lower, status: 'PENDING' }).sort({ createdAt: -1 });
    if (last && (now - last.createdAt) / 1000 < RESEND_COOLDOWN_SEC) return res.status(204).send();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TTL_MIN);
    await EmailVerification.create({ email: lower, codeHash, expiresAt, status: 'PENDING', ip: req.ip });
    await sendVerificationEmail(lower, code, 'Verify your email for My Crew Manager', `Your verification code is ${code}. It expires in ${VERIFICATION_TTL_MIN} minutes.`);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function emailVerify(req, res, next) {
  try {
    const { email, code } = emailVerifySchema.parse(req.body);
    const lower = email.toLowerCase();
    const rec = await EmailVerification.findOne({ email: lower, status: 'PENDING' }).sort({ createdAt: -1 });
    if (!rec) return res.status(400).json({ detail: 'invalid or expired' });
    if (rec.expiresAt <= new Date()) {
      rec.status = 'EXPIRED';
      await rec.save();
      return res.status(400).json({ detail: 'invalid or expired' });
    }
    if (rec.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      rec.status = 'LOCKED';
      await rec.save();
      return res.status(429).json({ detail: 'too many attempts' });
    }
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== rec.codeHash) {
      rec.attempts += 1;
      await rec.save();
      return res.status(400).json({ detail: 'invalid or expired' });
    }
    rec.status = 'VERIFIED';
    await rec.save();
    const user = await User.findOne({ email: lower });
    if (user && !user.emailVerifiedAt) {
      user.emailVerifiedAt = new Date();
      await user.save();
    }
    return res.json({ verified: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function changeEmailPasswordVerify(req, res, next) {
  try {
    const { password } = changeEmailPasswordSchema.parse(req.body);
    if (!(await req.user.comparePassword(password))) return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    return res.json({ verified: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function changeEmailRequest(req, res, next) {
  try {
    const { new_email } = changeEmailRequestSchema.parse(req.body);
    const lower = new_email.toLowerCase();
    if (lower === req.user.email.toLowerCase()) return res.status(400).json({ error: 'New email must be different from your current email' });
    const taken = await User.findOne({ email: lower, _id: { $ne: req.user._id } });
    if (taken) return res.status(400).json({ error: 'This email address is already registered to another account' });
    const last = await EmailVerification.findOne({ email: lower, status: 'PENDING' }).sort({ createdAt: -1 });
    const now = new Date();
    if (last && (now - last.createdAt) / 1000 < RESEND_COOLDOWN_SEC) {
      return res.status(429).json({ error: `Please wait ${RESEND_COOLDOWN_SEC} seconds before requesting a new code` });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TTL_MIN);
    await EmailVerification.create({ email: lower, codeHash, expiresAt, status: 'PENDING', ip: req.ip });
    await sendVerificationEmail(lower, code, 'Verify your new email for My Crew Manager', `Your verification code is ${code}. It expires in ${VERIFICATION_TTL_MIN} minutes.`);
    return res.json({ message: 'Verification code sent to your new email address' });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function changeEmailVerify(req, res, next) {
  try {
    const { new_email, code } = changeEmailVerifySchema.parse(req.body);
    const lower = new_email.toLowerCase();
    const rec = await EmailVerification.findOne({ email: lower, status: 'PENDING' }).sort({ createdAt: -1 });
    if (!rec) return res.status(400).json({ error: 'No verification code found for this email. Please request a new code.' });
    if (rec.expiresAt <= new Date()) {
      rec.status = 'EXPIRED';
      await rec.save();
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }
    if (rec.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      rec.status = 'LOCKED';
      await rec.save();
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== rec.codeHash) {
      rec.attempts += 1;
      await rec.save();
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }
    const taken = await User.findOne({ email: lower, _id: { $ne: req.user._id } });
    if (taken) return res.status(400).json({ error: 'This email address is already registered to another account' });
    rec.status = 'VERIFIED';
    await rec.save();
    req.user.email = lower;
    req.user.emailVerifiedAt = new Date();
    await req.user.save();
    return res.json({ message: 'Email address updated successfully', new_email: lower });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function get2FAStatus(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return res.status(503).json({ error: '2FA is disabled' });
    }
    const user = req.user;
    const data = { enabled: user.twoFactorEnabled || false };
    if (!data.enabled) {
      const secret = speakeasy.generateSecret({ name: `MyCrewManager:${user.email}` });
      const otpauth = speakeasy.otpauthURL({ secret: secret.base32, label: user.email, issuer: 'MyCrewManager' });
      const qr = await QRCode.toDataURL(otpauth);
      data.qr_code = qr;
      data.secret = secret.base32;
      data.provisioning_uri = otpauth;
    }
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function enable2FA(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return res.status(503).json({ error: '2FA is disabled' });
    }
    const user = req.user;
    if (user.twoFactorEnabled) return res.status(400).json({ error: '2FA is already enabled' });
    const secret = speakeasy.generateSecret({ name: `MyCrewManager:${user.email}` });
    const otpauth = speakeasy.otpauthURL({ secret: secret.base32, label: user.email, issuer: 'MyCrewManager' });
    const qr = await QRCode.toDataURL(otpauth);
    user.twoFactorSecret = secret.base32;
    await user.save();
    return res.json({ qr_code: qr, secret: secret.base32, provisioning_uri: otpauth, message: 'Scan the QR code with your authenticator app and verify with a code' });
  } catch (err) {
    next(err);
  }
}

export async function verify2FASetup(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return res.status(503).json({ error: '2FA is disabled' });
    }
    const { code } = twoFactorVerifySchema.parse(req.body);
    const user = req.user;
    if (!user.twoFactorSecret) return res.status(400).json({ error: 'No 2FA setup in progress. Please enable 2FA first.' });
    const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code, window: 1 });
    if (!valid) return res.status(400).json({ error: 'Invalid verification code' });
    user.twoFactorEnabled = true;
    await user.save();
    return res.json({ message: '2FA has been enabled successfully', enabled: true });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function disable2FA(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return res.status(503).json({ error: '2FA is disabled' });
    }
    const { password } = twoFactorDisableSchema.parse(req.body);
    const user = req.user;
    if (!user.twoFactorEnabled) return res.status(400).json({ error: '2FA is not enabled' });
    if (!(await user.comparePassword(password))) return res.status(401).json({ error: 'Incorrect password' });
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();
    return res.json({ message: '2FA has been disabled successfully', enabled: false });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}

export async function verify2FALogin(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return res.status(503).json({ error: '2FA is disabled' });
    }
    const { temp_token, code, remember_me } = twoFactorLoginSchema.parse(req.body);
    const now = new Date();
    const temp = await TwoFactorTempToken.findOne({ token: temp_token, expiresAt: { $gt: now } }).populate('user');
    if (!temp) return res.status(400).json({ error: 'Invalid or expired temporary token' });
    const user = temp.user;
    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      await TwoFactorTempToken.deleteOne({ _id: temp._id });
      return res.status(400).json({ error: '2FA is not enabled for this account' });
    }
    const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: 'base32', token: code, window: 1 });
    if (!valid) return res.status(400).json({ error: 'Invalid verification code' });
    await TwoFactorTempToken.deleteOne({ _id: temp._id });
    const tokenKey = await getOrCreateToken(user);
    if (remember_me) {
      const refreshToken = await createRefreshToken(user, true, req);
      setRefreshCookie(res, refreshToken, true);
    }
    return res.json({ id: user._id.toString(), email: user.email, name: user.name, role: user.role, token: tokenKey });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json(err.flatten().fieldErrors);
    next(err);
  }
}
