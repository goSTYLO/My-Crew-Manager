/**
 * Master demo seed: 1 PM, 2 developers, 5 AI projects (from AI/test_output_backlog_*.json),
 * one chat room per project, backlog trees without calling the AI microservice.
 * Some story tasks are marked done with staggered updated_at for dashboard / recent-completed APIs.
 *
 * Run from repo: cd backend-node && node scripts/seed-master.js
 * Reset:        node scripts/seed-master.js --reset
 *
 * Requires POSTGRES_URI or DATABASE_URL (see .env). Targets the configured DB — not a separate test DB.
 */
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import fs from 'fs';
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

const REPO_ROOT = path.resolve(__dirname, '../..');
const RESET = process.argv.includes('--reset');
const PASSWORD = 'MasterSeed!2026';

/** Matches test_microservice.TEST_PROPOSALS order → test_output_backlog_1..5.json */
const PROJECTS = [
  {
    title: '[MasterSeed] CityComm',
    summary:
      'CityComm is a web-based platform that connects residents to city services, with issue reporting and service access (TypeScript/React, maps, AI categorization).',
    backlogFile: 'test_output_backlog_1.json',
  },
  {
    title: '[MasterSeed] GreenHome',
    summary:
      'GreenHome is a smart home system that tracks energy usage, connects to appliances, and sends real-time alerts to cut consumption and support sustainability.',
    backlogFile: 'test_output_backlog_2.json',
  },
  {
    title: '[MasterSeed] EventEase',
    summary:
      'EventEase helps organizers plan weddings and conferences with AI-driven venue/vendor suggestions, scheduling, and notifications.',
    backlogFile: 'test_output_backlog_3.json',
  },
  {
    title: '[MasterSeed] MedAssist',
    summary:
      'MedAssist is a telemedicine platform with secure video visits, AI-assisted symptom checking, scheduling, and shared patient records.',
    backlogFile: 'test_output_backlog_4.json',
  },
  {
    title: '[MasterSeed] EduLearn',
    summary:
      'EduLearn delivers online courses with AI tutoring, quizzes, and progress tracking for personalized learning paths.',
    backlogFile: 'test_output_backlog_5.json',
  },
];

const USERS = [
  { email: 'master.pm@mycrewmanager.local', name: 'Morgan Avery', role: 'Project Manager' },
  { email: 'master.dev1@mycrewmanager.local', name: 'Dev One Patil', role: 'Developer' },
  { email: 'master.dev2@mycrewmanager.local', name: 'Dev Two Chen', role: 'Developer' },
];

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function loadBacklogJson(filename) {
  const full = path.join(REPO_ROOT, 'AI', filename);
  if (!fs.existsSync(full)) {
    throw new Error(`Missing backlog file: ${full}`);
  }
  return JSON.parse(fs.readFileSync(full, 'utf8'));
}

async function clearMasterData() {
  const titles = PROJECTS.map((p) => p.title);
  const emails = USERS.map((u) => u.email);

  const projects = await prisma.ai_api_project.findMany({
    where: { title: { in: titles } },
    select: { id: true },
  });
  const projectIds = projects.map((p) => p.id);

  const roomNames = PROJECTS.map((p) => roomLabel(p.title));
  const rooms = await prisma.chat_room.findMany({
    where: { name: { in: roomNames } },
    select: { room_id: true },
  });
  const roomIds = rooms.map((r) => r.room_id);

  await prisma.$transaction(async (tx) => {
    if (roomIds.length > 0) {
      await tx.chat_message.deleteMany({ where: { room_id: { in: roomIds } } });
      await tx.chat_room_membership.deleteMany({ where: { room_id: { in: roomIds } } });
      await tx.chat_room.deleteMany({ where: { room_id: { in: roomIds } } });
    }

    if (projectIds.length > 0) {
      await tx.ai_api_project.deleteMany({ where: { id: { in: projectIds } } });
    }

    const users = await tx.user.findMany({
      where: { email: { in: emails } },
      select: { user_id: true },
    });
    const userIds = users.map((u) => u.user_id);
    if (userIds.length > 0) {
      await tx.authtoken_token.deleteMany({ where: { user_id: { in: userIds.map((id) => BigInt(id)) } } });
      await tx.users_refreshtoken.deleteMany({ where: { user_id: { in: userIds } } });
      await tx.user.deleteMany({ where: { user_id: { in: userIds } } });
    }
  });
}

