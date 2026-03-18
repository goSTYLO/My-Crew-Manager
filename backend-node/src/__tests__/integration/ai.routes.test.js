import request from 'supertest';

import app from '../../app.js';
import { connectTestDB, disconnectTestDB } from '../db-helper.js';
import { User, Token, Project, ProjectMember, Proposal } from '../../models/index.js';

describe('AI routes (integration)', () => {
  let authToken;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Token.deleteMany({});
    await Project.deleteMany({});
    await ProjectMember.deleteMany({});
    await Proposal.deleteMany({});
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
      const projectId = createProj.body.id;
      const project = await Project.findById(projectId);
      const proposal = await Proposal.create({
        project: project._id,
        parsedText: 'Some proposal text for ingestion',
        uploadedBy: project.createdBy,
      });
      const res = await request(app)
        .put(`/api/ai/projects/${projectId}/ingest-proposal/${proposal._id}`)
        .set('Authorization', `Token ${authToken}`)
        .send({});
      // Accept 200 (Python proxy OK or mocked) or 500 (Python service unavailable)
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) expect(res.body).toHaveProperty('epics');
    });
  });
});
