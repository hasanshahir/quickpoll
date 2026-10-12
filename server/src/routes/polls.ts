import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { sseHub } from '../sse/hub.js';

export const pollsRouter = Router();

/**
 * Parameterized helper to fetch and aggregate current poll results.
 * Returns null if the poll ID is not found.
 */
export async function fetchPollResultsData(pollId: string) {
  // Parameterized query retrieving poll metadata and closed/expiration status
  const pollResult = await pool.query(
    `SELECT id, question, is_multiple_choice, is_closed, expires_at, created_at 
     FROM polls 
     WHERE id = $1`,
    [pollId]
  );

  if (pollResult.rows.length === 0) {
    return null;
  }

  const poll = pollResult.rows[0];
  const isExpired = poll.expires_at && new Date() > new Date(poll.expires_at);

  // Parameterized aggregation query tallying votes per option
  const results = await pool.query(
    `SELECT 
       o.id AS option_id,
       o.option_text,
       COUNT(v.id)::INT AS votes
     FROM options o
     LEFT JOIN votes v ON o.id = v.option_id
     WHERE o.poll_id = $1
     GROUP BY o.id, o.option_text
     ORDER BY o.created_at ASC`,
    [pollId]
  );

  const totalVotes = results.rows.reduce((sum, row) => sum + row.votes, 0);
  const formattedOptions = results.rows.map((row) => ({
    ...row,
    percentage: totalVotes > 0 ? Number(((row.votes / totalVotes) * 100).toFixed(1)) : 0
  }));

  return {
    poll: {
      ...poll,
      is_closed: poll.is_closed || Boolean(isExpired)
    },
    total_votes: totalVotes,
    results: formattedOptions
  };
}

// 1. Create a Poll (Transaction: insert poll + insert options)
pollsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { question, options, is_multiple_choice, expires_at } = req.body;

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    res.status(400).json({ error: 'Question is required.' });
    return;
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 10) {
    res.status(400).json({ error: 'A poll must have between 2 and 10 options.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Parameterized query inserting new poll record with optional expiry
    const pollResult = await client.query(
      `INSERT INTO polls (question, is_multiple_choice, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, question, is_multiple_choice, admin_token, expires_at, created_at`,
      [question.trim(), Boolean(is_multiple_choice), expires_at ? new Date(expires_at) : null]
    );

    const poll = pollResult.rows[0];

    const insertedOptions = [];
    for (const optText of options) {
      if (typeof optText !== 'string' || optText.trim().length === 0) {
        throw new Error('Option text cannot be empty.');
      }
      // Parameterized query inserting each option for the poll
      const optionResult = await client.query(
        `INSERT INTO options (poll_id, option_text)
         VALUES ($1, $2)
         RETURNING id, option_text`,
        [poll.id, optText.trim()]
      );
      insertedOptions.push(optionResult.rows[0]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      poll: {
        id: poll.id,
        question: poll.question,
        is_multiple_choice: poll.is_multiple_choice,
        expires_at: poll.expires_at,
        created_at: poll.created_at,
        options: insertedOptions
      },
      admin_token: poll.admin_token
    });
  } catch (error: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message || 'Failed to create poll.' });
  } finally {
    client.release();
  }
});

