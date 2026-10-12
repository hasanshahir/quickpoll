# QuickPoll — Instant Real-Time Polling Platform

> Live Production URL: `[REPLACE_WITH_RENDER_LIVE_URL]`
> 
> Swagger API Documentation: `[REPLACE_WITH_RENDER_LIVE_URL]/api/docs` (or `http://localhost:5000/api/docs` locally)

---

## ⚡ Overview
**QuickPoll** is a high-performance, real-time polling application designed for speed, simplicity, and transactional integrity. Anyone can create a poll in seconds, share it via URL or mobile QR code, and watch results update live without refreshing. 

**QuickPoll requires no account or login.** Creators receive a unique, secret administrative token that grants permissions to close or delete their polls.

---

## ✨ Key Features
- **Instant Poll Creation**: Question and 2–10 options, single or multiple-choice, optional expiration time.
- **Server-Sent Events (SSE) Live Results**: `GET /api/polls/:id/stream` broadcasts instant updates across all connected browsers whenever a ballot is committed. Automatic 5-second polling fallback if EventSource encounters network interruption.
- **Strict Double-Vote Prevention**: Enforces one ballot per voter per poll at the PostgreSQL database level using a compound unique primary key `(poll_id, voter_token)`. Concurrency-safe against race conditions.
- **QR Code & Link Sharing**: Instant 1-click clipboard copy and rendered vector QR codes (`qrcode.react`) for both voting ballots and live results.
- **Creator Moderation**: Creators can close polls early or permanently delete polls using their private `x-admin-token`.
- **Engagement Feed**: Trending feed dynamically calculates and displays community polls ordered by activity.
- **Mobile-First Experience**: Fully responsive interface tested down to 360px viewport width with dark theme aesthetics.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, QRCode React, React Router 7.
- **Backend**: Node.js, Express, TypeScript, Server-Sent Events (SSE), connection pooling (`pg`).
- **Database**: PostgreSQL on Neon (Serverless Postgres with pooled connections & SSL).
- **API Documentation**: OpenAPI 3.0.3 with Swagger UI at `/api/docs`.
- **Testing**: Vitest & Supertest (covering creation, double voting, 20-parallel race conditions, closure).

---

## 📸 Screenshots

### Desktop View
```
+--------------------------------------------------------------------------+
|  [SCREENSHOT_PLACEHOLDER: Desktop Live Results with Animated Bar Charts]  |
+--------------------------------------------------------------------------+
```

### Mobile View (360px)
```
+---------------------------------------+
|  [SCREENSHOT_PLACEHOLDER: Mobile]     |
|  [Ballot Form & QR Code Modal]        |
+---------------------------------------+
```

---

## 🔗 Seeded Demo Poll Links
A verified live demo poll is seeded in the database:
- **Vote Page**: `/p/27e482c7-e098-4e5b-8bc9-92b1a79e1de8`
- **Live Results Page**: `/p/27e482c7-e098-4e5b-8bc9-92b1a79e1de8/results`
- **Creator Admin Page**: `/manage/27e482c7-e098-4e5b-8bc9-92b1a79e1de8?token=f6c5823c-5dab-4359-9659-6eaa94caa03d`

---

## 🔒 Security & Voter Identity Architecture

### No Authentication / Zero Login
QuickPoll is intentionally frictionless — users do not need an account or login to vote or create polls.
- **Creator Admin Security**: When a poll is created, the server generates a cryptographically random UUID `admin_token`. This token is returned once in the creation response and never exposed in public poll endpoints. All privileged actions (`PATCH /api/polls/:id/close` and `DELETE /api/polls/:id`) strictly require `x-admin-token`.
- **Ballot Deduplication**:
  - The client generates and persists a unique `voter_token` identifier.
  - The PostgreSQL database enforces a compound primary key `(poll_id, voter_token)` on the `poll_voters` table.
  - Simultaneous or duplicate ballot submissions trigger PostgreSQL error code `23505` (`unique_violation`), which the server intercepts and translates to HTTP `409 Conflict`.
- **Voter Identity Limitations**:
  - Because QuickPoll does not require user accounts, voter tokens stored in `localStorage` or device cookies can be cleared by end users or bypassed in incognito windows. For higher assurance against fraud without requiring user login, device fingerprinting or server-managed secure cookies can be used, but the primary ballot integrity guarantee rests on the atomic database unique constraint.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (or free [Neon](https://neon.tech) account)

### 2. Environment Variables
Create a `.env` file in `server/` (or `.env.local` in project root):
```env
DATABASE_URL=postgres://user:password@ep-example.pooler.region.neon.tech/neondb?sslmode=require
PORT=5000
NODE_ENV=development
```

### 3. Installation & Run
```bash
# Install root, client, and server dependencies
npm run build

# Run database schema migration
npm --prefix server run migrate

# Optional: Seed demo poll
npm --prefix server run seed

# Run tests
npm --prefix server test

# Start local server (serves API on :5000 and client build)
npm start
```

For frontend HMR development:
```bash
# Run backend dev watcher
cd server && npm run dev

# In another terminal, run frontend Vite dev server
cd client && npm run dev
```

---

## ☁️ Deployment Guide (Render Single Web Service)

QuickPoll is configured to deploy as a unified single Render Web Service where Express serves both the REST/SSE APIs and the compiled Vite React frontend (`client/dist`).

1. **Create Web Service on Render**:
   - Connect your GitHub repository.
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start` (automatically executes migration then launches Express server)
2. **Environment Variables on Render**:
   - `DATABASE_URL`: `postgres://[user]:[password]@[neon-host]/neondb?sslmode=require`
   - `NODE_ENV`: `production`
3. **Verify Deployment**:
   - Access `https://your-service.onrender.com`
   - Access `https://your-service.onrender.com/api/docs` for Swagger UI
   - Access `https://your-service.onrender.com/api/health` for database health status
