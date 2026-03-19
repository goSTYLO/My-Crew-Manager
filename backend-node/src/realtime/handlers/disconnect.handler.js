import { removeSocketFromRoom } from '../rooms/room-registry.js';

export function cleanupSocketRooms(ws) {
  if (!ws._joinedRooms || ws._joinedRooms.size === 0) return;
  for (const roomName of ws._joinedRooms) {
    removeSocketFromRoom(roomName, ws);
  }
  ws._joinedRooms.clear();
}
