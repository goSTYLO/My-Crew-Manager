import { Room, Message } from '../models/index.js';
import { broadcast } from '../services/broadcast.service.js';
import mongoose from 'mongoose';

function roomToResponse(room, baseUrl) {
  const membersCount = room.memberships?.length || 0;
  return {
    room_id: room.roomId ?? room._id.toString(),
    id: room.roomId ?? room._id.toString(),
    name: room.name,
    is_private: room.isPrivate,
    created_by_id: room.createdBy?.toString?.(),
    created_at: room.createdAt,
    members_count: membersCount,
  };
}

function messageToResponse(msg) {
  const senderId = msg.sender?._id?.toString?.() ?? msg.sender?.toString?.();
  const senderName = msg.sender?.name ?? msg.senderUsername;
  return {
    message_id: msg._id.toString(),
    room_id: msg.room?.toString?.(),
    sender_id: senderId,
    sender_username: senderName,
    content: msg.content,
    message_type: msg.messageType || 'text',
    reply_to_id: msg.replyTo?.toString?.() ?? null,
    created_at: msg.createdAt,
    edited_at: msg.editedAt,
    is_deleted: msg.isDeleted,
  };
}

function broadcastToRoom(room, payload) {
  const groupName = `chat_${room._id}`;
  broadcast(groupName, payload);
}

function broadcastToUserChatNotifications(userId, payload) {
  const groupName = `user_${userId}_chat_notifications`;
  broadcast(groupName, payload);
}

export async function listRooms(req, res, next) {
  try {
    const uid = req.user._id;
    const rooms = await Room.find({ 'memberships.user': uid }).populate('createdBy', 'name email');
    const data = rooms.map((r) => roomToResponse(r));
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getRoom(req, res, next) {
  try {
    const room = await Room.findById(req.params.id).populate('createdBy', 'name email');
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const isMember = room.memberships?.some((m) => m.user?.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });
    return res.json(roomToResponse(room));
  } catch (err) {
    next(err);
  }
}

export async function createRoom(req, res, next) {
  try {
    const { name, is_private } = req.body;
    const room = await Room.create({
      name: name || null,
      isPrivate: is_private !== false,
      createdBy: req.user._id,
      memberships: [{ user: req.user._id, isAdmin: true }],
    });
    broadcastToRoom(room, { type: 'room_created', room: roomToResponse(room), created_by: req.user.name });
    broadcastToUserChatNotifications(req.user._id.toString(), {
      type: 'room_invitation',
      room_id: room._id.toString(),
      room_name: room.name || `Room ${room._id}`,
      invited_by: req.user.name,
    });
    return res.status(201).json(roomToResponse(room));
  } catch (err) {
    next(err);
  }
}

export async function updateRoom(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const isMember = room.memberships?.some((m) => m.user?.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });
    if (req.body.name !== undefined) room.name = req.body.name;
    if (req.body.is_private !== undefined) room.isPrivate = req.body.is_private;
    await room.save();
    return res.json(roomToResponse(room));
  } catch (err) {
    next(err);
  }
}

