import { prisma } from '../lib/prisma.js';
import { broadcast } from '../services/broadcast.service.js';
import { removeUserFromRoom } from '../realtime/rooms/room-registry.js';

function getUserId(req) {
  return req.user?.user_id ?? req.user?._id;
}

const MAX_CHAT_MESSAGE_ID = 2147483647;

function roomToResponse(room, membersCount = 0) {
  return {
    room_id: String(room.room_id),
    id: String(room.room_id),
    name: room.name,
    is_private: room.is_private,
    created_by_id: String(room.created_by_id),
    created_at: room.created_at,
    members_count: membersCount,
  };
}

function messageToResponse(msg, senderName) {
  return {
    message_id: String(msg.message_id),
    room_id: String(msg.room_id),
    sender_id: String(msg.sender_id),
    sender_username: senderName,
    content: msg.content,
    message_type: msg.message_type || 'text',
    reply_to_id: msg.reply_to_id ? String(msg.reply_to_id) : null,
    created_at: msg.created_at,
    edited_at: msg.edited_at,
    is_deleted: msg.is_deleted,
  };
}

function broadcastToRoom(roomId, payload) {
  broadcast(`chat_${roomId}`, payload);
}

function broadcastToUserChatNotifications(userId, payload) {
  broadcast(`user_${userId}_chat_notifications`, payload);
}

export async function getRoomsUnreadCount(req, res, next) {
  try {
    const userId = getUserId(req);
    const memberships = await prisma.chat_room_membership.findMany({
      where: { user_id: BigInt(userId) },
      include: { chat_room: true },
    });
    let total = 0;
    for (const m of memberships) {
      const unread = await prisma.chat_message.count({
        where: {
          room_id: m.room_id,
          created_at: { gt: m.joined_at },
          is_deleted: false,
          sender_id: { not: BigInt(userId) },
        },
      });
      total += unread;
    }
    return res.json({ unread_count: Math.max(0, total) });
  } catch (err) {
    next(err);
  }
}

export async function listRooms(req, res, next) {
  try {
    const userId = getUserId(req);
    const memberships = await prisma.chat_room_membership.findMany({
      where: { user_id: BigInt(userId) },
      include: { chat_room: true },
    });
    const rooms = memberships.map((m) => m.chat_room);
    const data = await Promise.all(
      rooms.map(async (r) => {
        const count = await prisma.chat_room_membership.count({ where: { room_id: r.room_id } });
        return roomToResponse(r, count);
      })
    );
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.chat_room.findUnique({ where: { room_id: roomId } });
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const membership = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(getUserId(req)) },
    });
    if (!membership) return res.status(403).json({ detail: 'Not a member of this room' });
    const count = await prisma.chat_room_membership.count({ where: { room_id: roomId } });
    return res.json(roomToResponse(room, count));
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req, res, next) {
  try {
    const { name, is_private } = req.body;
    const userId = getUserId(req);
    const room = await prisma.chat_room.create({
      data: {
        name: name || null,
        is_private: is_private !== false,
        created_at: new Date(),
        created_by_id: BigInt(userId),
      },
    });
    await prisma.chat_room_membership.create({
      data: {
        room_id: room.room_id,
        user_id: BigInt(userId),
        is_admin: true,
        joined_at: new Date(),
      },
    });
    const resp = roomToResponse(room, 1);
    broadcastToRoom(room.room_id, { type: 'room_created', room: resp, created_by: req.user?.name });
    broadcastToUserChatNotifications(String(userId), {
      type: 'room_invitation',
      room_id: String(room.room_id),
      room_name: room.name || `Room ${room.room_id}`,
      invited_by: req.user?.name,
    });
    return res.status(201).json(resp);
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.chat_room.findUnique({ where: { room_id: roomId } });
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const membership = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(getUserId(req)) },
    });
    if (!membership) return res.status(403).json({ detail: 'Not a member of this room' });

    const body = req.body || {};
    const data = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.is_private !== undefined) data.is_private = body.is_private;

    const updated = Object.keys(data).length > 0
      ? await prisma.chat_room.update({ where: { room_id: roomId }, data })
      : room;
    const count = await prisma.chat_room_membership.count({ where: { room_id: roomId } });
    const payload = roomToResponse(updated, count);

    broadcastToRoom(roomId, {
      type: 'room_updated',
      room: payload,
      updated_by: req.user?.name,
      updated_by_id: String(getUserId(req)),
    });

    return res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function leaveRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const userId = getUserId(req);

    const room = await prisma.chat_room.findUnique({ where: { room_id: roomId } });
    if (!room) return res.status(404).json({ detail: 'Not found' });

    const membership = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(userId) },
    });
    if (!membership) return res.status(403).json({ detail: 'Not a member of this room' });

    await prisma.chat_room_membership.delete({ where: { membership_id: membership.membership_id } });
    removeUserFromRoom(`chat_${roomId}`, userId);

    const remainingMembers = await prisma.chat_room_membership.findMany({
      where: { room_id: roomId },
      orderBy: { membership_id: 'asc' },
    });

    if (remainingMembers.length === 0) {
      await prisma.chat_message.deleteMany({ where: { room_id: roomId } });
      await prisma.chat_room.delete({ where: { room_id: roomId } });
      return res.json({ detail: 'Left room successfully', room_deleted: true, total_unread_count: 0 });
    }

    if (membership.is_admin && !remainingMembers.some((m) => m.is_admin)) {
      await prisma.chat_room_membership.update({
        where: { membership_id: remainingMembers[0].membership_id },
        data: { is_admin: true },
      });
    }

    broadcastToRoom(roomId, {
      type: 'user_left',
      user: req.user?.name,
      user_id: String(userId),
    });

    const unread = await getRoomsUnreadCountForUser(userId);
    return res.json({ detail: 'Left room successfully', room_deleted: false, total_unread_count: unread });
  } catch (err) {
    next(err);
  }
}

