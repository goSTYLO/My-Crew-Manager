import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { prisma } from '../../lib/prisma.js';

describe('database health', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('$queryRaw SELECT 1', async () => {
    const rows = await prisma.$queryRaw`SELECT 1::int AS v`;
    expect(Array.isArray(rows)).toBe(true);
    const first = rows[0];
    expect(first).toBeDefined();
    const val = first.v ?? first.V;
    expect(Number(val)).toBe(1);
  });

  test('Prisma delegates respond to count()', async () => {
    const delegates = Object.entries(prisma)
      .filter(([key, value]) => !key.startsWith('$') && !key.startsWith('_') && typeof value?.count === 'function')
      .map(([key]) => key)
      .sort();

    expect(delegates.length).toBeGreaterThan(0);

    for (const name of delegates) {
      await expect(prisma[name].count()).resolves.toBeGreaterThanOrEqual(0);
    }
  });
});
