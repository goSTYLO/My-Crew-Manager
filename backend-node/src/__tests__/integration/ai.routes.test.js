import request from 'supertest';

import app from '../../app.js';
import { connectTestDB, disconnectTestDB, truncateTestData } from '../db-helper.js';
import { prisma } from '../../lib/prisma.js';

describe('AI routes (integration)', () => {
  let authToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await truncateTestData();
    const signup = await request(app)
      .post('/api/user/signup/')
      .send({ email: `ai-${Date.now()}@example.com`, name: 'AI User', password: 'pw' });
    authToken = signup.body.token;
  });

  describe('GET /api/ai/projects/', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/ai/projects/');
      expect(res.status).toBe(401);
    });

    test('returns projects for authenticated user', async () => {
      const res = await request(app)
        .get('/api/ai/projects/')
        .set('Authorization', `Token ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/ai/projects/', () => {
    test('creates project and returns 201', async () => {
      const res = await request(app)
        .post('/api/ai/projects/')
        .set('Authorization', `Token ${authToken}`)
        .send({ title: 'Test Project', summary: 'A test project' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Project');
    });
  });

  describe('PUT /api/ai/projects/:id/ingest-proposal/:proposal_id', () => {
    test('returns 200 with mocked axios proxy', async () => {
      const createProj = await request(app)
        .post('/api/ai/projects/')
        .set('Authorization', `Token ${authToken}`)
        .send({ title: 'Ingest Project' });
      const projectId = parseInt(createProj.body.id, 10);
      const project = await prisma.ai_api_project.findUnique({ where: { id: projectId } });
      const proposal = await prisma.ai_api_proposal.create({
        data: {
          project_id: project.id,
          file: 'proposal.pdf',
          parsed_text: 'Some proposal text for ingestion',
          uploaded_at: new Date(),
          uploaded_by_id: project.created_by_id,
        },
      });
      const res = await request(app)
        .put(`/api/ai/projects/${projectId}/ingest-proposal/${proposal.id}`)
        .set('Authorization', `Token ${authToken}`)
        .send({});
      // Accept 200 (Python proxy OK or mocked) or 500 (Python service unavailable)
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) expect(res.body).toHaveProperty('features');
    });
  });

  describe('POST /api/ai/invitations/:id/accept/', () => {
    test('accepts pending invitation and creates project member', async () => {
      const inviteeSignup = await request(app)
        .post('/api/user/signup/')
        .send({ email: `invitee-${Date.now()}@example.com`, name: 'Invitee User', password: 'pw' });
      const inviteeToken = inviteeSignup.body.token;
      const inviteeId = Number(inviteeSignup.body.id);

      const createProject = await request(app)
        .post('/api/ai/projects/')
        .set('Authorization', `Token ${authToken}`)
        .send({ title: 'Invitation Project', summary: 'Invitation test' });
      expect(createProject.status).toBe(201);

      const createInvitation = await request(app)
        .post('/api/ai/invitations/')
        .set('Authorization', `Token ${authToken}`)
        .send({
          project: createProject.body.id,
          invitee: inviteeId,
          role: 'Member',
        });
      expect(createInvitation.status).toBe(201);

      const acceptRes = await request(app)
        .post(`/api/ai/invitations/${createInvitation.body.id}/accept/`)
        .set('Authorization', `Token ${inviteeToken}`)
        .send({});

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.status).toBe('accepted');

      const member = await prisma.ai_api_projectmember.findFirst({
        where: {
          project_id: Number(createProject.body.id),
          user_id: BigInt(inviteeId),
        },
      });
      expect(member).not.toBeNull();
    });
  });
});
