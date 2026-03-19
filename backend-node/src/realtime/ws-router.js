import { parse } from 'url';
import { WS_EVENTS } from './contracts/events.js';
import { handleProjectUpdatesConnect, handleChatNotificationsConnect } from './handlers/connect.handler.js';
import { cleanupSocketRooms } from './handlers/disconnect.handler.js';
import { handleJoinRoom } from './handlers/join-room.handler.js';
import { handleLeaveRoom } from './handlers/leave-room.handler.js';
import { handleRoomRealtimeMessage } from './handlers/chat-message.handler.js';
import { broadcastRoom } from './rooms/room-registry.js';
import { sendAuthExpiredAndClose } from './ws-connection-context.js';
import { isSocketUserActive } from './middleware/auth.socket.middleware.js';

export async function routeSocketByPath(ws, request) {
  if (!ws?.user || !ws?.userId) {
    sendAuthExpiredAndClose(ws, 'Authentication credentials were not provided.');
    return;
  }

  const { pathname } = parse(request.url || '', true);
  const path = pathname?.replace(/\/$/, '') || '';

  if (path === '/ws/project-updates') {
    handleProjectUpdatesConnect(ws);
    ws.on('close', () => cleanupSocketRooms(ws));
    return;
  }

  if (path === '/ws/chat/notifications') {
    handleChatNotificationsConnect(ws);
    ws.on('close', () => cleanupSocketRooms(ws));
    return;
  }

  const chatMatch = path.match(/^\/ws\/chat\/(\d+)$/);
  if (!chatMatch) {
    ws.close(1008, 'Unknown WebSocket path');
    return;
  }

  const roomId = await handleJoinRoom(ws, chatMatch[1]);
  if (!roomId) {
    ws.close(1008, 'Not a member of this room');
    return;
  }

  broadcastRoom(`chat_${roomId}`, {
    type: WS_EVENTS.USER_JOINED,
    user: ws.user.name,
    user_id: ws.userId,
    user_email: ws.user.email,
  });

  ws.on('message', async (data) => {
    try {
      const isActive = await isSocketUserActive(ws.user?.user_id);
      if (!isActive) {
        sendAuthExpiredAndClose(ws, 'Authentication token expired');
        return;
      }

      const msg = JSON.parse(data.toString());
      if (msg.type === WS_EVENTS.JOIN_ROOM) {
        handleJoinRoom(ws, msg.room_id);
        return;
      }
      if (msg.type === WS_EVENTS.LEAVE_ROOM) {
        handleLeaveRoom(ws, msg.room_id);
        return;
      }
      await handleRoomRealtimeMessage(ws, roomId, msg);
    } catch (_) {
      // ignore malformed payloads to preserve compatibility behavior
    }
  });

  ws.on('close', () => {
    cleanupSocketRooms(ws);
    broadcastRoom(`chat_${roomId}`, {
      type: WS_EVENTS.USER_LEFT,
      user: ws.user.name,
      user_id: ws.userId,
    });
  });
}
