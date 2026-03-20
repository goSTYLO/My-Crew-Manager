import 'dotenv/config';

import prismaPkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = prismaPkg;

const globalForPrisma = globalThis;

const connectionString =
  process.env.POSTGRES_URI || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'POSTGRES_URI or DATABASE_URL must be set for Prisma (see backend-node/.env)'
  );
}

const adapter = new PrismaPg({ connectionString });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}