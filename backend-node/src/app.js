import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import helmet from 'helmet';

import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import aiRoutes from './routes/ai.routes.js';

import { env } from './config/environment.js';
import { errorHandler } from './middleware/error.middleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { inputSanitizationMiddleware } from './middleware/security.middleware.js';

import { EmailService } from './services/email.service.js';

const app = express();

// Initialize Email Service
EmailService.initialize();

const uploadsDir = path.resolve(process.cwd(), env.fileUpload.uploadPath || './uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedOrigins = env.cors.frontendUrl.split(',').map(o => o.trim());
const isDev = env.server.isDevelopment;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (isDev && origin.includes('localhost')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: env.server.isDevelopment ? 1 * 60 * 1000 : env.security.rateLimitWindowMs,
  max: env.server.isDevelopment ? 1500 : env.security.rateLimitMaxRequests,
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  // Chat + notifications are polled frequently and should not starve other APIs.
  skip: (req) => {
    if (req.method !== 'GET') return false;
    const p = req.path || '';
    return (
      p.startsWith('/ai/notifications') ||
      p.startsWith('/chat/rooms') ||
      p.startsWith('/api/ai/notifications') ||
      p.startsWith('/api/chat/rooms')
    );
  },
});

app.use('/api', apiLimiter);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(requestIdMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(inputSanitizationMiddleware);
app.use('/media', express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API routes (mounted at /api prefix in server.js)
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

app.use(errorHandler);

export default app;