export async function deleteRoom(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const membership = room.memberships?.find((m) => m.user?.toString() === req.user._id.toString());
    if (!membership?.isAdmin) return res.status(403).json({ detail: 'Not an admin' });
    await Room.deleteOne({ _id: room._id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function inviteToRoom(req, res, next) {
  try {
    const { User } = await import('../models/User.js');
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const isAdmin = room.memberships?.find((m) => m.user?.toString() === req.user._id.toString())?.isAdmin;
    if (!isAdmin) return res.status(403).json({ detail: 'Not an admin' });
    const email = req.body.email;
    if (!email) return res.status(400).json({ detail: 'email is required' });
    const otherUser = await User.findOne({ email: email.toLowerCase() });
    if (!otherUser) return res.status(404).json({ detail: 'User not found' });
    if (otherUser._id.toString() === req.user._id.toString()) return res.status(400).json({ detail: 'Cannot invite yourself' });
    const existing = room.memberships?.find((m) => m.user?.toString() === otherUser._id.toString());
    if (!existing) {
      room.memberships = room.memberships || [];
      room.memberships.push({ user: otherUser._id, isAdmin: false });
      await room.save();
      broadcastToUserChatNotifications(otherUser._id.toString(), {
        type: 'room_invitation',
        room_id: room._id.toString(),
        room_name: room.name || `Room ${room._id}`,
        invited_by: req.user.name,
      });
      broadcastToRoom(room, {
        type: 'user_joined',
        user: otherUser.name,
        user_id: otherUser._id.toString(),
        user_email: otherUser.email,
        invited_by: req.user.name,
      });
    }
    return res.json({ detail: 'User invited/added successfully' });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const isAdmin = room.memberships?.find((m) => m.user?.toString() === req.user._id.toString())?.isAdmin;
    if (!isAdmin) return res.status(403).json({ detail: 'Not an admin' });
    const userId = req.body.user_id;
    if (!userId) return res.status(400).json({ detail: 'user_id is required' });
    const idx = room.memberships?.findIndex((m) => m.user?.toString() === userId);
    if (idx >= 0) {
      const removed = room.memberships[idx];
      room.memberships.splice(idx, 1);
      await room.save();
      broadcastToRoom(room, { type: 'user_left', user: removed.user?.name, user_id: userId });
    }
    return res.json({ detail: 'Member removed' });
  } catch (err) {
    next(err);
  }
}

export async function getRoomMembers(req, res, next) {
  try {
    const room = await Room.findById(req.params.id).populate('memberships.user', 'name email');
    if (!room) return res.status(404).json({ detail: 'Not found' });
    const isMember = room.memberships?.some((m) => m.user?.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });
    const data = (room.memberships || []).map((m, i) => ({
      membership_id: i + 1,
      room_id: room._id.toString(),
      user_id: m.user?._id?.toString?.(),
      is_admin: m.isAdmin,
      joined_at: m.createdAt || room.createdAt,
    }));
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req, res, next) {
  try {
    const roomId = req.params.room_pk;
    const room = await Room.findOne({ $or: [{ _id: roomId }, { roomId: parseInt(roomId, 10) }] });
    if (!room) return res.status(404).json({ detail: 'Room not found' });
    const isMember = room.memberships?.some((m) => m.user?.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const offset = parseInt(req.query.offset || '0', 10);
    const afterId = req.query.after_id;

    let q = Message.find({ room: room._id, isDeleted: false }).populate('sender', 'name');
    if (afterId) q = q.where('_id').gt(new mongoose.Types.ObjectId(afterId));
    q = q.sort({ createdAt: 1 }).skip(offset).limit(limit);

    const messages = await q;
    const totalCount = await Message.countDocuments({ room: room._id, isDeleted: false });
    const results = messages.map((m) => messageToResponse(m));

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
    const roomId = req.params.room_pk;
    const room = await Room.findOne({ $or: [{ _id: roomId }, { roomId: parseInt(roomId, 10) }] });
    if (!room) return res.status(404).json({ detail: 'Room not found' });
    const isMember = room.memberships?.some((m) => m.user?.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });

    const content = req.body.content;
    if (!content || String(content).trim() === '') {
      return res.status(400).json({ content: ['Content cannot be empty for text messages.'] });
    }

    const message = await Message.create({
      room: room._id,
      sender: req.user._id,
      content: String(content).trim(),
      messageType: req.body.message_type || 'text',
      replyTo: req.body.reply_to_id || null,
    });

    const populated = await Message.findById(message._id).populate('sender', 'name');
    const msgData = messageToResponse({ ...populated.toObject(), senderUsername: req.user.name });

    broadcastToRoom(room, {
      type: 'chat_message',
      message: msgData,
      user: req.user.name,
      user_id: req.user._id.toString(),
    });

    (room.memberships || []).forEach((m) => {
      const uid = m.user?.toString?.();
      if (uid && uid !== req.user._id.toString()) {
        broadcastToUserChatNotifications(uid, {
          type: 'new_message',
          room_id: room._id.toString(),
          message: msgData,
          sender: req.user.name,
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
    const { room_pk, pk } = req.params;
    const room = await Room.findOne({ $or: [{ _id: room_pk }, { roomId: parseInt(room_pk, 10) }] });
    if (!room) return res.status(404).json({ detail: 'Room not found' });
    const isMember = room.memberships?.some((m) => m.user?.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ detail: 'Not a member of this room' });

    const message = await Message.findOne({ _id: pk, room: room._id });
    if (!message) return res.status(404).json({ detail: 'Message not found' });

    const isAdmin = room.memberships?.find((m) => m.user?.toString() === req.user._id.toString())?.isAdmin;
    if (message.sender?.toString() !== req.user._id.toString() && !isAdmin) {
      return res.status(403).json({ detail: 'Not permitted' });
    }

    message.isDeleted = true;
    await message.save();

    broadcastToRoom(room, {
      type: 'message_deleted',
      message_id: message._id.toString(),
      deleted_by: req.user.name,
      deleted_by_id: req.user._id.toString(),
      message_content: message.content,
    });

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getDirectRoom(req, res, next) {
  try {
    const { User } = await import('../models/User.js');
    const email = req.body.email;
    if (!email) return res.status(400).json({ detail: 'email is required' });
    const otherUser = await User.findOne({ email: email.toLowerCase() });
    if (!otherUser) return res.status(404).json({ detail: 'User not found' });
    if (otherUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ detail: 'email must be different from current user' });
    }

    const candidates = await Room.find({
      isPrivate: true,
      'memberships.user': { $all: [req.user._id, otherUser._id] },
    }).populate('createdBy', 'name email');
    const existing = candidates.find((r) => (r.memberships?.length ?? 0) === 2);

    if (existing) {
      broadcastToUserChatNotifications(otherUser._id.toString(), {
        type: 'direct_room_created',
        room: roomToResponse(existing),
        created_by: req.user.name,
      });
      return res.json(roomToResponse(existing));
    }

    const room = await Room.create({
      isPrivate: true,
      name: null,
      createdBy: req.user._id,
      memberships: [
        { user: req.user._id, isAdmin: true },
        { user: otherUser._id, isAdmin: false },
      ],
    });

    broadcastToRoom(room, { type: 'direct_room_created', room: roomToResponse(room), created_by: req.user.name });
    broadcastToUserChatNotifications(otherUser._id.toString(), {
      type: 'direct_room_created',
      room: roomToResponse(room),
      created_by: req.user.name,
    });

    return res.status(201).json(roomToResponse(room));
  } catch (err) {
    next(err);
  }
}
