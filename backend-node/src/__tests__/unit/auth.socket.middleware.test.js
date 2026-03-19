import { authenticateSocketRequest } from '@/realtime/middleware/auth.socket.middleware.js';

describe('authenticateSocketRequest', () => {
  test('authenticates with Token header', async () => {
    const request = {
      headers: { authorization: 'Token abc123' },
      url: '/ws/chat/1/',
    };

    const prismaClient = {
      authtoken_token: {
        findUnique: jest.fn().mockResolvedValue({ key: 'abc123', user_id: 7n }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ user_id: 7, is_active: true, name: 'Token User' }),
      },
    };

    const result = await authenticateSocketRequest(request, { prismaClient });
    expect(result.ok).toBe(true);
    expect(result.user.user_id).toBe(7);
  });

  test('authenticates with query token fallback', async () => {
    const request = {
      headers: {},
      url: '/ws/chat/1/?token=qwerty',
    };

    const prismaClient = {
      authtoken_token: {
        findUnique: jest.fn().mockResolvedValue({ key: 'qwerty', user_id: 8n }),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ user_id: 8, is_active: true, name: 'Query User' }),
      },
    };

    const result = await authenticateSocketRequest(request, { prismaClient });
    expect(result.ok).toBe(true);
    expect(result.user.user_id).toBe(8);
  });

  test('authenticates with Bearer token', async () => {
    const request = {
      headers: { authorization: 'Bearer jwt-token' },
      url: '/ws/chat/1/',
    };

    const prismaClient = {
      authtoken_token: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ user_id: 9, is_active: true, name: 'Jwt User' }),
      },
    };

    const verifyJwt = jest.fn().mockReturnValue({ userId: 9 });

    const result = await authenticateSocketRequest(request, { prismaClient, verifyJwt });
    expect(result.ok).toBe(true);
    expect(result.user.user_id).toBe(9);
    expect(verifyJwt).toHaveBeenCalled();
  });

  test('returns structured error for missing credentials', async () => {
    const request = {
      headers: {},
      url: '/ws/chat/1/',
    };

    const prismaClient = {
      authtoken_token: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const result = await authenticateSocketRequest(request, { prismaClient });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('authentication_credentials_not_provided');
  });

  test('returns structured error for invalid bearer token', async () => {
    const request = {
      headers: { authorization: 'Bearer bad-token' },
      url: '/ws/chat/1/',
    };

    const prismaClient = {
      authtoken_token: {
        findUnique: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const verifyJwt = jest.fn(() => {
      throw new Error('expired');
    });

    const result = await authenticateSocketRequest(request, { prismaClient, verifyJwt });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('invalid_or_expired_token');
  });
});
