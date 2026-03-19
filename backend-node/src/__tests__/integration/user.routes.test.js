import request from 'supertest';
import jwt from 'jsonwebtoken';

import app from '../../app.js';
import { connectTestDB, disconnectTestDB, truncateTestData } from '../db-helper.js';

jest.mock('nodemailer');

describe('User routes (integration)', () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await truncateTestData();
  });

  describe('POST /api/user/signup/', () => {
    test('creates user and returns token', async () => {
      const res = await request(app)
        .post('/api/user/signup/')
        .send({ email: 'test@example.com', name: 'Test User', password: 'password123' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.name).toBe('Test User');
    });

    test('rejects duplicate email', async () => {
      await request(app)
        .post('/api/user/signup/')
        .send({ email: 'dup@example.com', name: 'First', password: 'pass' });
      const res = await request(app)
        .post('/api/user/signup/')
        .send({ email: 'dup@example.com', name: 'Second', password: 'pass' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/user/login/', () => {
    test('returns token and access for valid credentials', async () => {
      await request(app)
        .post('/api/user/signup/')
        .send({ email: 'login@example.com', name: 'Login', password: 'secret' });
      const res = await request(app)
        .post('/api/user/login/')
        .send({ email: 'login@example.com', password: 'secret' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('access');
      expect(res.body.access).toBe(res.body.token);
      expect(res.body.email).toBe('login@example.com');
    });

    test('returns 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/user/signup/')
        .send({ email: 'x@x.com', name: 'X', password: 'p' });
      const res = await request(app)
        .post('/api/user/login/')
        .send({ email: 'x@x.com', password: 'wrong' });
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('detail');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('GET /api/user/me/', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/user/me/');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('detail');
      expect(res.body).toHaveProperty('message');
    });

    test('returns normalized auth error for malformed header', async () => {
      const res = await request(app)
        .get('/api/user/me/')
        .set('Authorization', 'InvalidFormat');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('detail');
      expect(res.body).toHaveProperty('message');
    });

    test('returns user with valid token', async () => {
      const signup = await request(app)
        .post('/api/user/signup/')
        .send({ email: 'me@example.com', name: 'Me', password: 'pw' });
      const token = signup.body.token;
      const res = await request(app)
        .get('/api/user/me/')
        .set('Authorization', `Token ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('me@example.com');
    });

    test('returns user with valid bearer token', async () => {
      const signup = await request(app)
        .post('/api/user/signup/')
        .send({ email: 'bearer@example.com', name: 'Bearer User', password: 'pw' });

      const signed = jwt.sign(
        { userId: Number(signup.body.id) },
        process.env.JWT_SECRET || process.env.SECRET_KEY || 'test-secret-key'
      );

      const res = await request(app)
        .get('/api/user/me/')
        .set('Authorization', `Bearer ${signed}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('bearer@example.com');
    });
  });

  describe('POST /api/user/refresh-token/', () => {
    test('returns 401 without cookie', async () => {
      const res = await request(app).post('/api/user/refresh-token/');
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('detail');
      expect(res.body).toHaveProperty('message');
    });

    test('returns token with valid refresh cookie', async () => {
      const email = `refresh-${Date.now()}@example.com`;
      await request(app).post('/api/user/signup/').send({ email, name: 'R', password: 'pw' });
      const login = await request(app)
        .post('/api/user/login/')
        .send({ email, password: 'pw', remember_me: true });
      const cookies = login.headers['set-cookie'];
      const res = await request(app)
        .post('/api/user/refresh-token/')
        .set('Cookie', cookies || []);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('access');
      expect(res.body.access).toBe(res.body.token);
    });
  });

  describe('POST /api/user/email/request/', () => {
    test('returns 204 with valid email (nodemailer mocked)', async () => {
      const res = await request(app)
        .post('/api/user/email/request/')
        .send({ email: 'verify@example.com' });
      expect(res.status).toBe(204);
    });
  });

  describe('Error envelope contract', () => {
    test('email verify invalid request returns error/detail/message', async () => {
      const res = await request(app)
        .post('/api/user/email/verify/')
        .send({ email: 'missing@example.com', code: '123456' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('detail');
      expect(res.body).toHaveProperty('message');
    });
  });

  describe('2FA endpoints when DISABLE_2FA=true', () => {
    test('GET /api/user/2fa/status/ returns 503', async () => {
      const signup = await request(app)
        .post('/api/user/signup/')
        .send({ email: '2fa@example.com', name: '2FA', password: 'pw' });
      const res = await request(app)
        .get('/api/user/2fa/status/')
        .set('Authorization', `Token ${signup.body.token}`);
      expect(res.status).toBe(503);
      expect(res.body.error).toBe('2FA is disabled');
    });

    test('POST /api/user/2fa/enable/ returns 503', async () => {
      const signup = await request(app)
        .post('/api/user/signup/')
        .send({ email: '2fa2@example.com', name: '2FA2', password: 'pw' });
      const res = await request(app)
        .post('/api/user/2fa/enable/')
        .set('Authorization', `Token ${signup.body.token}`);
      expect(res.status).toBe(503);
    });
  });
});
