import { WebSocketServer } from 'ws';
import { parse } from 'url';
import { Token } from '../models/Token.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { joinRoom, leaveRoom, broadcast } from '../services/broadcast.service.js';

async function getUserFromToken(tokenKey) {
  if (!tokenKey) return null;
  const token = await Token.findOne({ key: tokenKey }).populate('user');
  return token?.user || null;
}

function parseTokenFromUrl(url) {
  const { query } = parse(url || '', true);
  return query?.token || query?.auth_token;
}

export function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const url = request.url || '';
    if (!url.startsWith('/ws/')) {
      socket.destroy();
      return;
    }

    const tokenKey = parseTokenFromUrl(url);
    const user = await getUserFromToken(tokenKey);
    if (!user || !user.isActive) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const { pathname } = parse(url, true);
    const path = pathname?.replace(/\/$/, '') || '';

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.userId = user._id.toString();
      ws.user = user;

      if (path === '/ws/project-updates') {
        handleProjectUpdatesConnect(ws);
      } else if (path === '/ws/chat/notifications') {
        handleChatNotificationsConnect(ws);
      } else {
        const chatMatch = path.match(/^\/ws\/chat\/(\d+|[a-f0-9]{24})$/);
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

async function handleChatRoomConnect(ws, roomIdOrHex) {
  const room = await Room.findOne({
    $or: [
      { _id: roomIdOrHex },
      { roomId: parseInt(roomIdOrHex, 10) },
    ],
  });
  if (!room) {
    ws.close(1008, 'Room not found');
    return;
  }

  const uid = ws.user._id?.toString() || ws.userId;
  const isMember = room.memberships?.some((m) => m.user?.toString() === uid);
  if (!isMember) {
    ws.close(1008, 'Not a member of this room');
    return;
  }

  const groupName = `chat_${room._id}`;
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
