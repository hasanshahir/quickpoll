import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { pollsRouter } from './routes/polls.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/polls', pollsRouter);

app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW() as server_time, version()');
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].server_time,
      db_version: result.rows[0].version
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Database connection failed' });
  }
});

app.listen(PORT, () => {
  console.log(`QuickPoll Server running on http://localhost:${PORT}`);
});