function roomLabel(projectTitle) {
  const short = projectTitle.replace(/^\[MasterSeed\]\s*/, '');
  return `[MasterSeed] ${short} — Team`;
}

async function ensureUsers() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.createMany({
    data: USERS.map((u, idx) => ({
      email: u.email,
      name: u.name,
      password: hash,
      role: u.role,
      is_active: true,
      is_staff: false,
      is_superuser: false,
      two_factor_enabled: false,
      created_at: daysAgo(60 - idx * 5),
      last_login: daysAgo(idx),
      profile_picture: null,
      email_verified_at: null,
      two_factor_secret: null,
    })),
    skipDuplicates: true,
  });

  const rows = await prisma.user.findMany({
    where: { email: { in: USERS.map((u) => u.email) } },
    select: { user_id: true, email: true, name: true, role: true },
  });
  const byEmail = new Map(rows.map((r) => [r.email, r]));
  for (const u of USERS) {
    if (!byEmail.has(u.email)) throw new Error(`Failed to ensure user ${u.email}`);
  }
  return byEmail;
}

/**
 * @param {object} backlogJson
 * @param {number} projectId
 * @param {{ pmMemberId: bigint, devMemberIds: bigint[] }} members
 * @param {{ taskCounter: { value: number } }} state
 */
async function insertBacklogFromJson(backlogJson, projectId, members, state) {
  const epics = backlogJson.epics || [];
  for (let ei = 0; ei < epics.length; ei++) {
    const epic = epics[ei];
    const eRow = await prisma.ai_api_epic.create({
      data: {
        title: (epic.title || 'Epic').slice(0, 512),
        description: epic.description ?? null,
        ai: epic.ai !== false,
        project_id: projectId,
        is_complete: false,
      },
    });

    for (const sub of epic.sub_epics || []) {
      const seRow = await prisma.ai_api_subepic.create({
        data: {
          title: (sub.title || 'Sub-epic').slice(0, 512),
          ai: sub.ai !== false,
          epic_id: eRow.id,
          is_complete: false,
        },
      });

      for (const story of sub.user_stories || []) {
        const usRow = await prisma.ai_api_userstory.create({
          data: {
            title: (story.title || 'Story').slice(0, 512),
            ai: story.ai !== false,
            sub_epic_id: seRow.id,
            is_complete: false,
          },
        });

        for (const task of story.tasks || []) {
          const i = state.taskCounter.value++;
          const markDone = i % 2 === 0;
          const assigneePool = members.devMemberIds;
          const assigneeId =
            !markDone && assigneePool.length > 0 ? assigneePool[i % assigneePool.length] : null;
          const doneAt = daysAgo((i % 28) + 1);
          const createdAt = daysAgo(40 + (i % 20));

          await prisma.ai_api_storytask.create({
            data: {
              user_story_id: usRow.id,
              title: (task.title || 'Task').slice(0, 512),
              status: markDone ? 'done' : 'pending',
              ai: task.ai !== false,
              assignee_id: assigneeId,
              commit_branch: markDone ? `feature/seed-${i}` : null,
              commit_title: markDone ? `Complete: ${(task.title || 'task').slice(0, 80)}` : null,
              due_date: null,
              created_at: createdAt,
              updated_at: markDone ? doneAt : daysAgo((i % 5) + 1),
            },
          });
        }
      }
    }
  }
}

