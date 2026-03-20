import axios from 'axios';

import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';

import { connectTestDB, disconnectTestDB, truncateTestData } from '../db-helper.js';

let app;
let prisma;
let axiosPostSpy;

const overviewPayload = {
  title: 'Mocked Overview',
  summary: 'Mock summary',
  features: ['Feature A'],
  roles: ['Backend'],
  goals: [{ title: 'Ship MVP', role: 'All' }],
  timeline: [{ week_number: 1, goals: ['Milestone'] }],
};

const miniBacklog = {
  epics: [
    {
      title: 'Epic A',
      sub_epics: [
        {
          title: 'Sub A',
          user_stories: [
            {
              title: 'Story A',
              tasks: [{ title: 'Task A', status: 'pending' }],
            },
          ],
        },
      ],
    },
  ],
};

beforeAll(async () => {
  await connectTestDB();
  axiosPostSpy = jest.spyOn(axios, 'post').mockImplementation(async (url) => {
    const u = String(url);
    if (u.includes('generate-overview')) {
      return { status: 200, data: overviewPayload };
    }
    if (u.includes('generate-backlog')) {
      return { status: 200, data: miniBacklog };
    }
    return { status: 200, data: {} };
  });
  ({ default: app } = await import('../../app.js'));
  ({ prisma } = await import('../../lib/prisma.js'));
});

afterAll(async () => {
  axiosPostSpy?.mockRestore();
  await disconnectTestDB();
});

