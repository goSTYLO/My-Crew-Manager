import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/user.controller.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Public
router.post('/signup/', ctrl.signup);
router.post('/login/', ctrl.login);
router.post('/refresh-token/', ctrl.refreshToken);
router.post('/reset-password/', ctrl.resetPassword);
router.post('/email/request/', ctrl.emailRequest);
router.post('/email/verify/', ctrl.emailVerify);
router.post('/2fa/verify-login/', ctrl.verify2FALogin);

// Protected
router.post('/logout/', authMiddleware, ctrl.logout);
router.get('/me/', authMiddleware, ctrl.me);
router.patch('/me/', authMiddleware, upload.single('profile_picture'), ctrl.updateMe);
router.put('/me/', authMiddleware, upload.single('profile_picture'), ctrl.updateMe);
router.get('/', authMiddleware, ctrl.listUsers);
router.delete('/delete/', authMiddleware, ctrl.deleteAccount);

// Email change
router.post('/email/change/verify-password/', authMiddleware, ctrl.changeEmailPasswordVerify);
router.post('/email/change/request/', authMiddleware, ctrl.changeEmailRequest);
router.post('/email/change/verify/', authMiddleware, ctrl.changeEmailVerify);

// 2FA
router.get('/2fa/status/', authMiddleware, ctrl.get2FAStatus);
router.post('/2fa/enable/', authMiddleware, ctrl.enable2FA);
router.post('/2fa/verify-setup/', authMiddleware, ctrl.verify2FASetup);
router.post('/2fa/disable/', authMiddleware, ctrl.disable2FA);

export default router;
