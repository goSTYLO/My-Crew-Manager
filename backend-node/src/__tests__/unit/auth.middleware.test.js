import jwt from 'jsonwebtoken';
import { authMiddleware } from '@/middleware/auth.middleware.js';
import { prisma } from '@/lib/prisma.js';

jest.mock('@/lib/prisma.js', () => ({
  prisma: {
    authtoken_token: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
  },
}));

const mockReq = (authHeader) => ({
  headers: { authorization: authHeader },
});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = jest.fn();

describe('authMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 401 when no Authorization header', async () => {
    const req = mockReq(undefined);
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ detail: 'Authentication credentials were not provided.' });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header malformed', async () => {
    const req = mockReq('InvalidFormat');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('returns 401 when Token scheme but token not found', async () => {
    prisma.authtoken_token.findUnique.mockResolvedValue(null);
    const req = mockReq('Token invalid-key');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(prisma.authtoken_token.findUnique).toHaveBeenCalledWith({ where: { key: 'invalid-key' } });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('calls next when Token valid', async () => {
    prisma.authtoken_token.findUnique.mockResolvedValue({ user_id: 1n });
    prisma.user.findUnique.mockResolvedValue({
      user_id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: null,
      is_active: true,
      is_staff: false,
      profile_picture: null,
      email_verified_at: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      password: 'hashed',
    });
    const req = mockReq('Token valid-key');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(req.user).toBeDefined();
    expect(req.user.name).toBe('Test');
    expect(mockNext).toHaveBeenCalled();
  });

  test('calls next when Bearer JWT valid', async () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');
    prisma.user.findUnique.mockResolvedValue({
      user_id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: null,
      is_active: true,
      is_staff: false,
      profile_picture: null,
      email_verified_at: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      password: 'hashed',
    });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(req.user).toBeDefined();
    expect(req.user.name).toBe('Test');
    expect(mockNext).toHaveBeenCalled();
  });

  test('returns 401 when Bearer JWT invalid', async () => {
    const req = mockReq('Bearer invalid-jwt');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
