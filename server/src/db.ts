import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env, ../.env.local, or environment
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config();

const { Pool } = pg;

// Configurable connection pool size via PG_POOL_MAX env var (default 10)
const poolMax = parseInt(process.env.PG_POOL_MAX || '10', 10);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
  ssl: {
    rejectUnauthorized: false,
  },
});
