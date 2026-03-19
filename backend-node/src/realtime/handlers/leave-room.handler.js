import { WS_EVENTS } from '../contracts/events.js';
import { removeSocketFromRoom } from '../rooms/room-registry.js';
import { sendJson } from '../ws-connection-context.js';

export function handleLeaveRoom(ws, roomIdRaw) {
  const roomId = parseInt(String(roomIdRaw), 10);
  if (Number.isNaN(roomId)) {
    sendJson(ws, { type: WS_EVENTS.LEAVE_ROOM, status: 'error', error: 'Room not found', detail: 'Room not found', message: 'Room not found' });
    return;
  }

  const groupName = `chat_${roomId}`;
  removeSocketFromRoom(groupName, ws);
  if (ws._joinedRooms) ws._joinedRooms.delete(groupName);

  sendJson(ws, { type: WS_EVENTS.LEAVE_ROOM, status: 'ok', room_id: String(roomId) });
}
