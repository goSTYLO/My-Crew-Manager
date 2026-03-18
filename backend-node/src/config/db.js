import { prisma } from '../lib/prisma.js';

export async function connectDB() {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection error:', err);
    throw err;
  }
}
