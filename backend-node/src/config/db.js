import { prisma } from '../lib/prisma.js';
import { env } from './environment.js'; // assume you have env config
import { logger } from './logger.js'; // assume a logger (winston/pino/etc)

let isConnected = false;

export async function connectDB() {
  try {
    if (isConnected) {
      logger.warn('Prisma already connected');
      return;
    }

    const dbUrl = env.database.uri;

    logger.info('Connecting to PostgreSQL via Prisma...');
    logger.debug(
      `Database URL (masked): ${dbUrl.replace(/\/\/[^@]*@/, '//***:***@')}`
    );

    await prisma.$connect();

    isConnected = true;
    logger.info('Connected to PostgreSQL successfully');

    // Optional: test query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    logger.debug('Database health check passed');

  } catch (error) {
    logger.error('Failed to connect to PostgreSQL:', error);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    if (!isConnected) {
      logger.warn('Prisma already disconnected');
      return;
    }

    await prisma.$disconnect();
    isConnected = false;

    logger.info('Disconnected from PostgreSQL');
  } catch (error) {
    logger.error('Error disconnecting from PostgreSQL:', error);
    throw error;
  }
}