async function seedOneProject(meta, usersByEmail, taskCounter) {
  const pm = usersByEmail.get(USERS[0].email);
  const d1 = usersByEmail.get(USERS[1].email);
  const d2 = usersByEmail.get(USERS[2].email);
  if (!pm || !d1 || !d2) throw new Error('Missing seed users');

  const backlogJson = loadBacklogJson(meta.backlogFile);
  const now = new Date();

  const project = await prisma.ai_api_project.create({
    data: {
      title: meta.title,
      summary: meta.summary,
      created_at: now,
      created_by_id: BigInt(pm.user_id),
      status: 'in_progress',
      updated_at: now,
      status_updated_at: now,
      status_updated_by_id: pm.user_id,
    },
  });

  const memberRows = [
    { user: pm, role: 'Owner' },
    { user: d1, role: 'Developer' },
    { user: d2, role: 'Developer' },
  ];

  await prisma.ai_api_projectmember.createMany({
    data: memberRows.map((m, idx) => ({
      project_id: project.id,
      user_id: BigInt(m.user.user_id),
      user_email: m.user.email,
      user_name: m.user.name,
      role: m.role,
      joined_at: new Date(now.getTime() + (idx + 1) * 3600_000),
    })),
  });

  const membersDb = await prisma.ai_api_projectmember.findMany({
    where: { project_id: project.id },
    select: { id: true, user_id: true, role: true },
  });
  const pmMember = membersDb.find((m) => Number(m.user_id) === pm.user_id);
  const devMembers = membersDb.filter((m) => m.role === 'Developer');
  if (!pmMember) throw new Error('PM member row missing');

  await insertBacklogFromJson(backlogJson, project.id, {
    pmMemberId: pmMember.id,
    devMemberIds: devMembers.map((m) => m.id),
  }, { taskCounter });

  const room = await prisma.chat_room.create({
    data: {
      name: roomLabel(meta.title),
      is_private: false,
      created_at: new Date(now.getTime() + 10_000),
      created_by_id: BigInt(pm.user_id),
    },
  });

  for (const m of membersDb) {
    await prisma.chat_room_membership.create({
      data: {
        room_id: room.room_id,
        user_id: m.user_id,
        is_admin: m.role === 'Owner',
        joined_at: new Date(now.getTime() + 20_000),
      },
    });
  }

  const lines = [
    'Kickoff: backlog imported from demo dataset — no AI microservice run.',
    'Use this room for release and scope questions.',
    `${d1.name}: picking up the next pending tasks.`,
    `${d2.name}: syncing with PM on priorities.`,
  ];
  for (let i = 0; i < lines.length; i++) {
    const author = i % 3 === 0 ? pm : i % 3 === 1 ? d1 : d2;
    await prisma.chat_message.create({
      data: {
        room_id: room.room_id,
        content: lines[i],
        created_at: new Date(now.getTime() + (i + 1) * 120_000),
        edited_at: null,
        is_deleted: false,
        sender_id: BigInt(author.user_id),
        message_type: 'text',
        reply_to_id: null,
      },
    });
  }

  return project.id;
}

async function main() {
  await prisma.$connect();
  console.log('Connected. Master seed uses prefix [MasterSeed] for projects and chat rooms.');

  if (RESET) {
    console.log('Removing previous master seed rows...');
    await clearMasterData();
  }

  const usersByEmail = await ensureUsers();
  const taskCounter = { value: 0 };

  for (const meta of PROJECTS) {
    const existing = await prisma.ai_api_project.findFirst({ where: { title: meta.title } });
    if (existing) {
      console.log(`Skip (already exists): ${meta.title}`);
      continue;
    }
    const id = await seedOneProject(meta, usersByEmail, taskCounter);
    console.log(`Seeded: ${meta.title} (project id ${id})`);
  }

  console.log('\nDone.');
  console.log('Accounts (password for all):', PASSWORD);
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(18)} ${u.email}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
