import { broadcast } from '../services/broadcast.service.js';
import { WS_EVENTS } from './contracts/events.js';

export function sendJson(ws, payload) {
  if (!ws || ws.readyState !== 1) return;
  ws.send(JSON.stringify(payload));
}

export function broadcastToRoom(roomName, payload) {
  broadcast(roomName, payload);
}

export function sendAuthExpiredAndClose(ws, reason = 'Authentication token expired') {
  sendJson(ws, {
    type: WS_EVENTS.AUTH_EXPIRED,
    error: reason,
    detail: reason,
    message: reason,
  });

  if (ws && ws.readyState === 1) {
    ws.close(4001, 'auth_expired');
  }
}
