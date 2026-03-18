/**
 * One-time migration: PostgreSQL (Django) -> MongoDB
 * Run: node scripts/migrate.js
 * Requires: DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT in env (from root .env)
 * Requires: MONGODB_URI in env
 */
import pg from 'pg';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const {
  DB_NAME = 'mycrewmanager_db',
  DB_USER = 'postgres',
  DB_PASSWORD,
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  MONGODB_URI = 'mongodb://localhost:27017/my_crew_manager',
} = process.env;

if (!DB_PASSWORD) {
  console.error('DB_PASSWORD required');
  process.exit(1);
}

const pgPool = new pg.Pool({
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
});

const idMap = { user: {}, project: {}, room: {}, epic: {}, subEpic: {}, userStory: {}, storyTask: {}, projectMember: {} };

async function migrate() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;

  // 1. Users
  const userRows = await pgPool.query('SELECT user_id, email, name, password, role, is_active, is_staff, profile_picture, email_verified_at, two_factor_enabled, two_factor_secret, created_at FROM "user"');
  const usersCol = db.collection('users');
  for (const r of userRows.rows) {
    const doc = {
      email: r.email,
      name: r.name,
      password: r.password,
      role: r.role,
      isActive: r.is_active ?? true,
      isStaff: r.is_staff ?? false,
      profilePicture: r.profile_picture,
      emailVerifiedAt: r.email_verified_at,
      twoFactorEnabled: r.two_factor_enabled ?? false,
      twoFactorSecret: r.two_factor_secret,
      createdAt: r.created_at,
      updatedAt: r.created_at,
    };
    const inserted = await usersCol.insertOne(doc);
    idMap.user[r.user_id] = inserted.insertedId;
  }
  console.log(`Migrated ${userRows.rows.length} users`);

  // 2. Tokens
  const tokenRows = await pgPool.query('SELECT key, user_id FROM authtoken_token');
  const tokensCol = db.collection('tokens');
  for (const r of tokenRows.rows) {
    const userId = idMap.user[r.user_id];
    if (userId) {
      await tokensCol.insertOne({ user: userId, key: r.key, createdAt: new Date(), updatedAt: new Date() });
    }
  }
  console.log(`Migrated ${tokenRows.rows.length} tokens`);

  // 3. Projects
  const projectRows = await pgPool.query('SELECT id, title, summary, status, status_updated_at, status_updated_by_id, created_by_id, created_at, updated_at FROM ai_api_project');
  const projectsCol = db.collection('projects');
  for (const r of projectRows.rows) {
    const doc = {
      title: r.title,
      summary: r.summary,
      status: r.status || 'in_progress',
      statusUpdatedAt: r.status_updated_at,
      statusUpdatedBy: r.status_updated_by_id ? idMap.user[r.status_updated_by_id] : null,
      createdBy: idMap.user[r.created_by_id],
      features: [],
      roles: [],
      goals: [],
      timeline: [],
      repositories: [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
    const inserted = await projectsCol.insertOne(doc);
    idMap.project[r.id] = inserted.insertedId;
  }
  console.log(`Migrated ${projectRows.rows.length} projects`);

  // 4. Project members
  const pmRows = await pgPool.query('SELECT id, project_id, user_id, user_name, user_email, role, joined_at FROM ai_api_projectmember');
  const pmCol = db.collection('project_members');
  for (const r of pmRows.rows) {
    const projectId = idMap.project[r.project_id];
    const userId = idMap.user[r.user_id];
    if (projectId && userId) {
      const inserted = await pmCol.insertOne({
        project: projectId,
        user: userId,
        userName: r.user_name || 'Unknown',
        userEmail: r.user_email || 'unknown@example.com',
        role: r.role || 'Member',
        createdAt: r.joined_at,
        updatedAt: r.joined_at,
      });
      idMap.projectMember[r.id] = inserted.insertedId;
    }
  }
  console.log(`Migrated ${pmRows.rows.length} project members`);

  // 5. Epics
  const epicRows = await pgPool.query('SELECT id, project_id, title, description, ai, is_complete FROM ai_api_epic');
  const epicsCol = db.collection('epics');
  for (const r of epicRows.rows) {
    const projectId = idMap.project[r.project_id];
    if (projectId) {
      const inserted = await epicsCol.insertOne({
        project: projectId,
        title: r.title,
        description: r.description,
        ai: r.ai ?? true,
        isComplete: r.is_complete ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      idMap.epic[r.id] = inserted.insertedId;
    }
  }
  console.log(`Migrated ${epicRows.rows.length} epics`);

  // 6. Sub Epics
  const subEpicRows = await pgPool.query('SELECT id, epic_id, title, ai, is_complete FROM ai_api_subepic');
  const subEpicsCol = db.collection('sub_epics');
  for (const r of subEpicRows.rows) {
    const epicId = idMap.epic[r.epic_id];
    if (epicId) {
      const inserted = await subEpicsCol.insertOne({
        epic: epicId,
        title: r.title,
        ai: r.ai ?? true,
        isComplete: r.is_complete ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      idMap.subEpic[r.id] = inserted.insertedId;
    }
  }
  console.log(`Migrated ${subEpicRows.rows.length} sub-epics`);

  // 7. User Stories
  const usRows = await pgPool.query('SELECT id, sub_epic_id, title, ai, is_complete FROM ai_api_userstory');
  const usCol = db.collection('user_stories');
  for (const r of usRows.rows) {
    const subEpicId = idMap.subEpic[r.sub_epic_id];
    if (subEpicId) {
      const inserted = await usCol.insertOne({
        subEpic: subEpicId,
        title: r.title,
        ai: r.ai ?? true,
        isComplete: r.is_complete ?? false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      idMap.userStory[r.id] = inserted.insertedId;
    }
  }
  console.log(`Migrated ${usRows.rows.length} user stories`);

  // 8. Story Tasks
  const stRows = await pgPool.query('SELECT id, user_story_id, title, status, ai, assignee_id, commit_title, commit_branch, due_date, created_at, updated_at FROM ai_api_storytask');
  const stCol = db.collection('story_tasks');
  for (const r of stRows.rows) {
    const userStoryId = idMap.userStory[r.user_story_id];
    const assigneeId = r.assignee_id ? idMap.projectMember[r.assignee_id] : null;
    if (userStoryId) {
      await stCol.insertOne({
        userStory: userStoryId,
        title: r.title,
        status: r.status || 'pending',
        ai: r.ai ?? true,
        assignee: assigneeId,
        commitTitle: r.commit_title,
        commitBranch: r.commit_branch,
        dueDate: r.due_date,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }
  }
  console.log(`Migrated ${stRows.rows.length} story tasks`);

  // 9. Rooms
  const roomRows = await pgPool.query('SELECT room_id, name, is_private, created_by_id, created_at FROM chat_room');
  const roomsCol = db.collection('rooms');
  for (const r of roomRows.rows) {
    const createdById = idMap.user[r.created_by_id];
    if (createdById) {
      const inserted = await roomsCol.insertOne({
        roomId: r.room_id,
        name: r.name,
        isPrivate: r.is_private ?? true,
        createdBy: createdById,
        memberships: [],
        createdAt: r.created_at,
        updatedAt: r.created_at,
      });
      idMap.room[r.room_id] = inserted.insertedId;
    }
  }
  console.log(`Migrated ${roomRows.rows.length} rooms`);

  // 10. Room memberships
  const rmRows = await pgPool.query('SELECT room_id, user_id, is_admin, joined_at FROM chat_room_membership');
  for (const r of rmRows.rows) {
    const roomId = idMap.room[r.room_id];
    const userId = idMap.user[r.user_id];
    if (roomId && userId) {
      await roomsCol.updateOne(
        { _id: roomId },
        { $push: { memberships: { user: userId, isAdmin: r.is_admin ?? false, createdAt: r.joined_at } } }
      );
    }
  }
  console.log(`Migrated ${rmRows.rows.length} room memberships`);

  // 11. Messages
  const msgRows = await pgPool.query('SELECT message_id, room_id, sender_id, content, created_at, edited_at, is_deleted, message_type, reply_to_id FROM chat_message');
  const messagesCol = db.collection('messages');
  for (const r of msgRows.rows) {
    const roomId = idMap.room[r.room_id];
    const senderId = idMap.user[r.sender_id];
    if (roomId && senderId) {
      await messagesCol.insertOne({
        room: roomId,
        sender: senderId,
        content: r.content,
        editedAt: r.edited_at,
        isDeleted: r.is_deleted ?? false,
        messageType: r.message_type || 'text',
        replyTo: null,
        createdAt: r.created_at,
        updatedAt: r.created_at,
      });
    }
  }
  console.log(`Migrated ${msgRows.rows.length} messages`);

  // 12. Proposals
  const propRows = await pgPool.query('SELECT id, project_id, file, parsed_text, uploaded_by_id, uploaded_at FROM ai_api_proposal');
  const proposalsCol = db.collection('proposals');
  for (const r of propRows.rows) {
    const projectId = idMap.project[r.project_id];
    if (projectId) {
      await proposalsCol.insertOne({
        project: projectId,
        file: r.file,
        parsedText: r.parsed_text,
        uploadedBy: r.uploaded_by_id ? idMap.user[r.uploaded_by_id] : null,
        createdAt: r.uploaded_at,
        updatedAt: r.uploaded_at,
      });
    }
  }
  console.log(`Migrated ${propRows.rows.length} proposals`);

  // 13. Invitations
  const invRows = await pgPool.query('SELECT id, project_id, invitee_id, invited_by_id, status, role, message, created_at, updated_at FROM ai_api_projectinvitation');
  const invCol = db.collection('project_invitations');
  for (const r of invRows.rows) {
    const projectId = idMap.project[r.project_id];
    const inviteeId = idMap.user[r.invitee_id];
    const invitedById = idMap.user[r.invited_by_id];
    if (projectId && inviteeId && invitedById) {
      await invCol.insertOne({
        project: projectId,
        invitee: inviteeId,
        invitedBy: invitedById,
        status: r.status || 'pending',
        role: r.role || 'Member',
        message: r.message || '',
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      });
    }
  }
  console.log(`Migrated ${invRows.rows.length} invitations`);

  // 14. Notifications
  const notifRows = await pgPool.query('SELECT id, recipient_id, notification_type, title, message, is_read, read_at, created_at, action_url, actor_id FROM ai_api_notification');
  const notifCol = db.collection('notifications');
  for (const r of notifRows.rows) {
    const recipientId = idMap.user[r.recipient_id];
    if (recipientId) {
      await notifCol.insertOne({
        recipient: recipientId,
        notificationType: r.notification_type,
        title: r.title,
        message: r.message,
        isRead: r.is_read ?? false,
        readAt: r.read_at,
        actionUrl: r.action_url,
        actor: r.actor_id ? idMap.user[r.actor_id] : null,
        createdAt: r.created_at,
        updatedAt: r.created_at,
      });
    }
  }
  console.log(`Migrated ${notifRows.rows.length} notifications`);

  // 15. Refresh tokens, Email verifications, TwoFactorTempToken - optional
  try {
    const rtRows = await pgPool.query('SELECT user_id, token, expires_at, remember_me, ip_address FROM users_refreshtoken');
    const rtCol = db.collection('refresh_tokens');
    for (const r of rtRows.rows) {
      const userId = idMap.user[r.user_id];
      if (userId) {
        await rtCol.insertOne({
          user: userId,
          token: r.token,
          expiresAt: r.expires_at,
          rememberMe: r.remember_me ?? false,
          ipAddress: r.ip_address,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }
    console.log(`Migrated ${rtRows.rows.length} refresh tokens`);
  } catch (e) {
    console.log('Refresh tokens table not found or error:', e.message);
  }

  console.log('Migration complete.');
  await pgPool.end();
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
