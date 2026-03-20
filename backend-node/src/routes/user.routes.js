import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as ctrl from '../controllers/user.controller.js';
import { validateBody, handleValidationErrors } from '../middleware/validation.middleware.js';
import { authSchemas } from '../validation/schemas.js';
import { env } from '../config/environment.js';

const router = Router();
const uploadsDir = path.resolve(process.cwd(), env.fileUpload.uploadPath || './uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

// Public
router.post(
    '/signup/', 
    validateBody(authSchemas.signup), 
    ctrl.signup
);

router.post(
    '/login/', 
    validateBody(authSchemas.login), 
    ctrl.login
);

router.post(
    '/refresh-token/',
    validateBody(authSchemas.refreshToken),
    ctrl.refreshToken
);

router.post(
    '/reset-password/',
    validateBody(authSchemas.resetPassword),
    handleValidationErrors,
    ctrl.resetPassword
);

router.post(
    '/email/request/',
    validateBody(authSchemas.emailRequest),
    handleValidationErrors,
    ctrl.emailRequest
);

router.post(
    '/email/verify/',
    // validateBody(authSchemas.emailVerify),
    handleValidationErrors,
    ctrl.emailVerify
);

router.post(
    '/2fa/verify-login/',
    validateBody(authSchemas.verify2FA),
    handleValidationErrors,
    ctrl.verify2FALogin
);

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
