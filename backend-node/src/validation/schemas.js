import { z } from 'zod';

const idParam = z.object({ id: z.coerce.number().int().positive() });
const roomParam = z.object({ room_pk: z.coerce.number().int().positive() });
const messageParam = z.object({ pk: z.coerce.number().int().positive() });

export const authSchemas = {
  signup: z.object({
    email: z.string().email().max(254),
    name: z.string().min(1).max(255),
    password: z.string().min(1).max(128),
    role: z.string().max(50).optional(),
  }),
  login: z.object({
    email: z.string().email().max(254),
    password: z.string().min(1).max(128),
    remember_me: z.boolean().optional(),
  }),
    refreshToken: z.object({
    refreshToken: z.string(),
  }),

  resetPassword: z.object({
    token: z.string(),
    newPassword: z.string().min(8),
  }),

  emailRequest: z.object({
    email: z.string().email(),
  }),

  emailVerify: z.object({
    code: z.string().length(6),
  }),

  verify2FA: z.object({
    code: z.string().length(6),
  }),
};

export const chatSchemas = {
  roomIdParam: idParam,
  roomPkParam: roomParam,
  messagePkParam: messageParam,
  createRoom: z.object({
    name: z.string().min(1).max(255).optional(),
    is_private: z.boolean().optional(),
  }),
  updateRoom: z.object({
    name: z.string().min(1).max(255).optional(),
    is_private: z.boolean().optional(),
  }),
  createMessage: z.object({
    content: z.string().min(1).max(4000),
    message_type: z.string().max(20).optional(),
    reply_to_id: z.coerce.number().int().positive().optional(),
  }),
  inviteUser: z.object({
    email: z.string().email().max(254),
  }),
  removeMember: z.object({
    user_id: z.coerce.number().int().positive(),
  }),
  directRoom: z.object({
    email: z.string().email().max(254),
  }),
  nickname: z.object({
    nickname: z.string().min(1).max(64),
  }),
  listMessagesQuery: z.object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
    after_id: z.coerce.number().int().positive().optional(),
  }),
};

export const aiSchemas = {
  projectIdParam: idParam,
  createProject: z.object({
    title: z.string().min(1).max(255).optional(),
    summary: z.string().max(5000).optional().nullable(),
    status: z.string().max(20).optional(),
  }),
  updateProject: z.object({
    title: z.string().min(1).max(255).optional(),
    summary: z.string().max(5000).optional().nullable(),
    status: z.string().max(20).optional(),
  }),
  listProjectsQuery: z.object({
    search: z.string().max(255).optional(),
    status: z.string().max(20).optional(),
  }),
};
