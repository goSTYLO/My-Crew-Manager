import { prisma } from '../../lib/prisma.js';
import { WS_EVENTS } from '../contracts/events.js';
import { addSocketToRoom } from '../rooms/room-registry.js';
import { sendJson } from '../ws-connection-context.js';

export async function handleJoinRoom(ws, roomIdRaw) {
  const roomId = parseInt(String(roomIdRaw), 10);
  if (Number.isNaN(roomId)) {
    sendJson(ws, { type: WS_EVENTS.JOIN_ROOM, status: 'error', error: 'Room not found', detail: 'Room not found', message: 'Room not found' });
    return null;
  }

  const membership = await prisma.chat_room_membership.findFirst({
    where: { room_id: roomId, user_id: BigInt(ws.user.user_id) },
  });

  if (!membership) {
    sendJson(ws, { type: WS_EVENTS.JOIN_ROOM, status: 'error', room_id: String(roomId), error: 'Not a member of this room', detail: 'Not a member of this room', message: 'Not a member of this room' });
    return null;
  }

  const groupName = `chat_${roomId}`;
  addSocketToRoom(groupName, ws);
  if (!ws._joinedRooms) ws._joinedRooms = new Set();
  ws._joinedRooms.add(groupName);

  sendJson(ws, { type: WS_EVENTS.JOIN_ROOM, status: 'ok', room_id: String(roomId) });
  return roomId;
}
