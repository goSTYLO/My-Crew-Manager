import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL && process.env.DB_NAME) {
  const dbName = process.env.NODE_ENV === 'test' ? `${process.env.DB_NAME.replace(/_?$/, '')}_test` : process.env.DB_NAME;
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  process.env.DATABASE_URL = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${dbName}`;
}

export async function connectTestDB() {
  await prisma.$connect();
  return process.env.DATABASE_URL;
}

export async function disconnectTestDB() {
  await prisma.$disconnect();
}

/**
 * Truncate test data in FK-safe order. Use before each test to ensure clean state.
 */
export async function truncateTestData() {
  await prisma.$transaction(async (tx) => {
    await tx.ai_api_notification.deleteMany({});
    await tx.chat_message.deleteMany({});
    await tx.chat_room_membership.deleteMany({});
    await tx.chat_room.deleteMany({});
    await tx.ai_api_storytask.deleteMany({});
    await tx.ai_api_userstory.deleteMany({});
    await tx.ai_api_subepic.deleteMany({});
    await tx.ai_api_epic.deleteMany({});
    await tx.ai_api_timelineitem.deleteMany({});
    await tx.ai_api_timelineweek.deleteMany({});
    await tx.ai_api_projectgoal.deleteMany({});
    await tx.ai_api_projectrole.deleteMany({});
    await tx.ai_api_projectfeature.deleteMany({});
    await tx.ai_api_repository.deleteMany({});
    await tx.ai_api_projectmember.deleteMany({});
    await tx.ai_api_proposal.deleteMany({});
    await tx.ai_api_projectinvitation.deleteMany({});
    await tx.ai_api_project.deleteMany({});
    await tx.authtoken_token.deleteMany({});
    await tx.users_refreshtoken.deleteMany({});
    await tx.users_emailverification.deleteMany({});
    await tx.users_twofactortemptoken.deleteMany({});
    await tx.user.deleteMany({});
  });
}
