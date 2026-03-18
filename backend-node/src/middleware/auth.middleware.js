import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

function userToReqUser(dbUser) {
  if (!dbUser) return null;
  return {
    _id: dbUser.user_id,
    user_id: dbUser.user_id,
    email: dbUser.email,
    name: dbUser.name,
    role: dbUser.role,
    isActive: dbUser.is_active,
    isStaff: dbUser.is_staff,
    profilePicture: dbUser.profile_picture,
    emailVerifiedAt: dbUser.email_verified_at,
    twoFactorEnabled: dbUser.two_factor_enabled,
    comparePassword(candidate) {
      const bcrypt = require('bcrypt');
      return bcrypt.compare(candidate, dbUser.password);
    },
    toJSON() {
      const { password, ...rest } = dbUser;
      return { ...rest, _id: rest.user_id };
    },
  };
}

/**
 * Resolve user from Authorization header: "Token <key>" or "Bearer <jwt>"
 */
export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ detail: 'Authentication credentials were not provided.' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2) {
    return res.status(401).json({ detail: 'Invalid authorization header.' });
  }

  const [scheme, value] = parts;

  if (scheme === 'Token') {
    const tokenRow = await prisma.authtoken_token.findUnique({
      where: { key: value },
    });
    if (!tokenRow) {
      return res.status(401).json({ detail: 'Invalid token.' });
    }
    const user = await prisma.user.findUnique({
      where: { user_id: Number(tokenRow.user_id) },
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ detail: 'Invalid token.' });
    }
    req.user = userToReqUser(user);
    return next();
  }

  if (scheme === 'Bearer') {
    try {
      const decoded = jwt.verify(value, JWT_SECRET);
      const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
      if (isNaN(userId)) {
        return res.status(401).json({ detail: 'Invalid token.' });
      }
      const user = await prisma.user.findUnique({
        where: { user_id: userId },
      });
      if (!user || !user.is_active) {
        return res.status(401).json({ detail: 'Invalid token.' });
      }
      req.user = userToReqUser(user);
      return next();
    } catch (err) {
      return res.status(401).json({ detail: 'Invalid or expired token.' });
    }
  }

  return res.status(401).json({ detail: 'Invalid authorization scheme.' });
}

/**
 * Optional auth - attaches user if token present, does not require it
 */
export async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  const parts = authHeader.split(' ');
  if (parts.length !== 2) return next();

  const [scheme, value] = parts;

  if (scheme === 'Token') {
    const tokenRow = await prisma.authtoken_token.findUnique({
      where: { key: value },
    });
    if (tokenRow) {
      const user = await prisma.user.findUnique({
        where: { user_id: Number(tokenRow.user_id) },
      });
      if (user?.is_active) req.user = userToReqUser(user);
    }
    return next();
  }

  if (scheme === 'Bearer') {
    try {
      const decoded = jwt.verify(value, JWT_SECRET);
      const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
      if (!isNaN(userId)) {
        const user = await prisma.user.findUnique({
          where: { user_id: userId },
        });
        if (user?.is_active) req.user = userToReqUser(user);
      }
    } catch (_) {}
  }
  return next();
}
