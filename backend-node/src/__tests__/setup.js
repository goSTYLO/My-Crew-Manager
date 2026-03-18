import { jest } from '@jest/globals';
globalThis.jest = jest;

process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
process.env.DISABLE_2FA = process.env.DISABLE_2FA ?? 'true';