describe('API surface (integration, AI service mocked)', () => {
  let token;
  let userId;
  let projectId;
  let secondUserId;
  let secondToken;
  let secondEmail;
  let thirdUserId;
  let thirdToken;

  beforeEach(async () => {
    await truncateTestData();

    const ts = Date.now();
    const s1 = await request(app)
      .post('/api/user/signup/')
      .send({ email: `full-${ts}@example.com`, name: 'Owner User', password: 'pw' });
    token = s1.body.token;
    userId = Number(s1.body.id);

    const s2 = await request(app)
      .post('/api/user/signup/')
      .send({ email: `full2-${ts}@example.com`, name: 'Other User', password: 'pw' });
    secondToken = s2.body.token;
    secondUserId = Number(s2.body.id);
    secondEmail = s2.body.email;

    const s3 = await request(app)
      .post('/api/user/signup/')
      .send({ email: `full3-${ts}@example.com`, name: 'Third User', password: 'pw' });
    thirdToken = s3.body.token;
    thirdUserId = Number(s3.body.id);

    const cp = await request(app)
      .post('/api/ai/projects/')
      .set('Authorization', `Token ${token}`)
      .send({ title: 'Full API Project', summary: 'testing' });
    expect(cp.status).toBe(201);
    projectId = Number(cp.body.id);

    await prisma.ai_api_proposal.create({
      data: {
        project_id: projectId,
        file: 'mock.pdf',
        parsed_text: 'Proposal text for AI mock endpoints.',
        uploaded_at: new Date(),
        uploaded_by_id: BigInt(userId),
      },
    });
  });

  test('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('AI project CRUD and backlog', async () => {
    const list = await request(app)
      .get('/api/ai/projects/')
      .set('Authorization', `Token ${token}`);
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const mine = await request(app)
      .get('/api/ai/projects/my-projects/')
      .set('Authorization', `Token ${token}`);
    expect(mine.status).toBe(200);

    const g = await request(app)
      .get(`/api/ai/projects/${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(g.status).toBe(200);

    const stats = await request(app)
      .get(`/api/ai/projects/${projectId}/statistics/`)
      .set('Authorization', `Token ${token}`);
    expect(stats.status).toBe(200);
    expect(stats.body).toHaveProperty('task_count');

    const patch = await request(app)
      .patch(`/api/ai/projects/${projectId}`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'Updated Title' });
    expect(patch.status).toBe(200);

    const st = await request(app)
      .put(`/api/ai/projects/${projectId}/update-status/`)
      .set('Authorization', `Token ${token}`)
      .send({ status: 'in_progress' });
    expect(st.status).toBe(200);

    const genOv = await request(app)
      .put(`/api/ai/projects/${projectId}/generate-overview/`)
      .set('Authorization', `Token ${token}`)
      .send({});
    expect(genOv.status).toBe(200);

    const genBl = await request(app)
      .put(`/api/ai/projects/${projectId}/generate-backlog`)
      .set('Authorization', `Token ${token}`)
      .send({});
    expect(genBl.status).toBe(200);

    const backlog = await request(app)
      .get(`/api/ai/projects/${projectId}/backlog/`)
      .set('Authorization', `Token ${token}`);
    expect(backlog.status).toBe(200);
    expect(Array.isArray(backlog.body.epics)).toBe(true);

    const cur = await request(app)
      .get(`/api/ai/projects/${projectId}/current-proposal/`)
      .set('Authorization', `Token ${token}`);
    expect(cur.status).toBe(200);
  });

  test('AI features, roles, goals, timeline', async () => {
    const feat = await request(app)
      .post('/api/ai/project-features/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, title: 'F1' });
    expect(feat.status).toBe(201);

    const fl = await request(app)
      .get(`/api/ai/project-features/?project=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(fl.status).toBe(200);

    const fpatch = await request(app)
      .patch(`/api/ai/project-features/${feat.body.id}/`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'F1b' });
    expect(fpatch.status).toBe(200);

    const role = await request(app)
      .post('/api/ai/project-roles/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, role: 'QA' });
    expect(role.status).toBe(201);

    const rl = await request(app)
      .get(`/api/ai/project-roles/?project=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(rl.status).toBe(200);

    const rpatch = await request(app)
      .patch(`/api/ai/project-roles/${role.body.id}/`)
      .set('Authorization', `Token ${token}`)
      .send({ role: 'QA Lead' });
    expect(rpatch.status).toBe(200);

    const goal = await request(app)
      .post('/api/ai/project-goals/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, title: 'G1', role: 'Team' });
    expect(goal.status).toBe(201);

    const gl = await request(app)
      .get(`/api/ai/project-goals/?project=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(gl.status).toBe(200);

    const gpatch = await request(app)
      .patch(`/api/ai/project-goals/${goal.body.id}/`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'G1b' });
    expect(gpatch.status).toBe(200);

    const week = await request(app)
      .post('/api/ai/timeline-weeks/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, week_number: 2 });
    expect(week.status).toBe(201);

    const wlist = await request(app)
      .get(`/api/ai/timeline-weeks/?project_id=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(wlist.status).toBe(200);

    const pt = await request(app)
      .post('/api/ai/project-timeline/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, week_number: 3, goals: ['T1'] });
    expect(pt.status).toBe(201);

    const items = await request(app)
      .get(`/api/ai/timeline-items/?week_id=${week.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(items.status).toBe(200);
  });

  test('AI epics, stories, tasks, members, repos, invitations, notifications', async () => {
    const epic = await request(app)
      .post('/api/ai/epics/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, title: 'E2' });
    expect(epic.status).toBe(201);

    const el = await request(app)
      .get(`/api/ai/epics/?project=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(el.status).toBe(200);

    const eg = await request(app)
      .get(`/api/ai/epics/${epic.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(eg.status).toBe(200);

    const eup = await request(app)
      .patch(`/api/ai/epics/${epic.body.id}/`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'E2b' });
    expect(eup.status).toBe(200);

    const sub = await request(app)
      .post('/api/ai/sub-epics/')
      .set('Authorization', `Token ${token}`)
      .send({ epic: epic.body.id, title: 'SE1' });
    expect(sub.status).toBe(201);

    const sl = await request(app)
      .get(`/api/ai/sub-epics/?epic=${epic.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(sl.status).toBe(200);

    const sup = await request(app)
      .patch(`/api/ai/sub-epics/${sub.body.id}/`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'SE1b' });
    expect(sup.status).toBe(200);

    const story = await request(app)
      .post('/api/ai/user-stories/')
      .set('Authorization', `Token ${token}`)
      .send({ sub_epic: sub.body.id, title: 'US1' });
    expect(story.status).toBe(201);

    const ul = await request(app)
      .get(`/api/ai/user-stories/?sub_epic=${sub.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(ul.status).toBe(200);

    const uup = await request(app)
      .patch(`/api/ai/user-stories/${story.body.id}/`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'US1b' });
    expect(uup.status).toBe(200);

    const task = await request(app)
      .post('/api/ai/story-tasks/')
      .set('Authorization', `Token ${token}`)
      .send({ user_story: story.body.id, title: 'ST1' });
    expect(task.status).toBe(201);

    const tls = await request(app)
      .get(`/api/ai/story-tasks/?user_story=${story.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(tls.status).toBe(200);

    const tpatch = await request(app)
      .patch(`/api/ai/story-tasks/${task.body.id}`)
      .set('Authorization', `Token ${token}`)
      .send({ title: 'ST1b' });
    expect(tpatch.status).toBe(200);

    const members = await request(app)
      .get(`/api/ai/project-members/?project=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(members.status).toBe(200);

    const inv = await request(app)
      .post('/api/ai/invitations/')
      .set('Authorization', `Token ${token}`)
      .send({ project: String(projectId), invitee: secondUserId, role: 'Member' });
    expect(inv.status).toBe(201);

    const acc = await request(app)
      .post(`/api/ai/invitations/${inv.body.id}/accept/`)
      .set('Authorization', `Token ${secondToken}`)
      .send({});
    expect(acc.status).toBe(200);

    const addM = await request(app)
      .post('/api/ai/project-members/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, user: thirdUserId, role: 'Member' });
    expect(addM.status).toBe(201);

    const bulk = await request(app)
      .post('/api/ai/story-tasks/bulk-assign/')
      .set('Authorization', `Token ${token}`)
      .send({ task_ids: [task.body.id], assignee_id: addM.body.id });
    expect(bulk.status).toBe(200);

    const repo = await request(app)
      .post('/api/ai/repositories/')
      .set('Authorization', `Token ${token}`)
      .send({
        project: projectId,
        name: 'main-repo',
        url: 'https://example.com/r.git',
        branch: 'main',
      });
    expect(repo.status).toBe(201);

    const rlist = await request(app)
      .get(`/api/ai/repositories/?project_id=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(rlist.status).toBe(200);

    const il = await request(app)
      .get(`/api/ai/invitations/?project_id=${projectId}`)
      .set('Authorization', `Token ${token}`);
    expect(il.status).toBe(200);

    const myi = await request(app)
      .get('/api/ai/invitations/my-invitations/')
      .set('Authorization', `Token ${thirdToken}`);
    expect(myi.status).toBe(200);

    const n = await prisma.ai_api_notification.create({
      data: {
        recipient_id: userId,
        notification_type: 'test',
        title: 'T',
        message: 'M',
        is_read: false,
        created_at: new Date(),
      },
    });

    const nlist = await request(app)
      .get('/api/ai/notifications/')
      .set('Authorization', `Token ${token}`);
    expect(nlist.status).toBe(200);

    const nuc = await request(app)
      .get('/api/ai/notifications/unread_count/')
      .set('Authorization', `Token ${token}`);
    expect(nuc.status).toBe(200);

    const nread = await request(app)
      .post(`/api/ai/notifications/${Number(n.id)}/mark_read/`)
      .set('Authorization', `Token ${token}`)
      .send({});
    expect(nread.status).toBe(200);

    const mar = await request(app)
      .post('/api/ai/notifications/mark_all_read/')
      .set('Authorization', `Token ${token}`)
      .send({});
    expect(mar.status).toBe(200);

    const recent = await request(app)
      .get('/api/ai/story-tasks/recent-completed/')
      .set('Authorization', `Token ${token}`);
    expect(recent.status).toBe(200);

    const assigned = await request(app)
      .get('/api/ai/story-tasks/user-assigned/')
      .set('Authorization', `Token ${token}`);
    expect(assigned.status).toBe(200);
  });

  test('AI decline invitation and delete project', async () => {
    const inv = await request(app)
      .post('/api/ai/invitations/')
      .set('Authorization', `Token ${token}`)
      .send({ project: String(projectId), invitee: thirdUserId, role: 'Member' });
    expect(inv.status).toBe(201);

    const dec = await request(app)
      .post(`/api/ai/invitations/${inv.body.id}/decline/`)
      .set('Authorization', `Token ${thirdToken}`)
      .send({});
    expect(dec.status).toBe(200);

    const extra = await request(app)
      .post('/api/ai/projects/')
      .set('Authorization', `Token ${token}`)
      .send({ title: 'To Delete', summary: 'x' });
    expect(extra.status).toBe(201);
    const delP = await request(app)
      .delete(`/api/ai/projects/${extra.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(delP.status).toBe(204);
  });

  test('AI deletes and proposal upload', async () => {
    const epic = await request(app)
      .post('/api/ai/epics/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, title: 'Del Epic' });
    const sub = await request(app)
      .post('/api/ai/sub-epics/')
      .set('Authorization', `Token ${token}`)
      .send({ epic: epic.body.id, title: 'Del Sub' });
    const story = await request(app)
      .post('/api/ai/user-stories/')
      .set('Authorization', `Token ${token}`)
      .send({ sub_epic: sub.body.id, title: 'Del Story' });
    const task = await request(app)
      .post('/api/ai/story-tasks/')
      .set('Authorization', `Token ${token}`)
      .send({ user_story: story.body.id, title: 'Del Task' });

    const td = await request(app)
      .delete(`/api/ai/story-tasks/${task.body.id}/`)
      .set('Authorization', `Token ${token}`);
    expect(td.status).toBe(200);

    const udel = await request(app)
      .delete(`/api/ai/user-stories/${story.body.id}/`)
      .set('Authorization', `Token ${token}`);
    expect(udel.status).toBe(200);

    const sdel = await request(app)
      .delete(`/api/ai/sub-epics/${sub.body.id}/`)
      .set('Authorization', `Token ${token}`);
    expect(sdel.status).toBe(200);

    const edel = await request(app)
      .delete(`/api/ai/epics/${epic.body.id}`)
      .set('Authorization', `Token ${token}`);
    expect(edel.status).toBe(200);

    const feat = await request(app)
      .post('/api/ai/project-features/')
      .set('Authorization', `Token ${token}`)
      .send({ project: projectId, title: 'X' });
    await request(app)
      .delete(`/api/ai/project-features/${feat.body.id}/`)
      .set('Authorization', `Token ${token}`);

    const buf = Buffer.from('%PDF-1.4 mock');
    const up = await request(app)
      .post('/api/ai/proposals/')
      .set('Authorization', `Token ${token}`)
      .field('project_id', String(projectId))
      .attach('file', buf, 'doc.pdf');
    if (up.status === 201) {
      expect(up.body).toHaveProperty('proposal_id');
      expect(up.body).toHaveProperty('parsed_text_preview');
      expect(up.body.project_id).toBe(String(projectId));
    } else {
      expect(up.status).toBe(500);
      expect(String(up.body?.error || '')).toMatch(/PDF parsing failed/i);
    }
  });

  test('user routes not covered elsewhere: list users, delete account path', async () => {
    const list = await request(app).get('/api/user/').set('Authorization', `Token ${token}`);
    expect(list.status).toBe(200);

    const tmp = await request(app)
      .post('/api/user/signup/')
      .send({ email: `delme-${Date.now()}@example.com`, name: 'Del', password: 'pw' });
    const del = await request(app)
      .delete('/api/user/delete/')
      .set('Authorization', `Token ${tmp.body.token}`)
      .send({ email: tmp.body.email, password: 'pw' });
    expect(del.status).toBe(200);
  });

  test('chat: room detail, members, direct room, delete room', async () => {
    const cr = await request(app)
      .post('/api/chat/rooms/')
      .set('Authorization', `Token ${token}`)
      .send({ name: 'Detail Room', is_private: false });
    const roomId = cr.body.room_id || cr.body.id;

    const gr = await request(app)
      .get(`/api/chat/rooms/${roomId}/`)
      .set('Authorization', `Token ${token}`);
    expect(gr.status).toBe(200);

    const mem = await request(app)
      .get(`/api/chat/rooms/${roomId}/members/`)
      .set('Authorization', `Token ${token}`);
    expect(mem.status).toBe(200);

    const drOk = await request(app)
      .post('/api/chat/rooms/direct/')
      .set('Authorization', `Token ${token}`)
      .send({ email: secondEmail });
    expect(drOk.status).toBe(201);

    const rm = await request(app)
      .delete(`/api/chat/rooms/${roomId}/`)
      .set('Authorization', `Token ${token}`);
    expect(rm.status).toBe(204);
  });
});
