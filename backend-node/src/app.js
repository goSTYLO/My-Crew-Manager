import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { validateEnv } from './config/env.js';

import userRoutes from './routes/user.routes.js';
import chatRoutes from './routes/chat.routes.js';
import aiRoutes from './routes/ai.routes.js';

import { errorHandler } from './middleware/error.middleware.js';

const app = express();

// Validate env before starting
validateEnv();

// CORS before rate limiter so all responses get CORS headers (including preflight)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting - configurable for dev (polling + API calls can exceed default)
const rateLimitMax = process.env.RATE_LIMIT_MAX
  ? parseInt(process.env.RATE_LIMIT_MAX, 10)
  : process.env.NODE_ENV === 'production'
    ? 100
    : 500;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: rateLimitMax > 0 ? rateLimitMax : 9999,
  message: { error: 'Too many requests' },
});
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
