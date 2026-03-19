import http from 'http';
import express from 'express';
import { setupRealtimeServer } from '@/realtime/index.js';

describe('realtime setup', () => {
  test('attaches websocket upgrade handler', () => {
    const app = express();
    const server = http.createServer(app);

    const before = server.listeners('upgrade').length;
    const wss = setupRealtimeServer(server);
    const after = server.listeners('upgrade').length;

    expect(wss).toBeDefined();
    expect(after).toBeGreaterThan(before);
  });
});
