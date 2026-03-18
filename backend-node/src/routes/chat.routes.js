import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/chat.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/rooms/unread-count', async (req, res, next) => {
  try {
    const { Room, Message } = await import('../models/index.js');
    const rooms = await Room.find({ 'memberships.user': req.user._id });
    let total = 0;
    for (const room of rooms) {
      const m = room.memberships?.find((x) => x.user?.toString() === req.user._id.toString());
      const joinedAt = m?.createdAt || room.createdAt;
      const unread = await Message.countDocuments({
        room: room._id,
        createdAt: { $gt: joinedAt },
        isDeleted: false,
        sender: { $ne: req.user._id },
      });
      total += unread;
    }
    return res.json({ unread_count: Math.max(0, total) });
  } catch (err) {
    next(err);
  }
});

router.post('/rooms/direct', ctrl.getDirectRoom);

router.get('/rooms/', ctrl.listRooms);
router.post('/rooms/', ctrl.createRoom);
router.get('/rooms/:id', ctrl.getRoom);
router.put('/rooms/:id', ctrl.updateRoom);
router.delete('/rooms/:id', ctrl.deleteRoom);
router.post('/rooms/:id/invite/', ctrl.inviteToRoom);
router.post('/rooms/:id/remove_member/', ctrl.removeMember);
router.get('/rooms/:id/members/', ctrl.getRoomMembers);

router.get('/rooms/:room_pk/messages/', ctrl.listMessages);
router.post('/rooms/:room_pk/messages/', ctrl.createMessage);
router.delete('/rooms/:room_pk/messages/:pk', ctrl.deleteMessage);

export default router;
