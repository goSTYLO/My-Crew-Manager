import { WS_EVENTS } from '../contracts/events.js';
import { prisma } from '../../lib/prisma.js';
import { chatMessageSchema } from '../contracts/payload-schemas.js';
import { toLegacyMessagePayload } from '../compatibility/outbound-transformers.js';
import { broadcastRoom } from '../rooms/room-registry.js';
import { sendMessageAck } from './ack.handler.js';

function sendAckError(ws, payload, message, ackSender = sendMessageAck) {
  ackSender(ws, {
    status: 'error',
    client_message_id: payload?.client_message_id || null,
    error: message,
    detail: message,
    message,
  });
}

async function handleChatMessage(ws, roomId, msg, deps = {}) {
  const prismaClient = deps.prismaClient || prisma;
  const broadcaster = deps.broadcaster || broadcastRoom;
  const ackSender = deps.ackSender || sendMessageAck;

  const parsed = chatMessageSchema.safeParse(msg);
  if (!parsed.success) {
    sendAckError(ws, msg, 'Invalid chat_message payload', ackSender);
    return;
  }

  const payload = parsed.data;
  const payloadRoomId = parseInt(String(payload.room_id), 10);
  if (Number.isNaN(payloadRoomId) || payloadRoomId !== roomId) {
    sendAckError(ws, payload, 'Invalid room_id for this connection', ackSender);
    return;
  }

  const content = String(payload.content || '').trim();
  if (!content) {
    sendAckError(ws, payload, 'Content cannot be empty', ackSender);
    return;
  }

  const savedMessage = await prismaClient.chat_message.create({
    data: {
      room_id: roomId,
      sender_id: BigInt(ws.user.user_id),
      content,
      message_type: payload.message_type || 'text',
      reply_to_id: payload.reply_to_id ? parseInt(String(payload.reply_to_id), 10) : null,
      created_at: new Date(),
      is_deleted: false,
    },
  });

  const legacyMessage = toLegacyMessagePayload(savedMessage, ws.user.name);
  broadcaster(`chat_${roomId}`, {
    type: WS_EVENTS.CHAT_MESSAGE,
    message: legacyMessage,
    client_message_id: payload.client_message_id || null,
  });

  ackSender(ws, {
    status: 'ok',
    client_message_id: payload.client_message_id || null,
    message_id: legacyMessage.message_id,
    room_id: legacyMessage.room_id,
    created_at: legacyMessage.created_at,
  });
}

export async function handleRoomRealtimeMessage(ws, roomId, msg, deps = {}) {
  const broadcaster = deps.broadcaster || broadcastRoom;

  if (msg.type === WS_EVENTS.TYPING) {
    broadcaster(`chat_${roomId}`, {
      type: WS_EVENTS.TYPING,
      user: ws.user.name,
      user_id: ws.userId,
    });
    return;
  }

  if (msg.type === WS_EVENTS.STOP_TYPING) {
    broadcaster(`chat_${roomId}`, {
      type: WS_EVENTS.STOP_TYPING,
      user: ws.user.name,
      user_id: ws.userId,
    });
    return;
  }

  if (msg.type === WS_EVENTS.CHAT_MESSAGE) {
    await handleChatMessage(ws, roomId, msg, deps);
  }
}
