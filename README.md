# QuickPoll — Instant Real-Time Polling Platform

> **Live Deployment**: `[REPLACE_WITH_RENDER_LIVE_URL]`
> 
> **Interactive API Docs**: `[REPLACE_WITH_RENDER_LIVE_URL]/api/docs` (or `http://localhost:5000/api/docs` locally)
> 
> **Demo Video Walkthrough**: `[REPLACE_WITH_DEMO_VIDEO_LINK]`

---

## ⚡ Overview
**QuickPoll** is a lightweight, zero-login, real-time polling platform built for high-throughput ballot collection and instant result synchronization. Anyone can formulate a question with 2 to 10 options, share it via URL or vector QR code, and watch the results broadcast in real time across all connected browsers using Server-Sent Events (SSE).

**There is no user registration or login.** Creators receive a unique, secret administrative token that grants permissions to close or permanently delete their polls.

---

## ✨ Key Features
- **Zero-Friction Poll Creation**: Create dynamic single or multiple-choice polls in seconds with optional expiration time.
- **Real-Time Live Results (SSE)**: `GET /api/polls/:id/stream` provides immediate updates after every ballot submission, poll closure, or deletion with an automated 25-second heartbeat.
- **Resilient Connection Fallback**: The client automatically reconnects to SSE and gracefully falls back to **5-second polling** if the stream experiences repeated network failures.
- **Double-Vote Interception**: Deduplication enforced at the PostgreSQL database level using a compound primary key `(poll_id, voter_token)`.
- **Integrated QR Code & Link Sharing**: Mobile-friendly vector QR codes (`qrcode.react`) and 1-click clipboard copy for both ballot and result URLs.
- **Creator Moderation Tools**: Close polls early or delete them completely using a secret `x-admin-token`.
- **Trending Polls Feed**: Live community discovery feed ranking active polls by total vote engagement.
- **Mobile-First Responsive Design**: Optimized down to 360px viewport widths with tailored dark mode styling.

---

## 🛠️ Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide React, QRCode React, React Router 7.
- **Backend**: Node.js, Express, TypeScript, Server-Sent Events (SSE), Helmet, Cookie Parser, Express Rate Limit, `pg` connection pool.
- **Database**: PostgreSQL on Neon (Serverless Postgres with pooled connections & SSL).
- **API Documentation**: OpenAPI 3.0.3 with Swagger UI at `/api/docs`.
- **Testing**: Vitest & Supertest (covering creation, duplicate rejection, 20-parallel race conditions, closure, distinct cookies).

---

## 📸 Screenshots

### Desktop Views (1280px)
| Create Poll Page | Live Results & Chart |
| :---: | :---: |
| ![Desktop Create Poll](docs/screenshots/desktop_create.png) | ![Desktop Results](docs/screenshots/desktop_results.png) |

| Voting Ballot | Trending Community Feed |
| :---: | :---: |
| ![Desktop Vote](docs/screenshots/desktop_vote.png) | ![Desktop Trending](docs/screenshots/desktop_trending.png) |

| Creator Admin Moderation |
| :---: |
| ![Desktop Admin](docs/screenshots/desktop_admin.png) |

---

### Mobile Views (360px)
| Mobile Create | Mobile Ballot | Mobile Results |
| :---: | :---: | :---: |
| ![Mobile Create](docs/screenshots/mobile_create.png) | ![Mobile Vote](docs/screenshots/mobile_vote.png) | ![Mobile Results](docs/screenshots/mobile_results.png) |

| Mobile Trending | Mobile Admin |
| :---: | :---: |
| ![Mobile Trending](docs/screenshots/mobile_trending.png) | ![Mobile Admin](docs/screenshots/mobile_admin.png) |

---

