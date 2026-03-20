import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/chat.controller.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validation.middleware.js';
import { chatSchemas } from '../validation/schemas.js';

const router = Router();

router.use(authMiddleware);

router.get('/rooms/unread-count', ctrl.getRoomsUnreadCount);
router.get('/rooms/unread-count/', ctrl.getRoomsUnreadCount);
router.post('/rooms/direct', validateBody(chatSchemas.directRoom), ctrl.getDirectRoom);
router.post('/rooms/direct/', validateBody(chatSchemas.directRoom), ctrl.getDirectRoom);

router.get('/rooms/', ctrl.listRooms);
router.post('/rooms/', validateBody(chatSchemas.createRoom), ctrl.createRoom);
router.get('/rooms/:id', validateParams(chatSchemas.roomIdParam), ctrl.getRoom);
router.get('/rooms/:id/', validateParams(chatSchemas.roomIdParam), ctrl.getRoom);
router.patch('/rooms/:id', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.updateRoom), ctrl.updateRoom);
router.patch('/rooms/:id/', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.updateRoom), ctrl.updateRoom);
router.put('/rooms/:id', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.updateRoom), ctrl.updateRoom);
router.put('/rooms/:id/', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.updateRoom), ctrl.updateRoom);
router.delete('/rooms/:id', validateParams(chatSchemas.roomIdParam), ctrl.deleteRoom);
router.delete('/rooms/:id/', validateParams(chatSchemas.roomIdParam), ctrl.deleteRoom);
router.post('/rooms/:id/invite/', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.inviteUser), ctrl.inviteToRoom);
router.post('/rooms/:id/remove_member/', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.removeMember), ctrl.removeMember);
router.get('/rooms/:id/members/', validateParams(chatSchemas.roomIdParam), ctrl.getRoomMembers);
router.post('/rooms/:id/leave/', validateParams(chatSchemas.roomIdParam), ctrl.leaveRoom);
router.post('/rooms/:id/mark_read/', validateParams(chatSchemas.roomIdParam), ctrl.markRoomRead);
router.post('/rooms/:id/nickname/', validateParams(chatSchemas.roomIdParam), validateBody(chatSchemas.nickname), ctrl.setNickname);

router.get('/rooms/:room_pk/messages/', validateParams(chatSchemas.roomPkParam), validateQuery(chatSchemas.listMessagesQuery), ctrl.listMessages);
router.post('/rooms/:room_pk/messages/', validateParams(chatSchemas.roomPkParam), validateBody(chatSchemas.createMessage), ctrl.createMessage);
router.delete('/rooms/:room_pk/messages/:pk', validateParams(chatSchemas.roomPkParam.merge(chatSchemas.messagePkParam)), ctrl.deleteMessage);
router.delete('/rooms/:room_pk/messages/:pk/', validateParams(chatSchemas.roomPkParam.merge(chatSchemas.messagePkParam)), ctrl.deleteMessage);

export default router;
