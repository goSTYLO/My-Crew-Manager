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

  describe('DELETE /api/chat/rooms/:room_pk/messages/:pk(/)', () => {
    test('supports delete with trailing slash', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Delete Room' });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const createMessage = await request(app)
        .post(`/api/chat/rooms/${roomId}/messages/`)
        .set('Authorization', `Token ${authToken}`)
        .send({ content: 'to delete' });

      const messageId = createMessage.body.message_id;
      const res = await request(app)
        .delete(`/api/chat/rooms/${roomId}/messages/${messageId}/`)
        .set('Authorization', `Token ${authToken}`);

      expect(res.status).toBe(204);
    });

    test('returns 400 for invalid oversized message id', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Delete Guard Room' });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const res = await request(app)
        .delete(`/api/chat/rooms/${roomId}/messages/1774001715505/`)
        .set('Authorization', `Token ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.detail).toBe('Invalid message id');
    });
  });

  describe('Room management compatibility endpoints', () => {
    test('POST /api/chat/rooms/:id/invite/ adds user to group room', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Invite Flow Room', is_private: false });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const inviteeEmail = `invitee-${Date.now()}@example.com`;
      const inviteeSignup = await request(app)
        .post('/api/user/signup/')
        .send({ email: inviteeEmail, name: 'Invitee User', password: 'pw' });
      const inviteeToken = inviteeSignup.body.token;

      const inviteRes = await request(app)
        .post(`/api/chat/rooms/${roomId}/invite/`)
        .set('Authorization', `Token ${authToken}`)
        .send({ email: inviteeEmail });

      expect(inviteRes.status).toBe(200);

      const invitedUserRoomAccess = await request(app)
        .get(`/api/chat/rooms/${roomId}/`)
        .set('Authorization', `Token ${inviteeToken}`);

      expect(invitedUserRoomAccess.status).toBe(200);
      expect(String(invitedUserRoomAccess.body.room_id || invitedUserRoomAccess.body.id)).toBe(String(roomId));
    });

    test('PATCH /api/chat/rooms/:id/ updates room name', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Original Name', is_private: false });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const res = await request(app)
        .patch(`/api/chat/rooms/${roomId}/`)
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });

    test('POST /api/chat/rooms/:id/mark_read/ returns total_unread_count', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Read Marker', is_private: false });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const res = await request(app)
        .post(`/api/chat/rooms/${roomId}/mark_read/`)
        .set('Authorization', `Token ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total_unread_count');
      expect(typeof res.body.total_unread_count).toBe('number');
    });

    test('POST /api/chat/rooms/:id/nickname/ returns compatibility success', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Nickname Room', is_private: false });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const res = await request(app)
        .post(`/api/chat/rooms/${roomId}/nickname/`)
        .set('Authorization', `Token ${authToken}`)
        .send({ nickname: 'Ace' });

      expect(res.status).toBe(200);
      expect(res.body.detail).toBe('Nickname updated successfully');
    });

    test('POST /api/chat/rooms/:id/leave/ removes user membership', async () => {
      const createRoom = await request(app)
        .post('/api/chat/rooms/')
        .set('Authorization', `Token ${authToken}`)
        .send({ name: 'Leave Room', is_private: false });
      const roomId = createRoom.body.room_id || createRoom.body.id;

      const leave = await request(app)
        .post(`/api/chat/rooms/${roomId}/leave/`)
        .set('Authorization', `Token ${authToken}`)
        .send({});

      expect(leave.status).toBe(200);
      expect(leave.body.detail).toBe('Left room successfully');

      const roomAccessAfterLeave = await request(app)
        .get(`/api/chat/rooms/${roomId}`)
        .set('Authorization', `Token ${authToken}`);

      expect([403, 404]).toContain(roomAccessAfterLeave.status);
    });
  });
});
