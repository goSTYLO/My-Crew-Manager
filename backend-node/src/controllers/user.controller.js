import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import { body } from 'express-validator'
import path from 'path';

import { prisma } from '../lib/prisma.js';
import { z } from 'zod';
import { logger } from '../config/logger.js';
import { UnauthorizedError } from '../middleware/errors.js';

import { EmailService } from '../services/email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
const REFRESH_COOKIE = 'refresh_token';
const VERIFICATION_TTL_MIN = parseInt(process.env.VERIFICATION_CODE_TTL_MIN || '10', 10);
const VERIFICATION_MAX_ATTEMPTS = parseInt(process.env.VERIFICATION_MAX_ATTEMPTS || '5', 10);
const RESEND_COOLDOWN_SEC = parseInt(process.env.VERIFICATION_RESEND_COOLDOWN_SEC || '60', 10);

function buildErrorPayload(message, extra = {}) {
  return {
    error: message,
    detail: message,
    message,
    ...extra,
  };
}

function sendError(res, statusCode, message, extra = {}) {
  return res.status(statusCode).json(buildErrorPayload(message, extra));
}

function sendValidationError(res, err) {
  return sendError(res, 400, 'Validation error', { fields: err.flatten().fieldErrors });
}

function authLogMeta(req, extra = {}) {
  return {
    request_id: req.requestId || req.headers['x-request-id'] || null,
    ip: req.ip,
    path: req.originalUrl,
    ...extra,
  };
}

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

async function createRefreshToken(userId, rememberMe, req) {
  await prisma.users_refreshtoken.deleteMany({
    where: { user_id: userId, expires_at: { lt: new Date() } },
  });
  const value = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 1));
  await prisma.users_refreshtoken.create({
    data: {
      user_id: userId,
      token: value,
      created_at: new Date(),
      expires_at: expiresAt,
      remember_me: rememberMe,
      ip_address: req?.ip || req?.connection?.remoteAddress,
      user_agent: req?.headers?.['user-agent']?.slice(0, 255),
    },
  });
  return value;
}

async function getOrCreateToken(userId) {
  const existing = await prisma.authtoken_token.findUnique({
    where: { user_id: BigInt(userId) },
  });
  if (existing) return existing.key;
  const key = crypto.randomBytes(20).toString('hex');
  await prisma.authtoken_token.create({
    data: {
      key,
      created: new Date(),
      user_id: BigInt(userId),
    },
  });
  return key;
}

function userToResponse(user) {
  if (!user) return null;
  const uid = user.user_id ?? user._id;
  const normalizedProfilePicture = normalizeProfilePicturePath(user.profile_picture);
  return {
    id: String(uid),
    user_id: String(uid),
    name: user.name,
    email: user.email,
    role: user.role,
    profile_picture: normalizedProfilePicture ? `/media/${normalizedProfilePicture}` : null,
  };
}

