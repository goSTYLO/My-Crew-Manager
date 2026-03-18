import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';
process.env.JWT_SECRET = process.env.JWT_SECRET || process.env.SECRET_KEY;
process.env.DISABLE_2FA = process.env.DISABLE_2FA ?? 'true';

// Ensure DATABASE_URL for Prisma before any imports
if (!process.env.DATABASE_URL && process.env.DB_NAME) {
  const dbName = `${String(process.env.DB_NAME).replace(/_?$/, '')}_test`;
  const user = process.env.DB_USER || 'postgres';
  const pass = process.env.DB_PASSWORD || '';
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '5432';
  process.env.DATABASE_URL = `postgresql://${user}:${encodeURIComponent(pass)}@${host}:${port}/${dbName}`;
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/mycrewmanager_test';
}