## 🔗 Verified Demo Poll
A pre-seeded demonstration poll is available in the database:
- **Ballot Vote Page**: `/p/27e482c7-e098-4e5b-8bc9-92b1a79e1de8`
- **Live Results Page**: `/p/27e482c7-e098-4e5b-8bc9-92b1a79e1de8/results`
- **Creator Admin Page**: `/manage/27e482c7-e098-4e5b-8bc9-92b1a79e1de8?token=f6c5823c-5dab-4359-9659-6eaa94caa03d`

---

## 🔒 Security & Voter Identity Architecture

### 1. Zero Login / Frictionless Creator Administration
To maintain maximum accessibility, QuickPoll does not require users to create accounts.
- When a poll is created, the server generates a cryptographically random UUID `admin_token`.
- This token is returned once in the creation response and is **never** exposed in public poll endpoints.
- Privileged operations (`PATCH /api/polls/:id/close` and `DELETE /api/polls/:id`) require authentication via the `x-admin-token` header or request body.
- When opened via an administrative link (`?token=...`), the client stores the token in `localStorage` and scrubs the query parameter from the address bar using `history.replaceState` to prevent token leakage via copy-pasting or shoulder surfing.

### 2. Cookie-Based Voter Identity
- Each voter is identified by a server-set `httpOnly` cookie (`qp_voter`) with `SameSite=Lax`, `Secure` (in production), and a 1-year lifespan.
- When a voter views a poll, `GET /api/polls/:id` checks the voter's cookie against the database and returns `hasVoted: true`, allowing the client to present their recorded ballot status and navigate directly to live results.
- **Honest Security Limitations**:
  - Because identity is cookie-based, clearing browser cookies, using private/incognito browsing windows, or opening the poll in a different browser allows a user to vote again.
  - IP addresses are **not** used to restrict ballots to a single vote because shared networks (university campuses, corporate offices, coffee shops) share a single public IP, which would unfairly block legitimate co-located voters.
  - Instead, IP addresses are safeguarded via **sliding-window rate limiting** (20 poll creations/hour/IP and 30 votes/minute/IP) to defend against automated ballot stuffing scripts and DoS attacks.
  - The core guarantee against race conditions remains the atomic PostgreSQL primary key constraint `PRIMARY KEY (poll_id, voter_token)`.

### 3. Application Hardening
- **Helmet**: Secures HTTP headers while maintaining unbuffered SSE streaming and Swagger UI availability.
- **Payload Limits**: Strict 10kb JSON body limits on incoming requests.
- **Production Information Masking**: Generic error responses in production environments (`NODE_ENV=production`) ensuring internal stack traces and server internals are never exposed.

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 20+
- PostgreSQL database (or free [Neon](https://neon.tech) account)

### 2. Environment Variables
Create `.env` in `server/` (or `.env.local` in project root):
```env
DATABASE_URL=postgres://user:password@ep-example.pooler.region.neon.tech/neondb?sslmode=require
PG_POOL_MAX=25
PORT=5000
NODE_ENV=development
```

### 3. Installation & Run
```bash
# Build both client and server bundles
npm run build

# Run database schema migrations
npm --prefix server run migrate

# Run idempotent seed script (prints demo links)
npm --prefix server run seed

# Run automated Vitest + Supertest suite
npm --prefix server test

# Start unified production server
npm start
```

---

## ☁️ Deployment Guide (Render Single Web Service)

QuickPoll is designed to run as a single unified web service where Express delivers both the API endpoints and the compiled React frontend.

1. **Create Web Service on Render**:
   - Connect repository `hasanshahir/quickpoll`.
   - **Environment**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start` (runs migration then boots the server)
2. **Environment Variables on Render**:
   - `DATABASE_URL`: `postgres://[user]:[password]@[neon-host]/neondb?sslmode=require` (Pooled connection string)
   - `NODE_ENV`: `production`
   - `PG_POOL_MAX`: `25`
3. **Verify Deployment**:
   - Navigate to `https://your-service.onrender.com`
   - Test `/api/health` and `/api/docs`
