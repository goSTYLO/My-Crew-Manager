import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.JWT_SECRET && process.env.SECRET_KEY) process.env.JWT_SECRET = process.env.SECRET_KEY;
const required = ['SECRET_KEY', 'JWT_SECRET'];
const defaults = {
  MONGODB_URI: 'mongodb://localhost:27017/my_crew_manager',
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
