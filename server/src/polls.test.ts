import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from './app.js';
import { pool } from './db.js';

describe('QuickPoll API & Concurrency Tests', { timeout: 35000 }, () => {
  afterAll(async () => {
    // Close pool connections after test suite
    await pool.end();
  });

  it('1. should create a poll with options and return admin_token', async () => {
    const res = await request(app)
      .post('/api/polls')
      .send({
        question: 'What is your favorite TypeScript framework?',
        options: ['Next.js', 'Vite/React', 'Remix', 'Astro'],
        is_multiple_choice: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.poll).toBeDefined();
    expect(res.body.poll.id).toBeDefined();
    expect(res.body.poll.options).toHaveLength(4);
    expect(res.body.admin_token).toBeDefined();
  });

  it('2. should accept first vote and reject duplicate vote with 409 Conflict using agent cookie', async () => {
    // Create poll
    const pollRes = await request(app)
      .post('/api/polls')
      .send({
        question: 'Cookie-based duplicate ballot test',
        options: ['Option A', 'Option B'],
      });
    const pollId = pollRes.body.poll.id;
    const optionId = pollRes.body.poll.options[0].id;

    // Use supertest agent to persist httpOnly cookie across requests
    const voterAgent = request.agent(app);

    // Initial check: hasVoted should be false
    const preCheck = await voterAgent.get(`/api/polls/${pollId}`);
    expect(preCheck.status).toBe(200);
    expect(preCheck.body.hasVoted).toBe(false);

    // First vote -> 201
    const vote1 = await voterAgent
      .post(`/api/polls/${pollId}/vote`)
      .send({ option_ids: [optionId] });
    expect(vote1.status).toBe(201);
    expect(vote1.body.success).toBe(true);

    // Check after voting: hasVoted should now be true
    const postCheck = await voterAgent.get(`/api/polls/${pollId}`);
    expect(postCheck.status).toBe(200);
    expect(postCheck.body.hasVoted).toBe(true);

    // Second vote with same agent cookie -> 409
    const vote2 = await voterAgent
      .post(`/api/polls/${pollId}/vote`)
      .send({ option_ids: [optionId] });
    expect(vote2.status).toBe(409);
    expect(vote2.body.error).toMatch(/already voted/i);
  });

  it('3. should handle 20 parallel votes with the same voter token where exactly one succeeds', async () => {
    // Create fresh poll
    const pollRes = await request(app)
      .post('/api/polls')
      .send({
        question: 'High-concurrency duplicate ballot test',
        options: ['Candidate Alpha', 'Candidate Beta'],
      });
    const pollId = pollRes.body.poll.id;
    const optionId = pollRes.body.poll.options[0].id;
    const commonVoterToken = `voter_concurrent_${Date.now()}`;

    // Dispatch 20 concurrent ballot submissions using identical qp_voter cookie
    const requests = Array.from({ length: 20 }).map(() =>
      request(app)
        .post(`/api/polls/${pollId}/vote`)
        .set('Cookie', `qp_voter=${commonVoterToken}`)
        .send({
          option_ids: [optionId],
        })
    );

    const responses = await Promise.all(requests);

    const successCount = responses.filter((r) => r.status === 201).length;
    const conflictCount = responses.filter((r) => r.status === 409).length;

    expect(successCount).toBe(1);
    expect(conflictCount).toBe(19);
  });

  it('4. should reject votes on a closed poll with 403 Forbidden', async () => {
    // Create poll
    const pollRes = await request(app)
      .post('/api/polls')
      .send({
        question: 'Closure test poll',
        options: ['Yes', 'No'],
      });
    const pollId = pollRes.body.poll.id;
    const adminToken = pollRes.body.admin_token;
    const optionId = pollRes.body.poll.options[0].id;

    // Close poll via admin token
    const closeRes = await request(app)
      .patch(`/api/polls/${pollId}/close`)
      .set('x-admin-token', adminToken);
    expect(closeRes.status).toBe(200);

    // Attempt to vote on closed poll
    const voteRes = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Cookie', `qp_voter=fresh_voter_${Date.now()}`)
      .send({
        option_ids: [optionId],
      });

    expect(voteRes.status).toBe(403);
    expect(voteRes.body.error).toMatch(/poll is closed/i);
  });

  it('5. should allow two different voters (distinct cookies) to each vote once', async () => {
    // Create poll
    const pollRes = await request(app)
      .post('/api/polls')
      .send({
        question: 'Two distinct voters test',
        options: ['Option 1', 'Option 2'],
      });
    const pollId = pollRes.body.poll.id;
    const option1 = pollRes.body.poll.options[0].id;
    const option2 = pollRes.body.poll.options[1].id;

    const voter1Token = `voter_distinct_1_${Date.now()}`;
    const voter2Token = `voter_distinct_2_${Date.now()}`;

    // First voter votes
    const vote1 = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Cookie', `qp_voter=${voter1Token}`)
      .send({ option_ids: [option1] });
    expect(vote1.status).toBe(201);

    // Second voter votes
    const vote2 = await request(app)
      .post(`/api/polls/${pollId}/vote`)
      .set('Cookie', `qp_voter=${voter2Token}`)
      .send({ option_ids: [option2] });
    expect(vote2.status).toBe(201);

    // Fetch results: total_votes should be 2
    const results = await request(app).get(`/api/polls/${pollId}/results`);
    expect(results.status).toBe(200);
    expect(results.body.total_votes).toBe(2);
  });
});
