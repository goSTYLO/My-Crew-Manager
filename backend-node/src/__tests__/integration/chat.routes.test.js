import request from 'supertest';

import app from '../../app.js';
import { connectTestDB, disconnectTestDB, truncateTestData } from '../db-helper.js';

describe('Chat routes (integration)', () => {
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
      .send({ email: `chat-${Date.now()}@example.com`, name: 'Chat User', password: 'pw' });
    authToken = signup.body.token;
  });

  describe('GET /api/chat/rooms/', () => {
    test('returns 401 without auth', async () => {
      const res = await request(app).get('/api/chat/rooms/');
      expect(res.status).toBe(401);
    });

    test('returns rooms for authenticated user', async () => {
      const res = await request(app)
        .get('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/chat/rooms/unread-count(/)', () => {
    test('supports unread-count with trailing slash', async () => {
      const res = await request(app)
        .get('/api/chat/rooms/unread-count/')
        .set('Authorization', `Token ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('unread_count');
    });

    test('supports unread-count without trailing slash', async () => {
      const res = await request(app)
        .get('/api/chat/rooms/unread-count')
        .set('Authorization', `Token ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('unread_count');
    });
  });

  describe('POST /api/chat/rooms/', () => {
    test('creates room and returns 201', async () => {
      const res = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Test Room', is_private: true });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('room_id');
      expect(res.body.name).toBe('Test Room');
    });
  });

  describe('POST /api/chat/rooms/:room_pk/messages/', () => {
    test('creates message and returns 201', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Message Room' });
      const roomId = createRoom.body.room_id || createRoom.body.id;
      const res = await request(app)
        .post(`/api/chat/rooms/${roomId}/messages/`)
        .set('Authorization', `Token ${authToken}`)
        .send({ content: 'Hello world' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message_id');
      expect(res.body.content).toBe('Hello world');
    });
  });
});
