import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import yaml from 'yaml';
import { pool } from './db.js';
import { pollsRouter } from './routes/polls.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

app.set('trust proxy', 1);

// Helmet headers (relaxed CSP for Swagger UI)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// Assign voter UUID cookie if missing
app.use((req: Request, res: Response, next: NextFunction) => {
  let voterToken = req.cookies?.qp_voter;
  if (!voterToken || typeof voterToken !== 'string') {
    voterToken = crypto.randomUUID();
    res.cookie('qp_voter', voterToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });
  }
  (req as any).voterToken = voterToken;
  next();
});

// API Documentation via Swagger UI at /api/docs
const openApiCandidates = [
  path.resolve(__dirname, '../../docs/openapi.yaml'),
  path.resolve(__dirname, '../docs/openapi.yaml'),
  path.resolve(process.cwd(), 'docs/openapi.yaml'),
];
const resolvedOpenApi = openApiCandidates.find((c) => fs.existsSync(c));

if (resolvedOpenApi) {
  try {
    const yamlContent = fs.readFileSync(resolvedOpenApi, 'utf8');
    const swaggerDoc = yaml.parse(yamlContent);
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  } catch (err) {
    console.error('Failed to initialize Swagger UI documentation:', err);
  }
}

// API Routes
app.use('/api/polls', pollsRouter);

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time, version()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].server_time,
      db_version: result.rows[0].version,
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

// Serve client build
const distCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientDistPath = distCandidates.find((candidate) => fs.existsSync(candidate));

if (clientDistPath) {
  app.use(express.static(clientDistPath));

  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    error: isProd ? 'Internal Server Error' : err.message || 'Internal Server Error',
  });
});
