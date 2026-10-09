# PulseP — Instant polls. Real-time results.

<div align="center">

![PulseP](https://img.shields.io/badge/PulseP-Live%20Polling-aed6b6?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMyAxNSBMNyA5IEwxMSAxNyBMMTUgNiBMMTkgMTIgTDIxIDEyIiBzdHJva2U9IiNhZWQ2YjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Go](https://img.shields.io/badge/Go_1.22-00ADD8?style=for-the-badge&logo=go&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

**Create a poll · Share a link · Watch votes land live**

[🌐 Live App](https://polling-tool-ecru.vercel.app) · [⚙️ Backend API](https://pulsep-backend.onrender.com/health) · [📦 GitHub](https://github.com/TejasviUpadhyay1907/polling-tool)

</div>

---

## 🔥 What is PulseP?

PulseP is a **live polling tool** built for classrooms, team standups, and events. Create a poll, share the link or QR code, and watch votes come in live — no page refresh, ever.

**The flow is simple:**
```
Create poll → Share link → Audience votes → Live results ⚡
```

---

## 🚀 Live Deployment

| Service | URL | Platform |
|---------|-----|----------|
| 🌐 **Frontend** | [polling-tool-ecru.vercel.app](https://polling-tool-ecru.vercel.app) | Vercel |
| ⚙️ **Backend API** | [pulsep-backend.onrender.com](https://pulsep-backend.onrender.com) | Render |
| 🗄️ **Database** | MongoDB Atlas (Mumbai) | Atlas M0 Free |
| ⚡ **Redis** | Upstash Redis (Mumbai) | Upstash Free |

> ⚠️ The backend is on Render's free tier — it may take **30–50 seconds** to wake up after inactivity. Open the [health check URL](https://pulsep-backend.onrender.com/health) first, wait for `{"status":"ok"}`, then use the app.

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 + Vite + Tailwind CSS | Fast, component-based UI |
| **Backend** | Go + Gin | High performance, concurrent SSE handling |
| **Database** | MongoDB | Flexible document store for polls + users |
| **Realtime** | Redis (pub/sub + HINCRBY) | Atomic vote counts + instant broadcast |
| **Auth** | JWT + bcrypt | Stateless, secure |
| **Deploy** | Vercel + Render | Zero config, free tier |

---

## 📁 Project Structure

```
polling-tool/
├── frontend/                   # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/              # Landing, Auth, Dashboard, CreatePoll, PollView
│   │   ├── components/         # UI components + poll-specific components
│   │   ├── hooks/              # usePollStream (SSE hook)
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── api/                # Axios client + endpoint functions
│   │   └── utils/              # helpers, color tokens
│   ├── .env.example
│   └── vercel.json             # SPA routing config
│
├── backend/                    # Go + Gin
│   ├── cmd/server/main.go      # Entry point + route wiring
│   └── internal/
│       ├── config/             # Env var loader (.env support)
│       ├── db/                 # MongoDB + Redis connections
│       ├── models/             # User, Poll, PollOption, SSEPayload
│       ├── middleware/         # JWT RequireAuth + OptionalAuth
│       ├── handlers/           # auth.go · poll.go · vote.go
│       └── services/           # Redis vote counting + pub/sub
│
├── docker-compose.yml          # Local dev: mongo + redis containers
├── DEPLOY.md                   # Full deployment guide
└── README.md
```

---

## ⚡ How Real-Time Works

This is the core of the application — Redis drives every live update:

```
User votes
    │
    ▼
Go backend → HINCRBY pulsep:votes:<pollId> <optionId> 1   (atomic +1)
    │
    ▼
Go backend → PUBLISH pulsep:channel:<pollId> <updated_poll_json>
    │
    ▼
Redis broadcasts to all subscribers
    │
    ▼
Every connected browser (SSE stream) receives the update
    │
    ▼
React updates state → Framer Motion animates the bars 🎉
```

**Why not WebSockets?** Votes only flow one direction (server → client). SSE is simpler, works behind proxies without configuration, and natively reconnects on disconnect.

**Why Redis HINCRBY?** It's atomic — no race conditions under any amount of concurrent traffic. 1000 votes at the exact same millisecond = perfectly accurate count.

---

## 🔒 Security & Validation

- All input validated **server-side** before touching MongoDB (length, format, uniqueness)
- Passwords hashed with **bcrypt** (never stored in plain text)
- JWT tokens expire after **30 days**
- **Duplicate vote prevention**: Redis `SET NX` fingerprint (IP + User-Agent) with 1-year expiry
- CORS locked to the frontend domain in production

---

## 🖥️ Running Locally

### Prerequisites

- [Go 1.22+](https://go.dev/dl/)
- [Node.js 18+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for MongoDB + Redis)

### 1. Clone the repo

```bash
git clone https://github.com/TejasviUpadhyay1907/polling-tool.git
cd polling-tool
```

### 2. Start MongoDB + Redis

```bash
docker compose up mongo redis -d
```

### 3. Start the backend

```bash
cd backend
cp .env.example .env
# Open .env and set JWT_SECRET to any random 32+ char string
go run ./cmd/server
```

Backend runs at → `http://localhost:8080`
Health check → `http://localhost:8080/health`

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

### 5. Open the app

Go to `http://localhost:5173` → Sign up → Create a poll → Share the link → Vote from another tab → Watch the bars update live!

---

## 🌐 API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/auth/signup` | — | `{ name, email, password }` | Create account → returns JWT |
| `POST` | `/auth/login` | — | `{ email, password }` | Login → returns JWT |
| `GET` | `/auth/me` | ✅ | — | Get current user |

### Polls

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/polls` | ✅ | Create a new poll |
| `GET` | `/polls/my` | ✅ | Get all polls created by me |
| `GET` | `/polls/:id` | — | Get poll with live vote counts |
| `PATCH` | `/polls/:id/toggle` | ✅ | Open / close a poll |
| `DELETE` | `/polls/:id` | ✅ | Delete a poll |
| `POST` | `/polls/:id/vote` | — | Cast a vote |
| `GET` | `/polls/:id/stream` | — | SSE stream for live updates |

### Auth header
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

```env
PORT=8080
APP_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017
MONGO_DB=pulsep

# Redis
REDIS_ADDR=localhost:6379
REDIS_PASS=

# JWT — generate with: openssl rand -hex 32
JWT_SECRET=your_secret_here
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8080
```

---

## 🎨 Key Features

- ✅ **Live results** — votes appear instantly across all connected browsers via SSE + Redis pub/sub
- ✅ **No signup to vote** — anyone with the link can vote, no account needed
- ✅ **QR code sharing** — every poll has a scannable QR code, perfect for projecting on a screen
- ✅ **Duplicate vote prevention** — Redis `SET NX` fingerprint blocks repeat votes server-side
- ✅ **Poll management** — creators can open/close polls, delete them, copy share links
- ✅ **Dark + Light mode** — full theme toggle with CSS variables, persisted to localStorage
- ✅ **Sliding auth UI** — animated split-panel login/signup with spring physics
- ✅ **Mobile responsive** — works on phones (for voters), no native app needed
- ✅ **Graceful shutdown** — Go server drains SSE connections cleanly on SIGTERM

---

## 🏗️ Key Design Decisions

**1. SSE over WebSockets**
Votes only flow server → client. SSE is simpler, works behind all proxies, and reconnects automatically. No extra infrastructure needed.

**2. Redis as the realtime engine**
Vote counts live in Redis (not MongoDB) for speed. `HINCRBY` is atomic — no locks, no race conditions. MongoDB is the source of truth for poll structure; Redis is the source of truth for counts.

**3. Goroutine leak prevention**
Each SSE connection in Go uses `context.Done()` in a `select` statement. When the browser disconnects, the context cancels, the Redis subscription closes, and the goroutine exits cleanly.

**4. JWT in query param for SSE**
`EventSource` API in browsers cannot set custom headers. The JWT is accepted via `?token=` query param for the stream endpoint, and validated the same way.

---

## 📧 Submission

**GitHub:** https://github.com/TejasviUpadhyay1907/polling-tool

**Live App:** https://polling-tool-ecru.vercel.app

**Submitted to:** devhiring@hclguvi.com

---

<div align="center">
  Built by <strong>Tejasvi Upadhyay</strong> for the GUVI Developer Internship · 2026
</div>
