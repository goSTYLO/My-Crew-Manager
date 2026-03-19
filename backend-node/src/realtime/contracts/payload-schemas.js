import { z } from 'zod';

export const joinRoomSchema = z.object({
  type: z.literal('join_room'),
  room_id: z.union([z.string(), z.number()]),
});

export const leaveRoomSchema = z.object({
  type: z.literal('leave_room'),
  room_id: z.union([z.string(), z.number()]),
});

export const chatMessageSchema = z.object({
  type: z.literal('chat_message'),
  room_id: z.union([z.string(), z.number()]),
  content: z.string().min(1).max(5000),
  message_type: z.string().optional(),
  reply_to_id: z.union([z.string(), z.number()]).nullable().optional(),
  client_message_id: z.string().optional(),
});