async function getRoomsUnreadCountForUser(userId) {
  const memberships = await prisma.chat_room_membership.findMany({
    where: { user_id: BigInt(userId) },
    select: { room_id: true, joined_at: true },
  });

  let total = 0;
  for (const m of memberships) {
    const count = await prisma.chat_message.count({
      where: {
        room_id: m.room_id,
        created_at: { gt: m.joined_at },
        is_deleted: false,
        sender_id: { not: BigInt(userId) },
      },
    });
    total += count;
  }
  return Math.max(0, total);
}

export async function markRoomRead(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const userId = getUserId(req);

    const membership = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(userId) },
    });
    if (!membership) return res.status(403).json({ detail: 'Not a member of this room' });

    await prisma.chat_room_membership.update({
      where: { membership_id: membership.membership_id },
      data: { joined_at: new Date() },
    });

    const unread = await getRoomsUnreadCountForUser(userId);
    broadcastToUserChatNotifications(String(userId), {
      type: 'unread_count_updated',
      unread_count: unread,
    });

    return res.json({ detail: 'Room marked as read', total_unread_count: unread });
  } catch (err) {
    next(err);
  }
}

export async function setNickname(req, res) {
  return res.json({ detail: 'Nickname updated successfully' });
}

export async function deleteRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.chat_room.findUnique({ where: { room_id: roomId } });
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const membership = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(getUserId(req)) },
    });
    if (!membership?.is_admin) return res.status(403).json({ detail: 'Not an admin' });
    await prisma.chat_message.deleteMany({ where: { room_id: roomId } });
    await prisma.chat_room_membership.deleteMany({ where: { room_id: roomId } });
    await prisma.chat_room.delete({ where: { room_id: roomId } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function inviteToRoom(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.chat_room.findUnique({
      where: { room_id: roomId },
      include: { chat_room_membership: true },
    });
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const myMembership = room.chat_room_membership.find((m) => m.user_id === BigInt(getUserId(req)));
    if (!myMembership?.is_admin) return res.status(403).json({ detail: 'Not an admin' });

    const email = req.body.email;
    if (!email) return res.status(400).json({ detail: 'email is required' });
    const otherUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!otherUser) return res.status(404).json({ detail: 'User not found' });
    if (otherUser.user_id === getUserId(req)) return res.status(400).json({ detail: 'Cannot invite yourself' });

    const existing = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(otherUser.user_id) },
    });
    if (!existing) {
      await prisma.chat_room_membership.create({
        data: {
          room_id: roomId,
          user_id: BigInt(otherUser.user_id),
          is_admin: false,
          joined_at: new Date(),
        },
      });
      broadcastToUserChatNotifications(String(otherUser.user_id), {
        type: 'room_invitation',
        room_id: String(roomId),
        room_name: room.name || `Room ${roomId}`,
        invited_by: req.user?.name,
      });
      broadcastToRoom(roomId, {
        type: 'user_joined',
        user: otherUser.name,
        user_id: String(otherUser.user_id),
        user_email: otherUser.email,
        invited_by: req.user?.name,
      });
    }
    return res.json({ detail: 'User invited/added successfully' });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.chat_room.findUnique({
      where: { room_id: roomId },
      include: { chat_room_membership: true },
    });
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const myMembership = room.chat_room_membership.find((m) => m.user_id === BigInt(getUserId(req)));
    if (!myMembership?.is_admin) return res.status(403).json({ detail: 'Not an admin' });

    const userId = req.body.user_id;
    if (!userId) return res.status(400).json({ detail: 'user_id is required' });

    const targetMembership = await prisma.chat_room_membership.findFirst({
      where: { room_id: roomId, user_id: BigInt(userId) },
    });
    if (targetMembership) {
      await prisma.chat_room_membership.delete({ where: { membership_id: targetMembership.membership_id } });
      const user = await prisma.user.findUnique({ where: { user_id: Number(userId) } });
      broadcastToRoom(roomId, { type: 'user_left', user: user?.name, user_id: userId });
    }
    return res.json({ detail: 'Member removed' });
  } catch (err) {
    next(err);
  }
}

