import jwt from 'jsonwebtoken';
import { Token } from '../models/Token.js';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

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
    const token = await Token.findOne({ key: value }).populate('user');
    if (!token || !token.user) {
      return res.status(401).json({ detail: 'Invalid token.' });
    }
    req.user = token.user;
    return next();
  }

  if (scheme === 'Bearer') {
    try {
      const decoded = jwt.verify(value, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({ detail: 'Invalid token.' });
      }
      req.user = user;
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
    const token = await Token.findOne({ key: value }).populate('user');
    if (token?.user) req.user = token.user;
    return next();
  }

  if (scheme === 'Bearer') {
    try {
      const decoded = jwt.verify(value, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user?.isActive) req.user = user;
    } catch (_) {}
  }
  return next();
}
