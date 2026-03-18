/**
 * PostgreSQL seed script - populates DB with PM, Developer, 5 projects, backlog, proposals, rooms, notifications
 * Run: node scripts/seed.js [--reset]
 * Requires: DATABASE_URL or DB_* vars in env (from .env)
 * Seed accounts: pm@example.com / dev@example.com, password: password123
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

const SEED_EMAILS = ['pm@example.com', 'dev@example.com'];
const PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const PROJECTS_DATA = [
  {
    title: 'E-commerce Platform',
    summary: 'Full-featured online store with product catalog, shopping cart, and secure checkout.',
    status: 'complete',
    features: ['Product catalog with search', 'Shopping cart', 'Checkout flow', 'Order history', 'Admin dashboard'],
    roles: ['Product Owner', 'Backend Developer', 'Frontend Developer', 'QA'],
    goals: [
      { title: 'Launch MVP by Q2', role: 'Product Owner' },
      { title: 'Implement payment gateway', role: 'Backend Developer' },
      { title: 'Build responsive product pages', role: 'Frontend Developer' },
      { title: 'Achieve 95% test coverage', role: 'QA' },
    ],
    timeline: [
      { week: 1, items: ['Define product schema', 'Set up CI/CD', 'Create base components'] },
      { week: 2, items: ['Integrate Stripe', 'Build cart UI', 'Add search'] },
      { week: 3, items: ['Order flow', 'Email notifications', 'Admin panel'] },
      { week: 4, items: ['Bug fixes', 'Performance tuning', 'Launch prep'] },
    ],
    repositories: [
      { name: 'store-api', url: 'https://github.com/org/store-api', branch: 'main' },
      { name: 'store-web', url: 'https://github.com/org/store-web', branch: 'main' },
    ],
    epics: [
      { title: 'Product Management', description: 'CRUD for products', subEpics: [
        { title: 'Product List & Search', stories: [
          { title: 'Display product grid', tasks: ['Create ProductCard component', 'Add pagination', 'Integrate API'] },
          { title: 'Search and filters', tasks: ['Build search bar', 'Add category filter', 'Sort options'] },
        ]},
        { title: 'Product Detail', stories: [
          { title: 'Product page layout', tasks: ['Image gallery', 'Add to cart button', 'Related products'] },
        ]},
      ]},
      { title: 'Cart & Checkout', description: 'Shopping flow', subEpics: [
        { title: 'Cart', stories: [
          { title: 'Cart persistence', tasks: ['Local storage cart', 'Sync on login', 'Update quantities'] },
        ]},
        { title: 'Checkout', stories: [
          { title: 'Checkout form', tasks: ['Address form', 'Payment form', 'Order confirmation'] },
        ]},
      ]},
    ],
    proposalText: 'Build a modern e-commerce platform with product catalog, search, cart, and Stripe checkout. Target: launch MVP in 4 weeks. Tech: Node.js backend, React frontend.',
  },
  {
    title: 'Task Management SaaS',
    summary: 'Collaborative task and project management tool with boards, tags, and due dates.',
    status: 'in_progress',
    features: ['Kanban boards', 'Tags and labels', 'Due dates', 'Team collaboration', 'Activity feed'],
    roles: ['Project Manager', 'Full-stack Developer', 'Designer'],
    goals: [
      { title: 'Ship beta in 6 weeks', role: 'Project Manager' },
      { title: 'Real-time board updates', role: 'Full-stack Developer' },
      { title: 'Consistent design system', role: 'Designer' },
    ],
    timeline: [
      { week: 1, items: ['DB schema design', 'Auth setup', 'Board model'] },
      { week: 2, items: ['Board CRUD', 'Task CRUD', 'WebSocket setup'] },
      { week: 3, items: ['Drag-drop', 'Tags', 'Due dates'] },
    ],
    repositories: [
      { name: 'taskapp-api', url: 'https://github.com/org/taskapp-api', branch: 'main' },
      { name: 'taskapp-web', url: 'https://github.com/org/taskapp-web', branch: 'dev' },
    ],
    epics: [
      { title: 'Core Boards', description: 'Board management', subEpics: [
        { title: 'Board CRUD', stories: [
          { title: 'Create/edit boards', tasks: ['Board form', 'API endpoints', 'Board list'] },
          { title: 'Board invitations', tasks: ['Invite flow', 'Permissions', 'Notifications'] },
        ]},
        { title: 'Tasks', stories: [
          { title: 'Task management', tasks: ['Create task', 'Edit task', 'Delete task', 'Assign user'] },
        ]},
      ]},
      { title: 'Real-time', description: 'Live updates', subEpics: [
        { title: 'WebSocket sync', stories: [
          { title: 'Live board updates', tasks: ['WS connection', 'Broadcast updates', 'Optimistic UI'] },
        ]},
      ]},
    ],
    proposalText: 'SaaS task management app with Kanban boards, real-time collaboration, tags, and due dates. Teams of up to 20. Tech: Node, React, Redis, PostgreSQL.',
  },
  {
    title: 'Mobile Fitness App',
    summary: 'Track workouts, log progress, and connect with friends for accountability.',
    status: 'in_progress',
    features: ['Workout logging', 'Progress charts', 'Social feed', 'Goals', 'Rest timer'],
    roles: ['Product Lead', 'Mobile Developer', 'Backend Developer'],
    goals: [
      { title: '10k downloads by launch', role: 'Product Lead' },
      { title: '60fps animations', role: 'Mobile Developer' },
      { title: 'Sub-second API response', role: 'Backend Developer' },
    ],
    timeline: [
      { week: 1, items: ['App scaffolding', 'Auth', 'Workout model'] },
      { week: 2, items: ['Log workout UI', 'Charts', 'Profile screen'] },
      { week: 3, items: ['Social feed', 'Friends', 'Push notifications'] },
    ],
    repositories: [
      { name: 'fitapp-mobile', url: 'https://github.com/org/fitapp-mobile', branch: 'main' },
      { name: 'fitapp-api', url: 'https://github.com/org/fitapp-api', branch: 'main' },
    ],
    epics: [
      { title: 'Workouts', description: 'Log and view workouts', subEpics: [
        { title: 'Log workout', stories: [
          { title: 'Workout form', tasks: ['Exercise picker', 'Sets/reps', 'Save workout'] },
          { title: 'Workout history', tasks: ['History list', 'Workout detail', 'Edit/delete'] },
        ]},
        { title: 'Progress', stories: [
          { title: 'Progress charts', tasks: ['Chart component', 'Weight over time', 'PR highlights'] },
        ]},
      ]},
      { title: 'Social', description: 'Community features', subEpics: [
        { title: 'Feed', stories: [
          { title: 'Activity feed', tasks: ['Feed API', 'Feed UI', 'Like/comment'] },
        ]},
      ]},
    ],
    proposalText: 'Mobile fitness app (iOS/Android) for logging workouts, tracking progress, and social motivation. Native feel, offline support. React Native, Node API.',
  },
  {
    title: 'Internal HR Portal',
    summary: 'Leave requests, document storage, and approval workflows for HR teams.',
    status: 'setting_up',
    features: ['Leave requests', 'Document vault', 'Approval workflows', 'Reports', 'Employee directory'],
    roles: ['HR Manager', 'Developer', 'Admin'],
    goals: [
      { title: 'Replace legacy system', role: 'HR Manager' },
      { title: 'Automate 80% of approvals', role: 'Developer' },
      { title: 'Audit-ready reports', role: 'Admin' },
    ],
    timeline: [
      { week: 1, items: ['Requirements review', 'Schema design', 'Auth/roles'] },
      { week: 2, items: ['Leave request module', 'Approval flow', 'Email triggers'] },
      { week: 3, items: ['Document upload', 'Search', 'Reports'] },
    ],
    repositories: [
      { name: 'hr-portal', url: 'https://github.com/org/hr-portal', branch: 'main' },
    ],
    epics: [
      { title: 'Leave Management', description: 'Request and approve leave', subEpics: [
        { title: 'Leave requests', stories: [
          { title: 'Submit leave', tasks: ['Request form', 'Balance check', 'Submit API'] },
          { title: 'Approval flow', tasks: ['Approver list', 'Approve/reject', 'Notifications'] },
        ]},
        { title: 'Document storage', stories: [
          { title: 'Upload documents', tasks: ['Upload UI', 'Storage backend', 'Permissions'] },
        ]},
      ]},
    ],
    proposalText: 'Internal HR portal for leave requests, document storage, and approval workflows. Integrate with existing AD. Target: 200 employees. Node, React, S3.',
  },
  {
    title: 'Analytics Dashboard',
    summary: 'Data visualization and reporting dashboard for sales and marketing teams.',
    status: 'on_hold',
    features: ['Custom charts', 'Filters', 'Export to PDF', 'Scheduled reports', 'Dashboards'],
    roles: ['Data Analyst', 'Frontend Developer', 'DevOps'],
    goals: [
      { title: 'Support 5 data sources', role: 'Data Analyst' },
      { title: 'Sub-2s load times', role: 'Frontend Developer' },
      { title: '99.9% uptime', role: 'DevOps' },
    ],
    timeline: [
      { week: 1, items: ['Data connector framework', 'Chart library', 'Filter builder'] },
      { week: 2, items: ['Dashboard builder', 'Export', 'Caching layer'] },
    ],
    repositories: [
      { name: 'analytics-api', url: 'https://github.com/org/analytics-api', branch: 'main' },
      { name: 'analytics-dashboard', url: 'https://github.com/org/analytics-dashboard', branch: 'main' },
    ],
    epics: [
      { title: 'Charts & Filters', description: 'Visualization core', subEpics: [
        { title: 'Charts', stories: [
          { title: 'Chart components', tasks: ['Line chart', 'Bar chart', 'Pie chart', 'Config UI'] },
          { title: 'Filters', tasks: ['Date range', 'Dimension filter', 'Apply filters'] },
        ]},
        { title: 'Export', stories: [
          { title: 'PDF export', tasks: ['Export API', 'PDF generation', 'Download'] },
        ]},
      ]},
    ],
    proposalText: 'Analytics dashboard for sales and marketing. Connect to BigQuery, Snowflake, Postgres. Custom charts, filters, PDF export. React, D3, Node API.',
  },
];

async function clearSeedData() {
  console.log('Clearing seed data...');
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

    const seedUsers = await tx.user.findMany({ where: { email: { in: SEED_EMAILS } } });
    for (const u of seedUsers) {
      await tx.authtoken_token.deleteMany({ where: { user_id: BigInt(u.user_id) } });
      await tx.users_refreshtoken.deleteMany({ where: { user_id: u.user_id } });
    }
    await tx.user.deleteMany({ where: { email: { in: SEED_EMAILS } } });
  });
  console.log('Seed data cleared.');
}

async function seed() {
  await prisma.$connect();
  console.log('Connected to PostgreSQL');

  if (RESET) {
    await clearSeedData();
  }

  let pm = await prisma.user.findUnique({ where: { email: 'pm@example.com' } });
  let dev = await prisma.user.findUnique({ where: { email: 'dev@example.com' } });

  if (!pm) {
    pm = await prisma.user.create({
      data: {
        email: 'pm@example.com',
        name: 'Project Manager',
        password: PASSWORD_HASH,
        role: 'Project Manager',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        created_at: new Date(),
      },
    });
    console.log('Created user: pm@example.com');
  } else {
    console.log('User pm@example.com already exists');
  }
  if (!dev) {
    dev = await prisma.user.create({
      data: {
        email: 'dev@example.com',
        name: 'Developer',
        password: PASSWORD_HASH,
        role: 'Developer',
        is_active: true,
        is_staff: false,
        is_superuser: false,
        created_at: new Date(),
      },
    });
    console.log('Created user: dev@example.com');
  } else {
    console.log('User dev@example.com already exists');
  }

  const pmId = pm.user_id;
  const devId = dev.user_id;
  const projectIds = [];

  for (const data of PROJECTS_DATA) {
    const project = await prisma.ai_api_project.create({
      data: {
        title: data.title,
        summary: data.summary,
        status: data.status,
        created_at: new Date(),
        created_by_id: BigInt(pmId),
      },
    });
    projectIds.push(project.id);

    const pmMember = await prisma.ai_api_projectmember.create({
      data: {
        project_id: project.id,
        user_id: BigInt(pmId),
        user_name: pm.name,
        user_email: pm.email,
        role: 'Owner',
        joined_at: new Date(),
      },
    });
    const devMember = await prisma.ai_api_projectmember.create({
      data: {
        project_id: project.id,
        user_id: BigInt(devId),
        user_name: dev.name,
        user_email: dev.email,
        role: 'Member',
        joined_at: new Date(),
      },
    });

    for (const f of data.features) {
      await prisma.ai_api_projectfeature.create({ data: { project_id: project.id, title: f } });
    }
    for (const r of data.roles) {
      await prisma.ai_api_projectrole.create({ data: { project_id: project.id, role: r } });
    }
    for (const g of data.goals) {
      await prisma.ai_api_projectgoal.create({
        data: { project_id: project.id, title: g.title, role: g.role || null },
      });
    }
    for (const tw of data.timeline) {
      const weekNum = tw.weekNumber ?? tw.week ?? 1;
      const week = await prisma.ai_api_timelineweek.create({
        data: { project_id: project.id, week_number: weekNum },
      });
      for (const it of tw.items) {
        await prisma.ai_api_timelineitem.create({ data: { week_id: week.id, title: it } });
      }
    }

    for (const epicData of data.epics) {
      const epic = await prisma.ai_api_epic.create({
        data: {
          project_id: project.id,
          title: epicData.title,
          description: epicData.description || null,
          ai: true,
          is_complete: false,
        },
      });
      for (const seData of epicData.subEpics) {
        const subEpic = await prisma.ai_api_subepic.create({
          data: {
            epic_id: epic.id,
            title: seData.title,
            ai: true,
            is_complete: false,
          },
        });
        for (const storyData of seData.stories) {
          const story = await prisma.ai_api_userstory.create({
            data: {
              sub_epic_id: subEpic.id,
              title: storyData.title,
              ai: true,
              is_complete: false,
            },
          });
          const tasks = Array.isArray(storyData.tasks) ? storyData.tasks : [];
          for (let i = 0; i < tasks.length; i++) {
            const taskTitle = tasks[i];
            if (!taskTitle) continue;
            await prisma.ai_api_storytask.create({
              data: {
                user_story_id: story.id,
                title: taskTitle,
                status: i === 0 ? 'done' : 'pending',
                ai: true,
                assignee_id: i % 2 === 0 ? devMember.id : null,
              },
            });
          }
        }
      }
    }

    await prisma.ai_api_proposal.create({
      data: {
        project_id: project.id,
        file: 'proposal.pdf',
        parsed_text: data.proposalText,
        uploaded_at: new Date(),
        uploaded_by_id: BigInt(pmId),
      },
    });

    for (const repo of data.repositories || []) {
      await prisma.ai_api_repository.create({
        data: {
          project_id: project.id,
          name: repo.name,
          url: repo.url,
          branch: repo.branch,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    const room = await prisma.chat_room.create({
      data: {
        name: `Project: ${data.title}`,
        is_private: false,
        created_at: new Date(),
        created_by_id: BigInt(pmId),
      },
    });
    await prisma.chat_room_membership.createMany({
      data: [
        { room_id: room.room_id, user_id: BigInt(pmId), is_admin: true, joined_at: new Date() },
        { room_id: room.room_id, user_id: BigInt(devId), is_admin: false, joined_at: new Date() },
      ],
    });
    await prisma.chat_message.createMany({
      data: [
        { room_id: room.room_id, sender_id: BigInt(pmId), content: `Let's get ${data.title} moving. What do you think about the current plan?`, message_type: 'text', created_at: new Date(), is_deleted: false },
        { room_id: room.room_id, sender_id: BigInt(devId), content: 'Looks good. I can start on the API endpoints this week.', message_type: 'text', created_at: new Date(), is_deleted: false },
        { room_id: room.room_id, sender_id: BigInt(pmId), content: 'Great, thanks for jumping in!', message_type: 'text', created_at: new Date(), is_deleted: false },
      ],
    });

    console.log(`Seeded project: ${data.title}`);
  }

  const now = new Date();
  await prisma.ai_api_notification.createMany({
    data: [
      { recipient_id: pmId, notification_type: 'project_update', title: 'Task completed', message: 'Developer completed "Create ProductCard component" in E-commerce Platform', is_read: false, created_at: now, actor_id: devId },
      { recipient_id: pmId, notification_type: 'project_status_changed', title: 'Status update', message: 'Task Management SaaS moved to In Progress', is_read: true, read_at: now, created_at: now, actor_id: devId },
      { recipient_id: devId, notification_type: 'task_assigned', title: 'Task assigned', message: 'You were assigned to "Integrate Stripe" in E-commerce Platform', is_read: false, created_at: now, action_url: projectIds[0] ? `/projects/${projectIds[0]}/backlog` : null, actor_id: pmId },
      { recipient_id: devId, notification_type: 'mention', title: 'You were mentioned', message: 'Project Manager mentioned you in Task Management SaaS room', is_read: false, created_at: now, actor_id: pmId },
    ],
  });

  console.log('Seeded notifications');

  console.log('\nSeed complete. Login with:');
  console.log('  PM:     pm@example.com / password123');
  console.log('  Dev:    dev@example.com / password123');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
