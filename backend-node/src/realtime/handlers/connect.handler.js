import { WS_EVENTS } from '../contracts/events.js';
import { addSocketToRoom } from '../rooms/room-registry.js';
import { sendJson } from '../ws-connection-context.js';

export function handleProjectUpdatesConnect(ws) {
  const userId = ws.userId;
  addSocketToRoom(`user_${userId}_updates`, ws);
  addSocketToRoom(`user_${userId}_notifications`, ws);

  sendJson(ws, { type: WS_EVENTS.CONNECTED, user_id: userId });
}

export function handleChatNotificationsConnect(ws) {
  const userId = ws.userId;
  addSocketToRoom(`user_${userId}_chat_notifications`, ws);
}
