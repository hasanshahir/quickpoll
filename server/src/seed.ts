import { pool } from './db.js';

async function seed() {
  console.log('Seeding QuickPoll database with demo poll and baseline votes...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Parameterized insert for demonstration poll
    const pollResult = await client.query(
      `INSERT INTO polls (question, is_multiple_choice, is_closed)
       VALUES ($1, $2, $3)
       RETURNING id, question, admin_token`,
      ['What is your top priority for modern web applications?', false, false]
    );

    const poll = pollResult.rows[0];

    // 2. Insert answer options
    const options = [
      'Real-time responsiveness (SSE / WebSockets)',
      'Sub-second initial page load & Edge caching',
      'Stunning glassmorphism & rich micro-animations',
      'End-to-end type safety & transactional integrity',
    ];

    const optionIds: string[] = [];
    for (const optText of options) {
      // Parameterized insert of each poll option
      const optResult = await client.query(
        `INSERT INTO options (poll_id, option_text)
         VALUES ($1, $2)
         RETURNING id`,
        [poll.id, optText]
      );
      optionIds.push(optResult.rows[0].id);
    }

    // 3. Seed baseline ballots from simulated voters
    const simulatedVotes = [
      { voter: 'voter_seed_1', optIndex: 0 },
      { voter: 'voter_seed_2', optIndex: 0 },
      { voter: 'voter_seed_3', optIndex: 0 },
      { voter: 'voter_seed_4', optIndex: 1 },
      { voter: 'voter_seed_5', optIndex: 1 },
      { voter: 'voter_seed_6', optIndex: 2 },
      { voter: 'voter_seed_7', optIndex: 3 },
    ];

    for (const item of simulatedVotes) {
      // Record voter
      await client.query(
        `INSERT INTO poll_voters (poll_id, voter_token)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [poll.id, item.voter]
      );

      // Record cast vote
      await client.query(
        `INSERT INTO votes (poll_id, option_id)
         VALUES ($1, $2)`,
        [poll.id, optionIds[item.optIndex]]
      );
    }

    await client.query('COMMIT');

    console.log('\n======================================================');
    console.log(' DEMO POLL CREATED SUCCESSFULLY');
    console.log('======================================================');
    console.log(`Poll ID:        ${poll.id}`);
    console.log(`Question:       "${poll.question}"`);
    console.log(`Admin Token:    ${poll.admin_token}`);
    console.log('------------------------------------------------------');
    console.log(`Voting URL:     /p/${poll.id}`);
    console.log(`Results URL:    /p/${poll.id}/results`);
    console.log(`Admin Manage:   /manage/${poll.id}?token=${poll.admin_token}`);
    console.log('======================================================\n');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed script encountered error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
