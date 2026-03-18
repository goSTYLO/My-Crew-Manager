import jwt from 'jsonwebtoken';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { Token } from '@/models/Token.js';
import { User } from '@/models/User.js';

jest.mock('@/models/Token.js');
jest.mock('@/models/User.js');

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
    Token.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });
    const req = mockReq('Token invalid-key');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(Token.findOne).toHaveBeenCalledWith({ key: 'invalid-key' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('calls next when Token valid', async () => {
    const mockUser = { _id: 'u1', name: 'Test' };
    Token.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockResolvedValue({ user: mockUser }),
    });
    const req = mockReq('Token valid-key');
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(req.user).toEqual(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  test('calls next when Bearer JWT valid', async () => {
    const mockUser = { _id: 'u1', name: 'Test', isActive: true };
    const token = jwt.sign({ userId: 'u1' }, process.env.JWT_SECRET || 'test-secret');
    User.findById = jest.fn().mockResolvedValue(mockUser);
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    await authMiddleware(req, res, mockNext);
    expect(req.user).toEqual(mockUser);
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
