import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { prisma } from '../lib/prisma.js';
import { joinRoom, leaveRoom, broadcast } from '../services/broadcast.service.js';

async function getUserFromToken(tokenKey) {
  if (!tokenKey) return null;
  const token = await prisma.authtoken_token.findUnique({
    where: { key: tokenKey },
  });
  if (!token) return null;
  const user = await prisma.user.findUnique({
    where: { user_id: Number(token.user_id) },
  });
  return user?.is_active ? user : null;
}

function parseTokenFromUrl(url) {
  const { query } = parse(url || '', true);
  return query?.token || query?.auth_token;
}

function parseTokenFromAuthHeader(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2) return null;
  const [schemeRaw, value] = parts;
  const scheme = schemeRaw.toLowerCase();
  if (!value) return null;
  if (scheme === 'token' || scheme === 'bearer') return value;
  return null;
}

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const url = request.url || '';
    if (!url.startsWith('/ws/')) {
      socket.destroy();
      return;
    }

    const tokenKey = parseTokenFromUrl(url) || parseTokenFromAuthHeader(request.headers?.authorization);
    const user = await getUserFromToken(tokenKey);
    if (!user) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const { pathname } = parse(url, true);
    const path = pathname?.replace(/\/$/, '') || '';

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = String(user.user_id);
      ws.user = user;

      if (path === '/ws/project-updates') {
        handleProjectUpdatesConnect(ws);
      } else if (path === '/ws/chat/notifications') {
        handleChatNotificationsConnect(ws);
      } else {
        const chatMatch = path.match(/^\/ws\/chat\/(\d+)$/);
        if (chatMatch) {
          handleChatRoomConnect(ws, chatMatch[1]);
        } else {
          ws.close(1008, 'Unknown WebSocket path');
        }
      }
    });
  });
}

function handleProjectUpdatesConnect(ws) {
  const userId = ws.userId;
  const groupName = `user_${userId}_updates`;
  const notifName = `user_${userId}_notifications`;

  joinRoom(groupName, ws);
  joinRoom(notifName, ws);

  ws.on('close', () => {
    leaveRoom(groupName, ws);
    leaveRoom(notifName, ws);
  });

  ws.send(JSON.stringify({ type: 'connected', user_id: userId }));
}

function handleChatNotificationsConnect(ws) {
  const userId = ws.userId;
  const groupName = `user_${userId}_chat_notifications`;

  joinRoom(groupName, ws);

  ws.on('close', () => leaveRoom(groupName, ws));
}

async function handleChatRoomConnect(ws, roomIdStr) {
  const roomId = parseInt(roomIdStr, 10);
  if (isNaN(roomId)) {
    ws.close(1008, 'Room not found');
    return;
  }

  const room = await prisma.chat_room.findUnique({
    where: { room_id: roomId },
    include: { chat_room_membership: true },
  });
  if (!room) {
    ws.close(1008, 'Room not found');
    return;
  }

  const uid = ws.user.user_id;
  const isMember = room.chat_room_membership.some((m) => m.user_id === BigInt(uid));
  if (!isMember) {
    ws.close(1008, 'Not a member of this room');
    return;
  }

  const groupName = `chat_${room.room_id}`;
  joinRoom(groupName, ws);

  broadcast(groupName, {
    type: 'user_joined',
    user: ws.user.name,
    user_id: ws.userId,
    user_email: ws.user.email,
  });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'typing') {
        broadcast(groupName, { type: 'typing', user: ws.user.name, user_id: ws.userId });
      } else if (msg.type === 'stop_typing') {
        broadcast(groupName, { type: 'stop_typing', user: ws.user.name, user_id: ws.userId });
      }
    } catch (_) {}
  });

  ws.on('close', () => {
    leaveRoom(groupName, ws);
    broadcast(groupName, { type: 'user_left', user: ws.user.name, user_id: ws.userId });
  });
}

export { broadcast };
