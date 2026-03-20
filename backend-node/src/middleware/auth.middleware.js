import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { logger } from '../config/logger.js';
import { UnauthorizedError } from './errors.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

function parseAuthToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2) return null;

  const [schemeRaw, value] = parts;
  const scheme = schemeRaw.toLowerCase();

  if (!value) return null;
  if (scheme === 'token') return { scheme: 'Token', value };
  if (scheme === 'bearer') return { scheme: 'Bearer', value };
  return { scheme: 'Invalid', value };
}

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
  try {
    const parsed = parseAuthToken(req.headers.authorization);
    if (!parsed) {
      logger.warn('Auth token missing', {
        request_id: req.requestId || null,
        ip: req.ip,
        path: req.originalUrl,
      });
      return next(new UnauthorizedError('Authentication credentials were not provided.'));
    }

    const { scheme, value } = parsed;

    if (scheme === 'Invalid') {
      logger.warn('Auth header invalid format', {
        request_id: req.requestId || null,
        ip: req.ip,
        path: req.originalUrl,
      });
      return next(new UnauthorizedError('Invalid authorization header.'));
    }

    if (scheme === 'Token') {
      const tokenRow = await prisma.authtoken_token.findUnique({
        where: { key: value },
      });
      if (!tokenRow) {
        logger.warn('Token validation failed', {
          request_id: req.requestId || null,
          ip: req.ip,
          path: req.originalUrl,
          auth_scheme: 'Token',
          reason: 'token_not_found',
        });
        return next(new UnauthorizedError('Invalid token.'));
      }
      const user = await prisma.user.findUnique({
        where: { user_id: Number(tokenRow.user_id) },
      });
      if (!user || !user.is_active) {
        logger.warn('Token validation failed', {
          request_id: req.requestId || null,
          ip: req.ip,
          path: req.originalUrl,
          auth_scheme: 'Token',
          user_id: user?.user_id || null,
          email: user?.email || null,
          reason: 'inactive_or_missing_user',
        });
        return next(new UnauthorizedError('Invalid token.'));
      }
      req.user = userToReqUser(user);
      return next();
    }

    if (scheme === 'Bearer') {
      try {
        const decoded = jwt.verify(value, JWT_SECRET);
        const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
        if (isNaN(userId)) {
          logger.warn('Bearer validation failed', {
            request_id: req.requestId || null,
            ip: req.ip,
            path: req.originalUrl,
            auth_scheme: 'Bearer',
            reason: 'invalid_user_id_claim',
          });
          return next(new UnauthorizedError('Invalid token.'));
        }
        const user = await prisma.user.findUnique({
          where: { user_id: userId },
        });
        if (!user || !user.is_active) {
          logger.warn('Bearer validation failed', {
            request_id: req.requestId || null,
            ip: req.ip,
            path: req.originalUrl,
            auth_scheme: 'Bearer',
            user_id: user?.user_id || null,
            email: user?.email || null,
            reason: 'inactive_or_missing_user',
          });
          return next(new UnauthorizedError('Invalid token.'));
        }
        req.user = userToReqUser(user);
        return next();
      } catch (err) {
        logger.warn('Bearer validation failed', {
          request_id: req.requestId || null,
          ip: req.ip,
          path: req.originalUrl,
          auth_scheme: 'Bearer',
          reason: err?.name === 'TokenExpiredError' ? 'expired' : 'invalid',
        });
        return next(new UnauthorizedError('Invalid or expired token.'));
      }
    }

    return next(new UnauthorizedError('Invalid authorization scheme.'));
  } catch (err) {
    return next(err);
  }
}

/**
 * Optional auth - attaches user if token present, does not require it
 */
export async function optionalAuthMiddleware(req, res, next) {
  const parsed = parseAuthToken(req.headers.authorization);
  if (!parsed || parsed.scheme === 'Invalid') return next();

  const { scheme, value } = parsed;

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
