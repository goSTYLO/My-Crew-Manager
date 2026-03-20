import { createServer } from 'http';

import WebSocket from 'ws';
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';

import { setupRealtimeServer } from '../../realtime/index.js';
import { connectTestDB, disconnectTestDB, truncateTestData } from '../db-helper.js';

let app;
let server;
let port;

beforeAll(async () => {
  await connectTestDB();
  const mod = await import('../../app.js');
  app = mod.default;
  server = createServer(app);
  setupRealtimeServer(server);
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve());
    server.on('error', reject);
  });
  port = server.address().port;
});

afterAll(async () => {
  await new Promise((resolve) => {
    server.close(() => resolve());
  });
  await disconnectTestDB();
});

beforeEach(async () => {
  await truncateTestData();
});

describe('WebSocket realtime', () => {
  test('project-updates: Token query authenticates and sends connected', async () => {
    const signup = await request(app)
      .post('/api/user/signup/')
      .send({ email: `ws-pu-${Date.now()}@example.com`, name: 'WS', password: 'TestPass123!' });
    expect(signup.status).toBe(201);
    const token = signup.body.token;
    const userId = signup.body.id;

    const msg = await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/project-updates/?token=${encodeURIComponent(token)}`);
      const timer = setTimeout(() => {
        ws.terminate();
        reject(new Error('WebSocket message timeout'));
      }, 8000);

      ws.on('message', (data) => {
        clearTimeout(timer);
        try {
          resolve(JSON.parse(data.toString()));
        } catch (e) {
          reject(e);
        } finally {
          ws.close();
        }
      });
      ws.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    expect(msg.type).toBe('connected');
    expect(msg.user_id).toBe(String(userId));
  });

  test('project-updates: missing token rejects upgrade with 401', async () => {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws/project-updates/`);
      let settled = false;

      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          ws.terminate();
          reject(new Error('expected 401 on upgrade within timeout'));
        }
      }, 8000);

      ws.on('open', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        ws.terminate();
        reject(new Error('should not open without token'));
      });

      ws.on('unexpected-response', (_req, res) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          expect(res.statusCode).toBe(401);
          resolve();
        } catch (e) {
          reject(e);
        } finally {
          ws.terminate();
        }
      });

      ws.on('error', () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        ws.terminate();
        reject(new Error('WebSocket error without unexpected-response (expected 401 upgrade)'));
      });
    });
  });
});
