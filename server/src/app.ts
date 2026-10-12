import express, { Request, Response } from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json());

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

// Serve client/dist static assets for unified single-service deployment
const distCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
];
const clientDistPath = distCandidates.find((candidate) => fs.existsSync(candidate));

if (clientDistPath) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all non-/api routes
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}
