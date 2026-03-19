import { joinRoom, leaveRoom, broadcast } from '../../services/broadcast.service.js';

export function addSocketToRoom(roomName, ws) {
  joinRoom(roomName, ws);
}

export function removeSocketFromRoom(roomName, ws) {
  leaveRoom(roomName, ws);
}

export function broadcastRoom(roomName, payload) {
  broadcast(roomName, payload);
}
