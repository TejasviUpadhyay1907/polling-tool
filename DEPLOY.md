# PulseP — Deployment Guide

Complete guide to deploying PulseP to a live public URL.
Free-tier options used throughout — no credit card needed for the basics.

---

## Architecture overview

```
Browser  ──►  Frontend (Vercel)
               │
               │  HTTP + SSE
               ▼
          Backend (Railway)
          ├── Go + Gin  :8080
          ├── MongoDB   (MongoDB Atlas free)
          └── Redis     (Upstash free)
```

---

## Step 1 — MongoDB Atlas (free M0 cluster)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create a free account
2. Create a free **M0** cluster (any region)
3. **Database Access** → Add user: username `pulsep`, strong password, role `readWriteAnyDatabase`
4. **Network Access** → Add IP `0.0.0.0/0` (allow all — Railway IPs are dynamic)
5. **Connect** → Drivers → Copy the connection string:
   ```
   mongodb+srv://pulsep:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password — this is your `MONGO_URI`

---

## Step 2 — Upstash Redis (free tier)

1. Go to [upstash.com](https://upstash.com) → Create a free account
2. Create a Redis database → Region: same as your Railway region
3. Copy the **Endpoint** and **Password** from the dashboard:
   - `REDIS_ADDR` = `your-endpoint.upstash.io:6380`
   - `REDIS_PASS` = `your-redis-password`

> Upstash free tier: 10,000 commands/day. More than enough for a demo.

---

## Step 3 — Deploy Backend to Railway

1. Go to [railway.app](https://railway.app) → Create account → New Project
2. **Deploy from GitHub repo** → select your repo → set root directory to `/backend`
3. Railway auto-detects Go and uses the `Dockerfile`
4. Add these **environment variables** in the Railway dashboard:

| Variable | Value |
|----------|-------|
| `PORT` | `8080` |
| `APP_ENV` | `production` |
| `MONGO_URI` | your Atlas connection string |
| `MONGO_DB` | `pulsep` |
| `REDIS_ADDR` | your Upstash endpoint:port |
| `REDIS_PASS` | your Upstash password |
| `JWT_SECRET` | generate with `openssl rand -hex 32` |
| `CORS_ORIGIN` | your Vercel frontend URL (e.g. `https://pulsep.vercel.app`) |

5. Railway will build the Docker image and deploy. Copy the generated URL, e.g.:
   ```
   https://pulsep-backend-production.up.railway.app
   ```

---

## Step 4 — Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Framework: **Vite** (auto-detected)
4. Add this **environment variable**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | your Railway backend URL (no trailing slash) |

5. Deploy. Vercel gives you a URL like `https://pulsep.vercel.app`
6. Go back to Railway → update `CORS_ORIGIN` to this Vercel URL → redeploy

---

## Step 5 — Verify the live deployment

Open your Vercel URL and run through the full flow:

```
✓ Landing page loads
✓ Sign up creates an account → JWT stored
✓ Create a poll with 3–4 options
✓ Copy the share link → open in a second browser tab (incognito)
✓ Vote in the incognito tab
✓ Watch the bar animate in the first tab — no refresh
✓ Vote again from incognito — should be blocked (duplicate guard)
✓ Toggle the poll closed from the creator tab
✓ Closed banner appears on the voter tab in real time
```

---

## Alternative: Single-server deploy (VPS / DigitalOcean)

If you prefer one machine:

```bash
# On Ubuntu 22.04
apt update && apt install -y docker.io docker-compose-plugin

git clone <your-repo>
cd "polling tool"

# Set env vars
cp backend/.env.example backend/.env
nano backend/.env   # fill in JWT_SECRET

# Start everything
docker compose up -d

# Backend runs on :8080
# Point Nginx / Caddy in front for HTTPS
```

Sample Caddy config for HTTPS + reverse proxy:

```
pulsep.yourdomain.com {
    reverse_proxy localhost:8080
}
```

---

## Keeping SSE alive through proxies

Railway and most reverse proxies buffer responses. The backend already sends:
- `X-Accel-Buffering: no` header (disables nginx buffering)
- `: ping\n\n` comments every 25 seconds (keeps proxies alive)

If deploying behind Nginx manually, add to your location block:
```nginx
proxy_buffering        off;
proxy_cache            off;
proxy_read_timeout     3600s;
```

---

## Quick environment variable reference

```bash
# Generate a strong JWT secret
openssl rand -hex 32
# or on Windows PowerShell:
-join ((1..32) | ForEach-Object { '{0:x}' -f (Get-Random -Max 256) })
```

---

## Checklist before submitting

- [ ] Live URL is publicly reachable (test in incognito)
- [ ] Sign up works end-to-end
- [ ] Create poll → share link → vote → results update live (no refresh)
- [ ] GitHub repo is public
- [ ] README.md explains how to run locally
- [ ] Video recorded (3–5 min): biggest challenge + AI tool usage