// 2. Fetch Poll Details for Voting (excludes admin_token)
pollsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Parameterized query fetching poll details without leaking admin token
    const pollResult = await pool.query(
      `SELECT id, question, is_multiple_choice, is_closed, expires_at, created_at
       FROM polls WHERE id = $1`,
      [id]
    );

    if (pollResult.rows.length === 0) {
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    const poll = pollResult.rows[0];
    const isExpired = poll.expires_at && new Date() > new Date(poll.expires_at);

    // Parameterized query retrieving options for the poll
    const optionsResult = await pool.query(
      `SELECT id, option_text FROM options WHERE poll_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({
      ...poll,
      is_closed: poll.is_closed || Boolean(isExpired),
      options: optionsResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch poll.' });
  }
});

// 3. Submit Vote (Atomic transaction enforcing duplicate prevention via 23505)
pollsRouter.post('/:id/vote', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { option_ids, voter_token } = req.body;

  if (!voter_token || typeof voter_token !== 'string') {
    res.status(400).json({ error: 'Voter token identifier is required.' });
    return;
  }

  if (!Array.isArray(option_ids) || option_ids.length === 0) {
    res.status(400).json({ error: 'At least one option must be selected.' });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Parameterized check of poll status and rules
    const pollResult = await client.query(
      `SELECT is_closed, is_multiple_choice, expires_at FROM polls WHERE id = $1`,
      [id]
    );

    if (pollResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    const poll = pollResult.rows[0];
    if (poll.is_closed || (poll.expires_at && new Date() > new Date(poll.expires_at))) {
      await client.query('ROLLBACK');
      res.status(403).json({ error: 'Poll is closed.' });
      return;
    }

    if (!poll.is_multiple_choice && option_ids.length > 1) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'This poll accepts only a single selection.' });
      return;
    }

    // 1. Insert voter record (Triggers unique constraint 23505 if already voted)
    await client.query(
      `INSERT INTO poll_voters (poll_id, voter_token) VALUES ($1, $2)`,
      [id, voter_token]
    );

    // 2. Insert vote rows
    for (const optionId of option_ids) {
      await client.query(
        `INSERT INTO votes (poll_id, option_id) VALUES ($1, $2)`,
        [id, optionId]
      );
    }

    await client.query('COMMIT');

    // Broadcast fresh results to all active SSE subscribers after committed vote
    fetchPollResultsData(id).then((freshResults) => {
      if (freshResults) {
        sseHub.broadcast(id, freshResults);
      }
    }).catch((err) => {
      console.error('Failed to broadcast updated results after vote:', err);
    });

    res.status(201).json({ success: true, message: 'Vote registered successfully.' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      res.status(409).json({ error: 'You have already voted on this poll.' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to register vote.' });
  } finally {
    client.release();
  }
});

// 4. Poll Results Aggregation (SQL GROUP BY + Percentages)
pollsRouter.get('/:id/results', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const data = await fetchPollResultsData(id);
    if (!data) {
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to aggregate results.' });
  }
});

// 4b. Live SSE Stream for Poll Results (text/event-stream)
pollsRouter.get('/:id/stream', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Set mandatory SSE headers: disable cache and proxy buffering
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  try {
    const initialData = await fetchPollResultsData(id);
    if (!initialData) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: 'Poll not found' })}\n\n`);
      res.end();
      return;
    }

    // Send current results immediately on connect
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    // Subscribe connection to real-time events with 25s heartbeat comment
    const cleanup = sseHub.subscribe(id, res);

    req.on('close', () => {
      cleanup();
    });
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'Failed to load poll stream' })}\n\n`);
    res.end();
  }
});

// 5. Trending Polls (Sorted by engagement)
pollsRouter.get('/feed/trending', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Parameterized query retrieving top active polls by vote count
    const trending = await pool.query(
      `SELECT 
         p.id,
         p.question,
         p.created_at,
         p.is_closed,
         COUNT(v.id)::INT AS total_votes
       FROM polls p
       LEFT JOIN votes v ON p.id = v.poll_id
       GROUP BY p.id
       ORDER BY total_votes DESC, p.created_at DESC
       LIMIT 10`
    );

    res.json({ trending: trending.rows });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending polls.' });
  }
});

// 6. Creator Admin: Close Poll Early
pollsRouter.patch('/:id/close', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminToken = req.headers['x-admin-token'] || req.body.admin_token;

  try {
    // Parameterized update securing poll closure with admin token verification
    const result = await pool.query(
      `UPDATE polls 
       SET is_closed = TRUE 
       WHERE id = $1 AND admin_token = $2 
       RETURNING id, is_closed`,
      [id, adminToken]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Invalid admin token or poll not found.' });
      return;
    }

    // Broadcast updated results reflecting closed status to all subscribers
    fetchPollResultsData(id).then((freshResults) => {
      if (freshResults) {
        sseHub.broadcast(id, freshResults);
      }
    }).catch((err) => {
      console.error('Failed to broadcast updated results after close:', err);
    });

    res.json({ message: 'Poll closed successfully.', poll: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to close poll.' });
  }
});

// 7. Creator Admin: Delete Poll
pollsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminToken = req.headers['x-admin-token'] || req.body.admin_token;

  try {
    // Parameterized delete securing poll removal with admin token verification
    const result = await pool.query(
      `DELETE FROM polls WHERE id = $1 AND admin_token = $2 RETURNING id`,
      [id, adminToken]
    );

    if (result.rows.length === 0) {
      res.status(403).json({ error: 'Invalid admin token or poll not found.' });
      return;
    }

    // Broadcast deletion event to SSE subscribers
    sseHub.broadcast(id, { deleted: true, poll_id: id }, 'deleted');

    res.json({ message: 'Poll deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete poll.' });
  }
});
