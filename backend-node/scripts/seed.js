/**
 * Chat-centric PostgreSQL seed script for MyCrewManager.
 *
 * Run:
 *   npm run seed
 *   npm run seed:reset
 *
 * Assumptions from prisma schema:
 * - Users are in `user` with PK `user_id` (Int).
 * - Projects are in `ai_api_project` with PK `id` (Int).
 * - Project membership is in `ai_api_projectmember` using `project_id` + `user_id`.
 * - Chat rooms/messages use `chat_room`, `chat_room_membership`, `chat_message`.
 * - `chat_message` currently does not include a dedicated `client_message_id` column.
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../src/lib/prisma.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL && process.env.DB_NAME) {
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME;
  process.env.DATABASE_URL = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

const RESET = process.argv.includes('--reset');
const TEST_PASSWORD = 'CrewPass!2026';

const USER_BLUEPRINTS = [
  { name: 'Maya Santos', email: 'pm.maya@mycrewmanager.test', role: 'Project Manager' },
  { name: 'Carlos Lim', email: 'pm.carlos@mycrewmanager.test', role: 'Project Manager' },
  { name: 'Nina Reyes', email: 'pm.nina@mycrewmanager.test', role: 'Project Manager' },
  { name: 'Alden Cruz', email: 'dev.alden@mycrewmanager.test', role: 'Developer' },
  { name: 'Bea Gonzales', email: 'dev.bea@mycrewmanager.test', role: 'Developer' },
  { name: 'Dino Flores', email: 'dev.dino@mycrewmanager.test', role: 'Developer' },
  { name: 'Ivy Chan', email: 'dev.ivy@mycrewmanager.test', role: 'Developer' },
  { name: 'Leo Dizon', email: 'dev.leo@mycrewmanager.test', role: 'Developer' },
  { name: 'Rina Torres', email: 'dev.rina@mycrewmanager.test', role: 'Developer' },
  { name: 'Sam Bautista', email: 'dev.sam@mycrewmanager.test', role: 'Developer' },
];

const PROJECT_BLUEPRINTS = [
  {
    title: '[Seed] Atlas Mobile Banking',
    summary: 'Mobile-first banking app revamp with KYC onboarding and transaction alerts.',
    status: 'in_progress',
    memberEmails: [
      'pm.maya@mycrewmanager.test',
      'dev.alden@mycrewmanager.test',
      'dev.bea@mycrewmanager.test',
      'dev.leo@mycrewmanager.test',
    ],
    groups: ['General Discussion', 'Backend Team'],
  },
  {
    title: '[Seed] Orion Logistics Portal',
    summary: 'Dispatch and shipment tracking portal with role-based dashboards.',
    status: 'setting_up',
    memberEmails: [
      'pm.carlos@mycrewmanager.test',
      'dev.dino@mycrewmanager.test',
      'dev.ivy@mycrewmanager.test',
      'dev.sam@mycrewmanager.test',
    ],
    groups: ['Sprint Team', 'General Discussion'],
  },
  {
    title: '[Seed] Nimbus Analytics Studio',
    summary: 'Self-service analytics suite with scheduled reports and drill-down charts.',
    status: 'in_progress',
    memberEmails: [
      'pm.nina@mycrewmanager.test',
      'dev.rina@mycrewmanager.test',
      'dev.bea@mycrewmanager.test',
      'dev.sam@mycrewmanager.test',
    ],
    groups: ['Sprint Team', 'Frontend Team'],
  },
  {
    title: '[Seed] Helios HR Suite',
    summary: 'Employee leave, approvals, and document workflow modernization.',
    status: 'on_hold',
    memberEmails: [
      'pm.maya@mycrewmanager.test',
      'pm.carlos@mycrewmanager.test',
      'dev.ivy@mycrewmanager.test',
      'dev.leo@mycrewmanager.test',
    ],
    groups: ['General Discussion', 'Backend Team'],
  },
  {
    title: '[Seed] Vega Commerce Platform',
    summary: 'Marketplace checkout optimization with promotions and order timeline views.',
    status: 'complete',
    memberEmails: [
      'pm.nina@mycrewmanager.test',
      'dev.alden@mycrewmanager.test',
      'dev.dino@mycrewmanager.test',
      'dev.rina@mycrewmanager.test',
    ],
    groups: ['Sprint Team', 'General Discussion'],
  },
];

const TOPICS = [
  'sprint goal',
  'bug triage',
  'code review',
  'deployment checklist',
  'QA signoff',
  'deadline alignment',
  'task ownership',
  'API contract',
  'websocket event payload',
  'release notes',
];

const PM_LINES = [
  'Can we lock the sprint scope before standup?',
  'Please update the task status before EOD so we can report progress.',
  'We need the risk list ready before tomorrow\'s planning meeting.',
  'Let\'s keep this deadline realistic and split work by owner.',
  'I\'m tracking this in the board and will flag blockers in the recap.',
];

const DEV_LINES = [
  'I pushed a fix and will post the PR link after smoke tests.',
  'I can take the API endpoint and pair with QA after lunch.',
  'The query is optimized now; p95 dropped significantly in local tests.',
  'I found the root cause in validation and opened a follow-up task.',
  'I\'ll ship this behind a flag so we can validate safely.',
];

const TEST_CREDENTIALS = {
  pm: {
    email: 'pm.maya@mycrewmanager.test',
    password: TEST_PASSWORD,
    role: 'Project Manager',
  },
  developer: {
    email: 'dev.alden@mycrewmanager.test',
    password: TEST_PASSWORD,
    role: 'Developer',
  },
};

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function pickLine(role, index) {
  if (role === 'Project Manager') return PM_LINES[index % PM_LINES.length];
  return DEV_LINES[index % DEV_LINES.length];
}

async function clearSeedData({ hardResetUsers }) {
  const seedProjectTitles = PROJECT_BLUEPRINTS.map((p) => p.title);
  const seedUserEmails = USER_BLUEPRINTS.map((u) => u.email);

  const existingProjects = await prisma.ai_api_project.findMany({
    where: { title: { in: seedProjectTitles } },
    select: { id: true },
  });
  const existingProjectIds = existingProjects.map((p) => p.id);

  const existingRooms = await prisma.chat_room.findMany({
    where: { name: { startsWith: '[Seed] ' } },
    select: { room_id: true },
  });
  const existingRoomIds = existingRooms.map((r) => r.room_id);

  await prisma.$transaction(async (tx) => {
    if (existingRoomIds.length > 0) {
      await tx.chat_message.deleteMany({ where: { room_id: { in: existingRoomIds } } });
      await tx.chat_room_membership.deleteMany({ where: { room_id: { in: existingRoomIds } } });
      await tx.chat_room.deleteMany({ where: { room_id: { in: existingRoomIds } } });
    }

    if (existingProjectIds.length > 0) {
      await tx.ai_api_project.deleteMany({ where: { id: { in: existingProjectIds } } });
    }

    if (hardResetUsers) {
      const users = await tx.user.findMany({
        where: { email: { in: seedUserEmails } },
        select: { user_id: true },
      });
      const userIds = users.map((u) => u.user_id);
      if (userIds.length > 0) {
        await tx.authtoken_token.deleteMany({ where: { user_id: { in: userIds.map((id) => BigInt(id)) } } });
        await tx.users_refreshtoken.deleteMany({ where: { user_id: { in: userIds } } });
      }
      await tx.user.deleteMany({ where: { email: { in: seedUserEmails } } });
    }
  });
}

async function ensureUsers() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  await prisma.user.createMany({
    data: USER_BLUEPRINTS.map((u, idx) => ({
      email: u.email,
      name: u.name,
      password: passwordHash,
      role: u.role,
      is_active: true,
      is_staff: false,
      is_superuser: false,
      two_factor_enabled: false,
      created_at: daysAgo(45 - idx),
      last_login: null,
      profile_picture: null,
      email_verified_at: null,
      two_factor_secret: null,
    })),
    skipDuplicates: true,
  });

  const users = await prisma.user.findMany({
    where: { email: { in: USER_BLUEPRINTS.map((u) => u.email) } },
    select: { user_id: true, name: true, email: true, role: true },
  });

  const byEmail = new Map(users.map((u) => [u.email, u]));
  for (const seedUser of USER_BLUEPRINTS) {
    if (!byEmail.has(seedUser.email)) {
      throw new Error(`Required seed user missing after creation: ${seedUser.email}`);
    }
  }

  return byEmail;
}

function buildRoomMessages(projectTitle, roomName, members, messageCount) {
  const roomSeed = `${projectTitle}|${roomName}`;
  const now = Date.now();
  const startOffsetHours = 72;
  const intervalMinutes = 15;

  const messages = [];
  for (let i = 0; i < messageCount; i++) {
    const sender = members[i % members.length];
    const topic = TOPICS[(i + roomSeed.length) % TOPICS.length];
    const weekLabel = `Sprint ${((i % 4) + 1)}`;
    const baseLine = pickLine(sender.role, i);
    const content = `${weekLabel}: ${baseLine} For ${topic}, I tagged task #${100 + i} in ${roomName}.`;

    const createdAt = new Date(now - (startOffsetHours * 60 + i * intervalMinutes) * 60 * 1000);
    messages.push({
      content,
      created_at: createdAt,
      edited_at: null,
      is_deleted: false,
      sender_id: BigInt(sender.user_id),
      message_type: 'text',
      reply_to_id: null,
    });
  }

  return messages;
}

async function seedProjectsChatAndMessages(usersByEmail) {
  const seeded = [];

  for (let i = 0; i < PROJECT_BLUEPRINTS.length; i++) {
    const p = PROJECT_BLUEPRINTS[i];
    const createdBy = usersByEmail.get(p.memberEmails[0]);
    if (!createdBy) throw new Error(`Project creator not found for ${p.title}`);

    const createdAt = daysAgo(30 - i * 3);

    const project = await prisma.ai_api_project.create({
      data: {
        title: p.title,
        summary: p.summary,
        created_at: createdAt,
        created_by_id: BigInt(createdBy.user_id),
        status: p.status,
        updated_at: createdAt,
        status_updated_at: createdAt,
        status_updated_by_id: createdBy.user_id,
      },
    });

    const members = p.memberEmails.map((email) => {
      const user = usersByEmail.get(email);
      if (!user) throw new Error(`Project member missing: ${email}`);
      return user;
    });

    await prisma.ai_api_projectmember.createMany({
      data: members.map((m, idx) => ({
        project_id: project.id,
        user_id: BigInt(m.user_id),
        user_email: m.email,
        user_name: m.name,
        role: idx === 0 ? 'Owner' : m.role === 'Project Manager' ? 'Project Lead' : 'Developer',
        joined_at: new Date(createdAt.getTime() + (idx + 1) * 60 * 60 * 1000),
      })),
      skipDuplicates: true,
    });

    for (let g = 0; g < p.groups.length; g++) {
      const groupName = p.groups[g];
      const room = await prisma.chat_room.create({
        data: {
          name: `[Seed] ${p.title.replace('[Seed] ', '')} - ${groupName}`,
          is_private: false,
          created_at: new Date(createdAt.getTime() + (g + 1) * 2 * 60 * 60 * 1000),
          created_by_id: BigInt(createdBy.user_id),
        },
      });

      await prisma.chat_room_membership.createMany({
        data: members.map((m, idx) => ({
          room_id: room.room_id,
          user_id: BigInt(m.user_id),
          is_admin: idx === 0,
          joined_at: new Date(createdAt.getTime() + (idx + 1) * 3 * 60 * 60 * 1000),
        })),
        skipDuplicates: true,
      });

      const messageCount = 12 + ((i + g) % 5); // 12..16 messages per room
      const messages = buildRoomMessages(p.title, groupName, members, messageCount).map((m) => ({
        ...m,
        room_id: room.room_id,
      }));

      await prisma.chat_message.createMany({ data: messages });
    }

    seeded.push({ project, membersCount: members.length, roomsCount: p.groups.length });
  }

  return seeded;
}

async function main() {
  await prisma.$connect();
  console.log('Connected to PostgreSQL');

  console.log('Preparing seed dataset...');
  await clearSeedData({ hardResetUsers: RESET });

  const usersByEmail = await ensureUsers();
  const seededProjects = await seedProjectsChatAndMessages(usersByEmail);

  const totalRooms = seededProjects.reduce((sum, p) => sum + p.roomsCount, 0);
  const totalProjects = seededProjects.length;

  console.log('Seed complete.');
  console.log(`Projects seeded: ${totalProjects}`);
  console.log(`Chat rooms seeded: ${totalRooms}`);
  console.log(`Users available: ${USER_BLUEPRINTS.length}`);

  console.log('\nLogin credentials for WebSocket chat testing:');
  console.log(`PM account:        ${TEST_CREDENTIALS.pm.email} / ${TEST_CREDENTIALS.pm.password}`);
  console.log(`Developer account: ${TEST_CREDENTIALS.developer.email} / ${TEST_CREDENTIALS.developer.password}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Seed failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