export async function getRoomMembers(req, res, next) {
  try {
    const roomId = parseInt(req.params.id, 10);
    const room = await prisma.chat_room.findUnique({
      where: { room_id: roomId },
      include: { chat_room_membership: true },
    });
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const myMembership = room.chat_room_membership.find((m) => m.user_id === BigInt(getUserId(req)));
    if (!myMembership) return res.status(403).json({ detail: 'Not a member of this room' });

    const userIds = room.chat_room_membership.map((m) => Number(m.user_id));
    const users = await prisma.user.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, name: true, email: true },
    });
    const userMap = Object.fromEntries(users.map((u) => [u.user_id, u]));

    const data = room.chat_room_membership.map((m, i) => {
      const u = userMap[Number(m.user_id)];
      return {
        membership_id: m.membership_id,
        room_id: String(roomId),
        user_id: String(m.user_id),
        is_admin: m.is_admin,
        joined_at: m.joined_at,
      };
    });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req, res, next) {
  try {
    const roomPk = req.params.room_pk;
    const roomId = parseInt(roomPk, 10);
    if (isNaN(roomId)) return res.status(404).json({ detail: 'Room not found' });

    const room = await prisma.chat_room.findUnique({
      where: { room_id: roomId },
      include: { chat_room_membership: true },
    });
    if (!room) return res.status(404).json({ detail: 'Room not found' });
    const isMember = room.chat_room_membership.some((m) => m.user_id === BigInt(getUserId(req)));
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const afterId = req.query.after_id ? parseInt(req.query.after_id, 10) : null;

    const where = { room_id: roomId, is_deleted: false };
    if (afterId) where.message_id = { gt: afterId };

    const messages = await prisma.chat_message.findMany({
      where,
      orderBy: { created_at: 'asc' },
      skip: offset,
      take: limit,
    });

    const senderIds = [...new Set(messages.map((m) => Number(m.sender_id)))];
    const senders = await prisma.user.findMany({
      where: { user_id: { in: senderIds } },
      select: { user_id: true, name: true },
    });
    const senderMap = Object.fromEntries(senders.map((s) => [s.user_id, s]));

    const totalCount = await prisma.chat_message.count({ where: { room_id: roomId, is_deleted: false } });
    const results = messages.map((m) =>
      messageToResponse(m, senderMap[Number(m.sender_id)]?.name)
    );

    return res.json({
      results,
      messages: results,
      total_count: totalCount,
      has_more: offset + results.length < totalCount,
      limit,
      offset,
    });
  } catch (err) {
    next(err);
  }
}

export async function createMessage(req, res, next) {
  try {
    const roomPk = req.params.room_pk;
    const roomId = parseInt(roomPk, 10);
    if (isNaN(roomId)) return res.status(404).json({ detail: 'Room not found' });

    const room = await prisma.chat_room.findUnique({
      where: { room_id: roomId },
      include: { chat_room_membership: true },
    });
    if (!room) return res.status(404).json({ detail: 'Room not found' });
    const isMember = room.chat_room_membership.some((m) => m.user_id === BigInt(getUserId(req)));
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });

    const content = req.body.content;
    if (!content || String(content).trim() === '') {
      return res.status(400).json({ content: ['Content cannot be empty for text messages.'] });
    }

    const userId = getUserId(req);
    const message = await prisma.chat_message.create({
      data: {
        room_id: roomId,
        sender_id: BigInt(userId),
        content: String(content).trim(),
        message_type: req.body.message_type || 'text',
        reply_to_id: req.body.reply_to_id ? parseInt(req.body.reply_to_id, 10) : null,
        created_at: new Date(),
        is_deleted: false,
      },
    });

    const msgData = messageToResponse(message, req.user?.name);

    broadcastToRoom(roomId, {
      type: 'chat_message',
      message: msgData,
      user: req.user?.name,
      user_id: String(userId),
    });

    room.chat_room_membership.forEach((m) => {
      const uid = String(m.user_id);
      if (uid !== String(userId)) {
        broadcastToUserChatNotifications(uid, {
          type: 'new_message',
          room_id: String(roomId),
          message: msgData,
          sender: req.user?.name,
        });
      }
    });

    return res.status(201).json(msgData);
  } catch (err) {
    next(err);
  }
}

