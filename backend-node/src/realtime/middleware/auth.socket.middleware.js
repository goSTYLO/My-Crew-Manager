import { parse } from 'url';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;

function parseTokenFromUrl(url) {
  const { query } = parse(url || '', true);
  return query?.token || query?.auth_token;
}

function parseAuthHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const [schemeRaw, value] = parts;
  const scheme = schemeRaw.toLowerCase();
  if (!value) return null;
  if (scheme === 'token' || scheme === 'bearer') return { scheme, value };
  return null;
}

export async function authenticateSocketRequest(request, deps = {}) {
  const prismaClient = deps.prismaClient || prisma;
  const verifyJwt = deps.verifyJwt || jwt.verify;

  const headerAuth = parseAuthHeader(request.headers?.authorization);
  const queryToken = parseTokenFromUrl(request.url || '');

  if (headerAuth?.scheme === 'bearer') {
    try {
      const decoded = verifyJwt(headerAuth.value, JWT_SECRET);
      const userId = typeof decoded.userId === 'string' ? parseInt(decoded.userId, 10) : decoded.userId;
      if (Number.isNaN(userId)) return { ok: false, error: 'invalid_token' };
      const user = await prismaClient.user.findUnique({ where: { user_id: userId } });
      if (!user?.is_active) return { ok: false, error: 'invalid_token' };
      return { ok: true, user };
    } catch (_) {
      return { ok: false, error: 'invalid_or_expired_token' };
    }
  }

  const tokenKey = headerAuth?.value || queryToken;
  if (!tokenKey) return { ok: false, error: 'authentication_credentials_not_provided' };

  const token = await prismaClient.authtoken_token.findUnique({ where: { key: tokenKey } });
  if (!token) return { ok: false, error: 'invalid_token' };

  const user = await prismaClient.user.findUnique({ where: { user_id: Number(token.user_id) } });
  if (!user?.is_active) return { ok: false, error: 'invalid_token' };
  return { ok: true, user };
}

export async function isSocketUserActive(userId, deps = {}) {
  const prismaClient = deps.prismaClient || prisma;
  const parsed = typeof userId === 'string' ? parseInt(userId, 10) : userId;
  if (Number.isNaN(parsed) || !parsed) return false;
  const user = await prismaClient.user.findUnique({ where: { user_id: parsed } });
  return Boolean(user?.is_active);
}
