# QuickPoll

QuickPoll is a web application for creating and voting on polls in real time without creating an account or logging in.

- Live URL: https://quickpoll-pt1z.onrender.com
- API Docs: https://quickpoll-pt1z.onrender.com/api/docs
- Demo Video: [REPLACE_WITH_DEMO_VIDEO_LINK]

## Demo Poll

The database has a pre-seeded demonstration poll:
- Voter page: https://quickpoll-pt1z.onrender.com/p/27e482c7-e098-4e5b-8bc9-92b1a79e1de8
- Results page: https://quickpoll-pt1z.onrender.com/p/27e482c7-e098-4e5b-8bc9-92b1a79e1de8/results
- Admin page: https://quickpoll-pt1z.onrender.com/manage/27e482c7-e098-4e5b-8bc9-92b1a79e1de8?token=f6c5823c-5dab-4359-9659-6eaa94caa03d

Note: The app has no user accounts or login. When a poll is created, the server generates a secret admin token. The creator uses this token to close voting or delete the poll.

## Features

- Create polls with 2 to 10 options, optional multiple choice, and optional expiration date.
- Vote with single or multiple selections depending on poll settings.
- Real-time live results streamed via Server-Sent Events (SSE).
- Automatic reconnection with a 5-second polling fallback if the live stream disconnects.
- Shareable links and QR codes for voting and results pages.
- Trending page showing polls ordered by total vote count.
- Admin management to close voting early or delete a poll.
- Duplicate vote prevention using database constraints and cookies.

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, qrcode.react
- Backend: Node.js, Express, TypeScript, Server-Sent Events, pg (node-postgres), cookie-parser, helmet, express-rate-limit
- Database: PostgreSQL (hosted on Neon)
- Testing: Vitest, Supertest
- API Documentation: OpenAPI 3.0 with Swagger UI

## How It Works

- Request Flow: The React frontend sends HTTP requests to Express API routes. Express runs parameterized queries against PostgreSQL via a connection pool.
- Votes and Unique Constraint: When a client visits the site, Express assigns an httpOnly cookie (`qp_voter`) containing a UUID. When voting, the server inserts a row into `poll_voters (poll_id, voter_token)`. Because `(poll_id, voter_token)` is a compound primary key, a second vote from the same cookie causes PostgreSQL to throw error `23505` (`unique_violation`). The backend catches this error and responds with HTTP 409 Conflict. This guarantees that race conditions (such as parallel vote requests) cannot record duplicate ballots.
- Server-Sent Events: When a client views results, it opens a persistent GET connection to `/api/polls/:id/stream`. The server sends current results immediately and keeps the connection open with a heartbeat comment sent every 25 seconds to prevent proxy timeouts. Whenever a vote is committed, a poll is closed, or a poll is deleted, the backend recalculates results and broadcasts the updated data to all connected clients for that poll. If the connection fails, the frontend automatically falls back to polling the results endpoint every 5 seconds.

## Environment Variables

The server uses the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string with SSL enabled (`postgres://...sslmode=require`).
- `PORT`: HTTP port for the Express server (default: `5000`).
- `PG_POOL_MAX`: Maximum number of database pool connections (default: `10`, set to `25` for high concurrency).
- `NODE_ENV`: Set to `production` when deployed.

Example `.env` file for `server/`:
```env
DATABASE_URL=postgres://user:password@ep-example.neon.tech/neondb?sslmode=require
PG_POOL_MAX=25
PORT=5000
NODE_ENV=development
```

## Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/hasanshahir/quickpoll.git
   cd quickpoll
   ```

2. Install dependencies:
   ```bash
   npm --prefix client install
   npm --prefix server install
   ```

3. Set up the database:
   Create a `.env` file in `server/` with your `DATABASE_URL`. Run the migration script to create tables:
   ```bash
   npm --prefix server run migrate
   ```

   (Optional) Seed the demo poll:
   ```bash
   npm --prefix server run seed
   ```

4. Run tests:
   ```bash
   npm --prefix server test
   ```

5. Run in development:
   In one terminal, start the backend:
   ```bash
   npm --prefix server run dev
   ```
   In another terminal, start the frontend:
   ```bash
   npm --prefix client run dev
   ```

6. Build and run production locally:
   ```bash
   npm run build
   npm start
   ```

## Deployment

The application is deployed on Render as a single web service where Express serves the API routes and the built React frontend (`client/dist`).

- Service Type: Web Service (Node)
- Build Command: `npm run build`
- Start Command: `npm run start` (runs `migrate` then starts `node dist/index.js`)
- Environment Variables on Render:
  - `DATABASE_URL`: Neon PostgreSQL pooled connection string
  - `NODE_ENV`: `production`
  - `PG_POOL_MAX`: `25`

## Known Limitations

- Voter Identity is Cookie-Based: Because QuickPoll requires no login, voter identity relies on a server-set httpOnly cookie. If a user clears their browser cookies, opens a private or incognito window, or switches browsers, they will receive a new cookie and can vote again. IP-based blocking was avoided because users on shared networks (such as universities, schools, or offices) share a public IP and would be blocked from voting. Rate limiting (30 votes per minute per IP) is used instead to prevent scripted ballot stuffing.
- Free Tier Sleep: The free Render instance spins down after 15 minutes of inactivity. When asleep, the first incoming request can take approximately 50 seconds while the server spins back up.

## Screenshots

### Desktop Views

- Create Poll:
  ![Create Poll](docs/screenshots/desktop_create.png)

- Voting Ballot:
  ![Voting Ballot](docs/screenshots/desktop_vote.png)

- Live Results:
  ![Live Results](docs/screenshots/desktop_results.png)

- Trending Feed:
  ![Trending Feed](docs/screenshots/desktop_trending.png)

- Admin Moderation:
  ![Admin Moderation](docs/screenshots/desktop_admin.png)

### Mobile Views

- Mobile Create:
  ![Mobile Create](docs/screenshots/mobile_create.png)

- Mobile Vote:
  ![Mobile Vote](docs/screenshots/mobile_vote.png)

- Mobile Results:
  ![Mobile Results](docs/screenshots/mobile_results.png)

- Mobile Trending:
  ![Mobile Trending](docs/screenshots/mobile_trending.png)

- Mobile Admin:
  ![Mobile Admin](docs/screenshots/mobile_admin.png)