export async function deleteMessage(req, res, next) {
  try {
    const roomPk = req.params.room_pk;
    const messageId = parseInt(req.params.pk, 10);
    const roomId = parseInt(roomPk, 10);
    if (isNaN(roomId)) return res.status(404).json({ detail: 'Room not found' });
    if (!Number.isInteger(messageId) || messageId <= 0 || messageId > MAX_CHAT_MESSAGE_ID) {
      return res.status(400).json({ detail: 'Invalid message id' });
    }

    const room = await prisma.chat_room.findUnique({
      where: { room_id: roomId },
      include: { chat_room_membership: true },
    });
    if (!room) return res.status(404).json({ detail: 'Room not found' });
    const isMember = room.chat_room_membership.some((m) => m.user_id === BigInt(getUserId(req)));
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });

    const message = await prisma.chat_message.findFirst({
      where: { message_id: messageId, room_id: roomId },
    });
    if (!message) return res.status(404).json({ detail: 'Message not found' });

    const myMembership = room.chat_room_membership.find((m) => m.user_id === BigInt(getUserId(req)));
    if (Number(message.sender_id) !== getUserId(req) && !myMembership?.is_admin) {
      return res.status(403).json({ detail: 'Not permitted' });
    }

    await prisma.chat_message.update({
      where: { message_id: messageId },
      data: { is_deleted: true },
    });

    broadcastToRoom(roomId, {
      type: 'message_deleted',
      message_id: String(messageId),
      deleted_by: req.user?.name,
      deleted_by_id: String(getUserId(req)),
      message_content: message.content,
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getDirectRoom(req, res, next) {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ detail: 'email is required' });
    const otherUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!otherUser) return res.status(404).json({ detail: 'User not found' });
    const userId = getUserId(req);
    if (otherUser.user_id === userId) {
      return res.status(400).json({ detail: 'email must be different from current user' });
    }

    const myRooms = await prisma.chat_room_membership.findMany({
      where: { user_id: BigInt(userId) },
      select: { room_id: true },
    });
    const otherRooms = await prisma.chat_room_membership.findMany({
      where: { user_id: BigInt(otherUser.user_id) },
      select: { room_id: true },
    });
    const myRoomIds = new Set(myRooms.map((r) => r.room_id));
    const sharedRooms = otherRooms.filter((r) => myRoomIds.has(r.room_id));

    for (const m of sharedRooms) {
      const count = await prisma.chat_room_membership.count({ where: { room_id: m.room_id } });
      if (count === 2) {
        const room = await prisma.chat_room.findUnique({ where: { room_id: m.room_id } });
        if (room?.is_private) {
          broadcastToUserChatNotifications(String(otherUser.user_id), {
            type: 'direct_room_created',
            room: roomToResponse(room, 2),
            created_by: req.user?.name,
          });
          return res.json(roomToResponse(room, 2));
        }
      }
    }

    const room = await prisma.chat_room.create({
      data: {
        is_private: true,
        name: null,
        created_at: new Date(),
        created_by_id: BigInt(userId),
      },
    });
    await prisma.chat_room_membership.createMany({
      data: [
        { room_id: room.room_id, user_id: BigInt(userId), is_admin: true, joined_at: new Date() },
        { room_id: room.room_id, user_id: BigInt(otherUser.user_id), is_admin: false, joined_at: new Date() },
      ],
    });

    broadcastToRoom(room.room_id, { type: 'direct_room_created', room: roomToResponse(room, 2), created_by: req.user?.name });
    broadcastToUserChatNotifications(String(otherUser.user_id), {
      type: 'direct_room_created',
      room: roomToResponse(room, 2),
      created_by: req.user?.name,
    });

    return res.status(201).json(roomToResponse(room, 2));
  } catch (err) {
    next(err);
  }
}
