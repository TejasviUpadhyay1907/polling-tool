# PulseP — Instant polls. Real-time results.

A premium, dark, live-polling frontend for the GUVI developer internship evaluation. Creator creates a poll → shares a link/QR → audience votes → everyone sees results update live via SSE without refresh.

Stack required by the brief: **React · Vite · Tailwind v3 · Framer Motion · Recharts · React Router v6 · Axios · TanStack Query v5 · react-qr-code · react-hot-toast · lucide-react · canvas-confetti** — all used. Backend is expected to be **Go + Gin + MongoDB + Redis**.

---

## Quick start

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL if backend is not on localhost:8080
npm run dev            # http://localhost:5173
npm run build          # production build (runs tsc + vite build)
npm run preview        # preview the build
```

**Env**

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Backend base URL (no trailing slash). The app appends `/api`. |

`.env.example` is committed; `.env` is gitignored. If the backend is not running the UI stays usable — it shows skeletons, empty states, and error banners with the API base and error message instead of a blank screen.

---

## Routes

| Route | Access | Description |
|---|---|---|
| `/` | public | Landing + live preview card + feature strip |
| `/signup`, `/login` | public | Auth with inline validation + toast errors |
| `/dashboard` | protected | Creator's polls: search, live/closed/all filter, copy link, open, close/reopen, delete |
| `/create` | protected | Create poll: question (5–200 chars), 2–6 unique options, optional expiry, show-results toggle |
| `/p/:id` | public | Vote + live results + SSE connection badge + Share panel (copy + QR + native share) · Owner controls (close/reopen/delete) when logged in |
| `*` | — | 404 |

Protected routes redirect to `/login`. Public vote page works without auth and is optimized for 375px.

---

## Frontend architecture

```
src/
  api/
    client.ts   — axios instance, VITE_API_URL, Bearer token interceptor, 401 → logout + redirect
    auth.ts     — signup / login / me
    polls.ts    — fetchMyPolls / fetchPoll / createPoll / togglePoll / deletePoll / votePoll / streamUrl + normalizePoll
  types/index.ts     — User, Poll, PollOption, CreatePollPayload, StreamEvent
  context/AuthContext.tsx — token + user in localStorage (pulsep_token / pulsep_user), login/signup/logout, useAuth()
  hooks/usePollStream.ts  — EventSource wrapper for GET /api/polls/:id/stream with auto-reconnect (exponential backoff, max 15s), handles vote/update/poll/status events
  components/
    ui/  Button, Input/Textarea/Label, Card, Badge, Skeleton, LiveDot
    layout/Navbar  — sticky blurred header, auth-aware
    poll/SharePanel — copy + QR (react-qr-code) + native share
    poll/ResultBars — animated bars (framer-motion, spring), winner highlight, percentages
    poll/LiveHeader — Live/connecting/reconnecting/offline badge
  pages/ Landing, Auth (Login/Signup), Dashboard, CreatePoll, PollView, NotFound
  utils/ cn, format (timeAgo, isExpired, shareUrl)
  App.tsx   — Routes + Protected wrapper
  main.tsx  — QueryClientProvider + BrowserRouter + AuthProvider + Toaster
  style.css — Tailwind base + dark premium tokens + scrollbar/selection/focus styles
```

**State**

- Server state via **TanStack Query** (`my-polls`, `poll/:id`). Mutations invalidate queries.
- Client/auth state via `AuthContext`. No global store needed.
- Local vote memory via `localStorage pulsep_voted_<pollId>` to enforce one-vote UX + persist highlight.

---

## API contract (expected backend)

`base = VITE_API_URL + /api`

```
POST /api/auth/signup  {name,email,password} → {token, user:{id,name,email}}
POST /api/auth/login   {email,password}      → {token, user}
GET  /api/auth/me                            → {user}  (optional)

GET  /api/polls/my                     (Bearer) → Poll[]
POST /api/polls                        (Bearer) → Poll   body: {question, options:string[], expiresAt?: string|null, showResultsBeforeVote?: boolean}
GET  /api/polls/:id                             → Poll
PATCH /api/polls/:id/toggle            (Bearer) → Poll
DELETE /api/polls/:id                  (Bearer) → 204
POST /api/polls/:id/vote                        → {poll: Poll, results?}  body: {optionId}
GET  /api/polls/:id/stream                     → text/event-stream (SSE)
```

`normalizePoll` tolerates `id/_id/pollId`, `isActive/is_active/active`, `totalVotes/total_votes`, `createdAt/created_at`, `expiresAt/expires_at`, and option shapes `{id/_id, text/label/option, votes/count}` so minor backend field differences don't break the UI. Responses wrapped as `{data: …}` or `{poll: …}` or `{polls: …}` are unwrapped automatically.

Auth token is sent as `Authorization: Bearer <token>` on every request via the axios interceptor. SSE connects to `GET /api/polls/:id/stream?token=<token>` (query param) because `EventSource` cannot set headers.

---

## Realtime behavior

- `usePollStream(pollId, onPoll)` opens an `EventSource` to `streamUrl(pollId)` when a poll is mounted.
- Listens to `message` + named events `vote`, `update`, `poll`, `status`. Any event carrying a `poll` object updates the displayed poll via `normalizePoll`.
- Lifecycle: `connecting → open → error → reconnect` with exponential backoff (`1s, 2s, 4s, …` capped at 15s). Cleanup on unmount / poll switch (closes EventSource + clears timer). No duplicate connections, no leaks, no polling fallback, no fake votes.
- UI reflects the stream state in `LiveHeader` (Live / Connecting… / Reconnecting… / Offline) with an animated dot. `PollView` merges live updates into both local state and the React Query cache. `ResultBars` animates bar width/scale with `framer-motion` springs so bursts remain readable.
- Backend is source of truth — vote counts/percentages are always from the server; optimistic UI is limited to selection state, not counts.

---

## Design decisions

- **Dark premium system** (`bg #0a0a0f`, `surface #111118`, `primary #6366f1`) — calm, high contrast, Linear/Vercel-inspired hierarchy, restrained glow. Inter + JetBrains Mono.
- **Landing-first** — assignment is open-ended; the landing sells the loop (Create → Share → Vote → Live Results) and proves product thinking before auth.
- **Vote page is the hero** — mobile-first at 375px, large tap targets, keyboard-accessible radio semantics, no horizontal overflow, smooth animations that don't block interaction.
- **ResultBars over charts for the default poll** — a 2–6 option poll reads faster as animated horizontal bars + percentages than a pie/chart. Recharts is installed for future richer analytics without being forced onto every poll.
- **QR + copy + native share** — required for classroom/presentation use; kept compact.
- **Progressive disclosure on create** — only question + options are prominent; expiry and visibility are secondary.
- **Graceful degradation** — every data fetch has loading skeletons, empty states with next-step CTAs, and error states that surface the API base + raw message. No `alert()`, no lorem ipsum, no dead controls.

---

## Deployment

- Set `VITE_API_URL` to the deployed Go/Gin backend URL and rebuild.
- Any static host works (`Vercel`, `Netlify`, `S3+CloudFront`). SPA fallback to `index.html` required for `/p/:id` deep links.

---

## License

Internship evaluation project — no license.
