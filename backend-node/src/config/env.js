import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.JWT_SECRET && process.env.SECRET_KEY) process.env.JWT_SECRET = process.env.SECRET_KEY;

if (!process.env.DATABASE_URL && process.env.DB_NAME) {
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  const db = process.env.DB_NAME;
  process.env.DATABASE_URL = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

const required = ['SECRET_KEY', 'JWT_SECRET'];
const defaults = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mycrewmanager_db',
  PORT: '8001',
  AI_SERVICE_URL: 'http://localhost:8002',
  NODE_ENV: 'development',
};

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  Object.entries(defaults).forEach(([key, val]) => {
    if (!process.env[key]) process.env[key] = val;
  });
  return true;
}
