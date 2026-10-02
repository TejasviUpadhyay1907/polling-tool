# PulseP — Instant polls. Real-time results.

> GUVI Developer Internship submission  
> Stack: **React · Go + Gin · MongoDB · Redis**

---

## Project structure

```
polling tool/
├── frontend/          # React + Vite + Tailwind
├── backend/           # Go + Gin
│   ├── cmd/server/    # main.go entry point
│   └── internal/
│       ├── config/    # env config loader
│       ├── db/        # MongoDB + Redis connections & key helpers
│       ├── models/    # User, Poll, PollOption, SSEPayload
│       ├── middleware/ # JWT auth (RequireAuth, OptionalAuth)
│       ├── handlers/  # auth.go  poll.go  vote.go
│       └── services/  # poll service (Redis vote counts, pub/sub)
├── docker-compose.yml # MongoDB + Redis + backend
└── README.md
```

---

## Quick start (local)

### 1. Start MongoDB + Redis

```bash
docker compose up mongo redis -d
```

Or install and run them manually.

### 2. Backend

```bash
cd backend
cp .env.example .env          # edit JWT_SECRET at minimum
go run ./cmd/server
```

Backend runs at `http://localhost:8080`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/signup | — | Register |
| POST | /api/auth/login | — | Login → JWT |
| GET | /api/auth/me | ✓ | Current user |
| POST | /api/polls | ✓ | Create poll |
| GET | /api/polls/my | ✓ | My polls |
| GET | /api/polls/:id | — | Get poll + counts |
| PATCH | /api/polls/:id/toggle | ✓ | Open / close |
| DELETE | /api/polls/:id | ✓ | Delete |
| POST | /api/polls/:id/vote | — | Cast vote |
| GET | /api/polls/:id/stream | — | SSE live stream |

---

## How Redis is used (not just for show)

- **Vote counts** — stored as a Redis hash `pulsep:votes:<pollID>` with `HINCRBY` for atomic increments under concurrency
- **Duplicate prevention** — `SET pulsep:voter:<pollID>:<fingerprint> 1 NX EX 31536000` (set-if-not-exists, expires in 1 year)
- **Live updates** — `PUBLISH pulsep:channel:<pollID> <json>` on every vote; SSE handler subscribes with `SUBSCRIBE` and forwards to all connected browser clients

## How MongoDB is used

- **Source of truth** for poll structure, options, metadata, creator
- **Users collection** with unique email index
- **Polls collection** indexed by `creatorId` and `createdAt`
- Vote counts are intentionally kept in Redis (not MongoDB) for performance — they are synced back only if needed

---

## Key design decisions

1. **SSE over WebSockets** — votes only flow server → client; SSE is simpler, works behind proxies without extra config, natively reconnects.
2. **Redis HINCRBY for atomicity** — no race conditions possible even under burst traffic.
3. **JWT in query param for SSE** — `EventSource` can't set headers; the token is accepted via `?token=` query parameter for the stream endpoint only.
4. **Graceful shutdown** — `SIGINT`/`SIGTERM` triggers a 10-second drain window so in-flight SSE connections close cleanly.

---

## Deploy

```bash
# Set JWT_SECRET in environment, then:
docker compose up -d
```

All three services (MongoDB, Redis, Go backend) start together.  
Point your frontend `VITE_API_URL` at the backend URL.
