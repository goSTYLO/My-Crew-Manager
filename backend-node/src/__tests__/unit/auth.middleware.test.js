import jwt from 'jsonwebtoken';
import { authMiddleware } from '@/middleware/auth.middleware.js';
import { UnauthorizedError } from '@/middleware/errors.js';
import { prisma } from '@/lib/prisma.js';

const mockReq = (authHeader) => ({
  headers: { authorization: authHeader },
});
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authMiddleware', () => {
  const mockNext = jest.fn();

  beforeEach(() => {
    mockNext.mockClear();
  });

  test('next(UnauthorizedError) when no Authorization header', async () => {
    const req = mockReq(undefined);
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(mockNext.mock.calls[0][0].message).toBe('Authentication credentials were not provided.');
    expect(res.status).not.toHaveBeenCalled();
  });

  test('next(UnauthorizedError) when Authorization header malformed', async () => {
    const req = mockReq('InvalidFormat');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('next(UnauthorizedError) when Token scheme but token not found', async () => {
    const findToken = jest.spyOn(prisma.authtoken_token, 'findUnique').mockResolvedValue(null);
    const req = mockReq('Token invalid-key');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(findToken).toHaveBeenCalledWith({ where: { key: 'invalid-key' } });
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(mockNext.mock.calls[0][0].message).toBe('Invalid token.');
    findToken.mockRestore();
  });

  test('calls next when Token valid', async () => {
    const findToken = jest.spyOn(prisma.authtoken_token, 'findUnique').mockResolvedValue({ user_id: 1n });
    const findUser = jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      user_id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: null,
      is_active: true,
      is_staff: false,
      is_superuser: false,
      profile_picture: null,
      email_verified_at: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      password: 'hashed',
      last_login: null,
      created_at: new Date(),
    });
    const req = mockReq('Token valid-key');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(req.user).toBeDefined();
    expect(req.user.name).toBe('Test');
    expect(mockNext).toHaveBeenCalledWith();
    findToken.mockRestore();
    findUser.mockRestore();
  });

  test('calls next when Bearer JWT valid', async () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET || 'test-secret');
    const findUser = jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      user_id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: null,
      is_active: true,
      is_staff: false,
      is_superuser: false,
      profile_picture: null,
      email_verified_at: null,
      two_factor_enabled: false,
      two_factor_secret: null,
      password: 'hashed',
      last_login: null,
      created_at: new Date(),
    });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(req.user).toBeDefined();
    expect(req.user.name).toBe('Test');
    expect(mockNext).toHaveBeenCalledWith();
    findUser.mockRestore();
  });

  test('next(UnauthorizedError) when Bearer JWT invalid', async () => {
    const req = mockReq('Bearer invalid-jwt');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(UnauthorizedError);
    expect(mockNext.mock.calls[0][0].message).toBe('Invalid or expired token.');
    expect(res.status).not.toHaveBeenCalled();
  });
});
