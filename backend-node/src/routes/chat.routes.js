import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/chat.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/rooms/unread-count', ctrl.getRoomsUnreadCount);
router.get('/rooms/unread-count/', ctrl.getRoomsUnreadCount);
router.post('/rooms/direct', ctrl.getDirectRoom);
router.post('/rooms/direct/', ctrl.getDirectRoom);

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
