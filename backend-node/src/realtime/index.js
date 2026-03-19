import { WebSocketServer } from 'ws';
import { authenticateSocketRequest } from './middleware/auth.socket.middleware.js';
import { routeSocketByPath } from './ws-router.js';

export function setupRealtimeServer(server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', async (request, socket, head) => {
    const url = request.url || '';
    if (!url.startsWith('/ws/')) {
      socket.destroy();
      return;
    }

    const authResult = await authenticateSocketRequest(request);
    if (!authResult.ok) {
      socket.write(`HTTP/1.1 401 Unauthorized\r\nX-WS-Auth-Error: ${authResult.error}\r\n\r\n`);
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      ws.user = authResult.user;
      ws.userId = String(authResult.user.user_id);
      ws._joinedRooms = new Set();
      routeSocketByPath(ws, request);
    });
  });

  return wss;
}