function normalizeProfilePicturePath(value) {
  if (!value || typeof value !== 'string') return null;

  const clean = value.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!clean) return null;

  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }

  const withoutMediaPrefix = clean.replace(/^media\//i, '');
  const withoutUploadsPrefix = withoutMediaPrefix.replace(/^uploads\//i, '');
  return withoutUploadsPrefix;
}

function buildProfilePictureUrl(req, rawPath) {
  const normalized = normalizeProfilePicturePath(rawPath);
  if (!normalized) return null;
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized;
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/media/${normalized}`;
}

async function syncProjectMemberIdentity(userId, userName, userEmail) {
  const data = {};
  if (typeof userName === 'string') data.user_name = userName;
  if (typeof userEmail === 'string') data.user_email = userEmail;
  if (Object.keys(data).length === 0) return;

  await prisma.ai_api_projectmember.updateMany({
    where: { user_id: BigInt(userId) },
    data,
  });
}

async function sendVerificationEmail(email, code, subject, message) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: process.env.EMAIL_SECURE !== 'false',
    auth: process.env.EMAIL_USER ? {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    } : undefined,
  });
  logger.debug("Sending verification Email");
  try {
    await transporter.sendMail({
      from: process.env.DEFAULT_FROM_EMAIL || 'no-reply@example.com',
      to: email,
      subject,
      text: message,
    });
    logger.info(`OTP email sent successfully to ${email}`);
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
    const lower = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: lower } });
    if (existing) {
      logger.warn('Signup failed - duplicate email', authLogMeta(req, { email: lower }));
      return sendError(res, 400, 'User with this email already exists.', { email: ['User with this email already exists.'] });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: lower,
        name,
        password: hashed,
        role: role || null,
        is_active: true,
        is_staff: false,
        is_superuser: false,
        two_factor_enabled: false,
        created_at: new Date(),
      },
    });
    const tokenKey = await getOrCreateToken(user.user_id);
    logger.info('Signup succeeded', authLogMeta(req, {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    }));
    return res.status(201).json({ id: String(user.user_id), email: user.email, name: user.name, role: user.role, token: tokenKey });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password, remember_me } = loginSchema.parse(req.body);
    const emailLower = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (!user || !user.is_active || !(await bcrypt.compare(password, user.password))) {
      logger.warn('Login failed - invalid credentials', authLogMeta(req, {
        email: emailLower,
        reason: !user ? 'user_not_found' : !user.is_active ? 'inactive_user' : 'password_mismatch',
      }));
      return next(new UnauthorizedError('Invalid email or password'));
    }
    if (user.two_factor_enabled && process.env.DISABLE_2FA !== 'true') {
      await prisma.users_twofactortemptoken.deleteMany({ where: { user_id: user.user_id } });
      const tempToken = crypto.randomBytes(32).toString('base64url');
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);
      await prisma.users_twofactortemptoken.create({
        data: { user_id: user.user_id, token: tempToken, expires_at: expiresAt },
      });
      logger.info('Login requires 2FA', authLogMeta(req, {
        user_id: user.user_id,
        email: user.email,
      }));
      return res.json({ requires_2fa: true, temp_token: tempToken, message: 'Please enter your 2FA code' });
    }
    const tokenKey = await getOrCreateToken(user.user_id);
    if (remember_me) {
      const refreshToken = await createRefreshToken(user.user_id, true, req);
      setRefreshCookie(res, refreshToken, true);
    }
    logger.info('Login succeeded', authLogMeta(req, {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      remember_me: !!remember_me,
    }));
    return res.json({
      id: String(user.user_id),
      email: user.email,
      name: user.name,
      role: user.role,
      token: tokenKey,
      access: tokenKey,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    const userId = req.user.user_id ?? req.user._id;
    await prisma.authtoken_token.deleteMany({ where: { user_id: BigInt(userId) } });
    await prisma.users_refreshtoken.deleteMany({ where: { user_id: userId } });
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const value = req.cookies?.[REFRESH_COOKIE];
    if (!value) {
      logger.warn('Refresh token failed - missing cookie', authLogMeta(req));
      return next(new UnauthorizedError('No refresh token found'));
    }
    const rt = await prisma.users_refreshtoken.findFirst({
      where: { token: value, expires_at: { gt: new Date() } },
      include: { user: true },
    });
    if (!rt) {
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      logger.warn('Refresh token failed - expired or invalid', authLogMeta(req));
      return next(new UnauthorizedError('Refresh token expired or invalid'));
    }
    const tokenKey = await getOrCreateToken(rt.user_id);
    logger.info('Refresh token succeeded', authLogMeta(req, {
      user_id: rt.user.user_id,
      email: rt.user.email,
    }));
    return res.json({
      token: tokenKey,
      access: tokenKey,
      id: String(rt.user.user_id),
      email: rt.user.email,
      name: rt.user.name,
      role: rt.user.role,
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const data = userToResponse(req.user);
    data.profile_picture = buildProfilePictureUrl(req, req.user.profilePicture || req.user.profile_picture);
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { name, email, role, password } = req.body;
    const userId = req.user.user_id ?? req.user._id;
    const update = {};
    if (name) update.name = name;
    if (role !== undefined) update.role = role;
    if (email) {
      const lower = email.toLowerCase();
      const taken = await prisma.user.findFirst({ where: { email: lower, NOT: { user_id: userId } } });
      if (taken) return sendError(res, 400, 'Email already in use by another account');
      update.email = lower;
    }
    if (password && password.length > 0) {
      update.password = await bcrypt.hash(password, 10);
    }
    if (req.file) {
      update.profile_picture = normalizeProfilePicturePath(req.file.filename || req.file.path || path.basename(req.file.originalname || ''));
    }
    const user = await prisma.user.update({
      where: { user_id: userId },
      data: update,
    });

    if (update.name !== undefined || update.email !== undefined) {
      await syncProjectMemberIdentity(userId, user.name, user.email);
    }
    const response = userToResponse(user);
    response.profile_picture = buildProfilePictureUrl(req, user.profile_picture);
    return res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const email = req.query.email;
    const where = email ? { email: email.toLowerCase() } : {};
    const users = await prisma.user.findMany({
      where,
      select: { user_id: true, name: true, email: true, role: true, profile_picture: true },
    });
    const data = users.map((u) => {
      const d = { user_id: String(u.user_id), name: u.name, email: u.email, role: u.role };
      d.profile_picture = buildProfilePictureUrl(req, u.profile_picture);
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
    if (!email || !password) return sendError(res, 400, 'Email and password are required');
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return sendError(res, 404, 'No account found with this email address');
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { user_id: user.user_id }, data: { password: hashed } });
    return res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req, res, next) {
  try {
    const { email, password } = accountDeleteSchema.parse(req.body);
    const userId = req.user.user_id ?? req.user._id;
    if (email.toLowerCase() !== req.user.email.toLowerCase()) {
      return sendError(res, 400, 'Email does not match your account');
    }
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, 401, 'Incorrect password. Please try again.');
    }
    await prisma.authtoken_token.deleteMany({ where: { user_id: BigInt(userId) } });
    await prisma.users_refreshtoken.deleteMany({ where: { user_id: userId } });
    try {
      await prisma.user.delete({ where: { user_id: userId } });
    } catch (e) {
      await prisma.user.update({
        where: { user_id: userId },
        data: { is_active: false, email: `deleted_${userId}@example.invalid`, name: 'Deleted User' },
      });
      res.clearCookie(REFRESH_COOKIE, { path: '/' });
      return res.json({ deleted: true, soft_deleted: true, user_id: String(userId), message: 'Account deleted successfully' });
    }
    res.clearCookie(REFRESH_COOKIE, { path: '/' });
    return res.json({ deleted: true, soft_deleted: false, user_id: String(userId), message: 'Account deleted successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function emailRequest(req, res, next) {
  try {
    const { email } = emailRequestSchema.parse(req.body);
    const lower = email.toLowerCase();
    const now = new Date();
    const last = await prisma.users_emailverification.findFirst({
      where: { email: lower, status: 'PENDING' },
      orderBy: { created_at: 'desc' },
    });
    if (last && (now - last.created_at) / 1000 < RESEND_COOLDOWN_SEC) return res.status(204).send();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TTL_MIN);
    await prisma.users_emailverification.create({
      data: {
        email: lower,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        status: 'PENDING',
        last_sent_at: now,
        ip: req.ip || null,
        created_at: now,
        updated_at: now,
      },
    });
    await sendVerificationEmail(lower, code, 'Verify your email for MyCrewManager', `Your verification code is ${code}. It expires in ${VERIFICATION_TTL_MIN} minutes.`);
    return res.status(204).send();
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function emailVerify(req, res, next) {
  try {
    const { email, code } = emailVerifySchema.parse(req.body);
    const lower = email.toLowerCase();
    const rec = await prisma.users_emailverification.findFirst({
      where: { email: lower, status: 'PENDING' },
      orderBy: { created_at: 'desc' },
    });
    if (!rec) return sendError(res, 400, 'invalid or expired');
    if (rec.expires_at <= new Date()) {
      await prisma.users_emailverification.update({ where: { id: rec.id }, data: { status: 'EXPIRED' } });
      return sendError(res, 400, 'invalid or expired');
    }
    if (rec.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      await prisma.users_emailverification.update({ where: { id: rec.id }, data: { status: 'LOCKED' } });
      return sendError(res, 429, 'too many attempts');
    }
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== rec.code_hash) {
      await prisma.users_emailverification.update({ where: { id: rec.id }, data: { attempts: rec.attempts + 1 } });
      return sendError(res, 400, 'invalid or expired');
    }
    await prisma.users_emailverification.update({ where: { id: rec.id }, data: { status: 'VERIFIED' } });
    const user = await prisma.user.findUnique({ where: { email: lower } });
    if (user && !user.email_verified_at) {
      await prisma.user.update({ where: { user_id: user.user_id }, data: { email_verified_at: new Date() } });
    }
    
    logger.info("Email verified successfully");
    return res.json({ verified: true });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function changeEmailPasswordVerify(req, res, next) {
  try {
    const { password } = changeEmailPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { user_id: req.user.user_id ?? req.user._id } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, 401, 'Incorrect password. Please try again.');
    }
    return res.json({ verified: true });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function changeEmailRequest(req, res, next) {
  try {
    const { new_email } = changeEmailRequestSchema.parse(req.body);
    const lower = new_email.toLowerCase();
    const userId = req.user.user_id ?? req.user._id;
    if (lower === req.user.email.toLowerCase()) return sendError(res, 400, 'New email must be different from your current email');
    const taken = await prisma.user.findFirst({ where: { email: lower, NOT: { user_id: userId } } });
    if (taken) return sendError(res, 400, 'This email address is already registered to another account');
    const last = await prisma.users_emailverification.findFirst({
      where: { email: lower, status: 'PENDING' },
      orderBy: { created_at: 'desc' },
    });
    const now = new Date();
    if (last && (now - last.created_at) / 1000 < RESEND_COOLDOWN_SEC) {
      return sendError(res, 429, `Please wait ${RESEND_COOLDOWN_SEC} seconds before requesting a new code`);
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + VERIFICATION_TTL_MIN);
    await prisma.users_emailverification.create({
      data: {
        email: lower,
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
        status: 'PENDING',
        last_sent_at: now,
        ip: req.ip || null,
        created_at: now,
        updated_at: now,
      },
    });
    await sendVerificationEmail(lower, code, 'Verify your new email for My Crew Manager', `Your verification code is ${code}. It expires in ${VERIFICATION_TTL_MIN} minutes.`);
    return res.json({ message: 'Verification code sent to your new email address' });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function changeEmailVerify(req, res, next) {
  try {
    const { new_email, code } = changeEmailVerifySchema.parse(req.body);
    const lower = new_email.toLowerCase();
    const userId = req.user.user_id ?? req.user._id;
    const rec = await prisma.users_emailverification.findFirst({
      where: { email: lower, status: 'PENDING' },
      orderBy: { created_at: 'desc' },
    });
    if (!rec) return sendError(res, 400, 'No verification code found for this email. Please request a new code.');
    if (rec.expires_at <= new Date()) {
      await prisma.users_emailverification.update({ where: { id: rec.id }, data: { status: 'EXPIRED' } });
      return sendError(res, 400, 'Verification code has expired. Please request a new code.');
    }
    if (rec.attempts >= VERIFICATION_MAX_ATTEMPTS) {
      await prisma.users_emailverification.update({ where: { id: rec.id }, data: { status: 'LOCKED' } });
      return sendError(res, 429, 'Too many attempts. Please request a new code.');
    }
    const hash = crypto.createHash('sha256').update(code).digest('hex');
    if (hash !== rec.code_hash) {
      await prisma.users_emailverification.update({ where: { id: rec.id }, data: { attempts: rec.attempts + 1 } });
      return sendError(res, 400, 'Invalid verification code. Please try again.');
    }
    const taken = await prisma.user.findFirst({ where: { email: lower, NOT: { user_id: userId } } });
    if (taken) return sendError(res, 400, 'This email address is already registered to another account');
    await prisma.users_emailverification.update({ where: { id: rec.id }, data: { status: 'VERIFIED' } });
    const updatedUser = await prisma.user.update({
      where: { user_id: userId },
      data: { email: lower, email_verified_at: new Date() },
    });

    await syncProjectMemberIdentity(userId, updatedUser.name, updatedUser.email);

    return res.json({ message: 'Email address updated successfully', new_email: lower });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function get2FAStatus(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return sendError(res, 503, '2FA is disabled');
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
      return sendError(res, 503, '2FA is disabled');
    }
    const userId = req.user.user_id ?? req.user._id;
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user || user.two_factor_enabled) return sendError(res, 400, '2FA is already enabled');
    const secret = speakeasy.generateSecret({ name: `MyCrewManager:${user.email}` });
    const otpauth = speakeasy.otpauthURL({ secret: secret.base32, label: user.email, issuer: 'MyCrewManager' });
    const qr = await QRCode.toDataURL(otpauth);
    await prisma.user.update({
      where: { user_id: userId },
      data: { two_factor_secret: secret.base32 },
    });
    return res.json({ qr_code: qr, secret: secret.base32, provisioning_uri: otpauth, message: 'Scan the QR code with your authenticator app and verify with a code' });
  } catch (err) {
    next(err);
  }
}

export async function verify2FASetup(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return sendError(res, 503, '2FA is disabled');
    }
    const { code } = twoFactorVerifySchema.parse(req.body);
    const userId = req.user.user_id ?? req.user._id;
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user || !user.two_factor_secret) return sendError(res, 400, 'No 2FA setup in progress. Please enable 2FA first.');
    const valid = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: 'base32', token: code, window: 1 });
    if (!valid) return sendError(res, 400, 'Invalid verification code');
    await prisma.user.update({ where: { user_id: userId }, data: { two_factor_enabled: true } });
    return res.json({ message: '2FA has been enabled successfully', enabled: true });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function disable2FA(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return sendError(res, 503, '2FA is disabled');
    }
    const { password } = twoFactorDisableSchema.parse(req.body);
    const userId = req.user.user_id ?? req.user._id;
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user || !user.two_factor_enabled) return sendError(res, 400, '2FA is not enabled');
    if (!(await bcrypt.compare(password, user.password))) return sendError(res, 401, 'Incorrect password');
    await prisma.user.update({
      where: { user_id: userId },
      data: { two_factor_enabled: false, two_factor_secret: null },
    });
    return res.json({ message: '2FA has been disabled successfully', enabled: false });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}

export async function verify2FALogin(req, res, next) {
  try {
    if (process.env.DISABLE_2FA === 'true') {
      return sendError(res, 503, '2FA is disabled');
    }
    const { temp_token, code, remember_me } = twoFactorLoginSchema.parse(req.body);
    const now = new Date();
    const temp = await prisma.users_twofactortemptoken.findFirst({
      where: { token: temp_token, expires_at: { gt: now } },
      include: { user: true },
    });
    if (!temp) return sendError(res, 400, 'Invalid or expired temporary token');
    const user = temp.user;
    if (!user.two_factor_enabled || !user.two_factor_secret) {
      await prisma.users_twofactortemptoken.delete({ where: { id: temp.id } });
      return sendError(res, 400, '2FA is not enabled for this account');
    }
    const valid = speakeasy.totp.verify({ secret: user.two_factor_secret, encoding: 'base32', token: code, window: 1 });
    if (!valid) return sendError(res, 400, 'Invalid verification code');
    await prisma.users_twofactortemptoken.delete({ where: { id: temp.id } });
    const tokenKey = await getOrCreateToken(user.user_id);
    if (remember_me) {
      const refreshToken = await createRefreshToken(user.user_id, true, req);
      setRefreshCookie(res, refreshToken, true);
    }
    return res.json({
      id: String(user.user_id),
      email: user.email,
      name: user.name,
      role: user.role,
      token: tokenKey,
      access: tokenKey,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return sendValidationError(res, err);
    next(err);
  }
}
