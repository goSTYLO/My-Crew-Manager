import { isSocketUserActive } from '@/realtime/middleware/auth.socket.middleware.js';

describe('isSocketUserActive', () => {
  test('returns true when active user exists', async () => {
    const prismaClient = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ user_id: 11, is_active: true }),
      },
    };

    const result = await isSocketUserActive('11', { prismaClient });
    expect(result).toBe(true);
  });

  test('returns false when user is inactive', async () => {
    const prismaClient = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ user_id: 12, is_active: false }),
      },
    };

    const result = await isSocketUserActive(12, { prismaClient });
    expect(result).toBe(false);
  });

  test('returns false when user id is invalid', async () => {
    const prismaClient = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const result = await isSocketUserActive('bad', { prismaClient });
    expect(result).toBe(false);
  });
});
