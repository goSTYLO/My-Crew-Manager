/**
 * In-memory broadcast service for WebSocket rooms.
 * Replaces Django Channels BroadcastService. No Redis needed for single-process.
 */

const rooms = new Map();

export function joinRoom(roomName, ws) {
  if (!rooms.has(roomName)) rooms.set(roomName, new Set());
  rooms.get(roomName).add(ws);
}

export function leaveRoom(roomName, ws) {
  const set = rooms.get(roomName);
  if (set) {
    set.delete(ws);
    if (set.size === 0) rooms.delete(roomName);
  }
}

export function leaveRoomByUser(roomName, userId) {
  const set = rooms.get(roomName);
  if (!set) return;

  set.forEach((ws) => {
    if (String(ws?.userId) === String(userId)) {
      set.delete(ws);
    }
  });

  if (set.size === 0) rooms.delete(roomName);
}

export function broadcast(roomName, payload) {
  const set = rooms.get(roomName);
  if (!set) return;
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  set.forEach((ws) => {
    if (ws.readyState === 1) ws.send(data); // 1 = OPEN
  });
}
