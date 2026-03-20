import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

if (!process.env.DATABASE_URL && process.env.POSTGRES_URI) {
  process.env.DATABASE_URL = process.env.POSTGRES_URI;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DB health tests require DATABASE_URL or POSTGRES_URI in the environment (or .env). ' +
      'No default database is assumed.',
  );
}
