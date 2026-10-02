import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Radio, BarChart3, QrCode, ShieldCheck, Zap, Users, Lock, CheckCircle2 } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

/* ── Poll scenarios that cycle through ───────────────────────────────────── */
const POLLS = [
  {
    question: "Which frontend framework for the new project?",
    author: "@alex", context: "Team standup",
    options: [
      { label: "React",   color: "#aed6b6" },
      { label: "Vue",     color: "#72d4c2" },
      { label: "Svelte",  color: "#e6bf79" },
      { label: "Angular", color: "#a5b4fc" },
    ],
    seed: [52, 29, 12, 7],
  },
  {
    question: "When should we ship the v2.0 release?",
    author: "@priya", context: "Sprint planning",
    options: [
      { label: "This Friday",  color: "#f0a297" },
      { label: "Next week",    color: "#aed6b6" },
      { label: "End of month", color: "#72d4c2" },
      { label: "After beta",   color: "#e6bf79" },
    ],
    seed: [18, 44, 27, 11],
  },
  {
    question: "Best time for the all-hands meeting?",
    author: "@sam", context: "Team sync",
    options: [
      { label: "Mon 10am",  color: "#72d4c2" },
      { label: "Wed 2pm",   color: "#aed6b6" },
      { label: "Thu 11am",  color: "#a5b4fc" },
      { label: "Fri 4pm",   color: "#e6bf79" },
    ],
    seed: [34, 41, 15, 10],
  },
  {
    question: "Which database for the analytics service?",
    author: "@dev_team", context: "Architecture review",
    options: [
      { label: "PostgreSQL", color: "#aed6b6" },
      { label: "MongoDB",    color: "#86efac" },
      { label: "ClickHouse", color: "#72d4c2" },
      { label: "Redis",      color: "#f0a297" },
    ],
    seed: [38, 29, 20, 13],
  },
];

/* ── Activity feed item type ─────────────────────────────────────────────── */
type FeedItem = { id: number; label: string; color: string; user: string };

const FAKE_USERS = ["@alex","@priya","@sam","@dev","@morgan","@river","@jess","@kai"];

let globalVoteId = 0;

/* ── The fully alive mock ────────────────────────────────────────────────── */
function LivePollMock() {
  const [pollIdx, setPollIdx]   = useState(0);
  const [votes,   setVotes]     = useState([...POLLS[0].seed]);
  const [pulse,   setPulse]     = useState<number | null>(null);
  const [feed,    setFeed]      = useState<FeedItem[]>([]);
  const [transitioning, setTransitioning] = useState(false);
  const [totalEver, setTotalEver] = useState(0);

  const poll = POLLS[pollIdx];
  const total = votes.reduce((s, v) => s + v, 0);
  const leadIdx = votes.indexOf(Math.max(...votes));

  // ── Vote rain: fires every 700–1400ms ──────────────────────────
  useEffect(() => {
    if (transitioning) return;
    let alive = true;
    const castVote = () => {
      if (!alive || transitioning) return;
      // weighted random based on current distribution + some noise
      const weights = votes.map(v => v + Math.random() * 8);
      const wTotal  = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * wTotal, idx = 0;
      for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }

      setVotes(prev => { const n = [...prev]; n[idx]++; return n; });
      setPulse(idx);
      setTotalEver(t => t + 1);

      const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)];
      const item: FeedItem = { id: ++globalVoteId, label: poll.options[idx].label, color: poll.options[idx].color, user };
      setFeed(prev => [item, ...prev].slice(0, 4));

      setTimeout(() => setPulse(null), 500);
      setTimeout(castVote, 700 + Math.random() * 700);
    };
    const t = setTimeout(castVote, 600);
    return () => { alive = false; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollIdx, transitioning]);

  // ── Poll cycle: new poll every 9s ──────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setTransitioning(true);
      setTimeout(() => {
        const next = (pollIdx + 1) % POLLS.length;
        setPollIdx(next);
        setVotes([...POLLS[next].seed]);
        setFeed([]);
        setPulse(null);
        setTransitioning(false);
      }, 500);
    }, 9000);
    return () => clearInterval(t);
  }, [pollIdx]);

  return (
    <div className="relative select-none" aria-hidden>
      {/* Glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 55% 35%, color-mix(in srgb, var(--accent-2) 9%, transparent) 0%, transparent 65%)" }} />

      {/* ── Main card ─────────────────────────────────────── */}
      <div className="relative bg-surface border border-line rounded-[18px] overflow-hidden shadow-float">

        {/* Title bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line bg-raised">
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-line" />
            <span className="h-2 w-2 rounded-full bg-line" />
            <span className="h-2 w-2 rounded-full bg-line" />
          </div>
          <span className="text-[9px] font-mono text-subtle">pulsep / live</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft border border-accent/25 px-2 py-0.5 text-[8px] font-700 tracking-wide uppercase text-accent">
            <span className="h-[4px] w-[4px] rounded-full bg-success animate-pulseDot" /> Live
          </span>
        </div>

        {/* Question — slides out/in on cycle */}
        <div className="px-5 pt-4 pb-2 min-h-[72px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={pollIdx}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{   opacity: 0, y: -14 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
            >
              <p className="text-[10px] text-subtle mb-1">
                {poll.author} · {poll.context}
              </p>
              <h3 className="font-display font-700 text-[13px] sm:text-[14px] tracking-[-0.3px] text-ink leading-[1.35]">
                {poll.question}
              </h3>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Vote counter row */}
        <div className="px-5 pb-3 flex items-center gap-2">
          <Users className="h-3 w-3 text-subtle flex-shrink-0" />
          <span className="text-[11px] text-muted">
            <AnimatePresence mode="wait">
              <motion.span
                key={total}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1,  y:  0 }}
                exit={{   opacity: 0,  y:  5 }}
                transition={{ duration: 0.14 }}
                className="inline-block tabular-nums font-600 text-ink mr-0.5"
              >{total}</motion.span>
            </AnimatePresence>
            {" "}votes · live
          </span>
          {/* Burst +1 */}
          <AnimatePresence>
            {pulse !== null && (
              <motion.span
                key={`burst-${globalVoteId}`}
                initial={{ opacity: 1, y: 0,   scale: 1   }}
                animate={{ opacity: 0, y: -12,  scale: 1.3 }}
                transition={{ duration: 0.55 }}
                className="text-[10px] font-700 text-success tabular-nums"
              >+1</motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Bars — animate on pollIdx change and on every vote */}
        <div className="px-5 pb-4 space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={pollIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{   opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-2"
            >
              {poll.options.map((opt, i) => {
                const pct     = total ? Math.round((votes[i] / total) * 100) : 0;
                const isPulse = pulse === i;
                const isLead  = i === leadIdx && total > 0;
                return (
                  <div
                    key={opt.label}
                    className="relative overflow-hidden rounded-[8px] border bg-raised transition-all duration-150"
                    style={{ borderColor: isPulse ? opt.color + "70" : "var(--line)" }}
                  >
                    {/* Fill */}
                    <motion.div
                      className="absolute inset-0 origin-left rounded-[8px]"
                      style={{ background: opt.color, opacity: 0.11 }}
                      animate={{ scaleX: pct / 100 }}
                      transition={{ type: "spring", stiffness: 80, damping: 18 }}
                    />
                    {/* Pulse flash on vote */}
                    <AnimatePresence>
                      {isPulse && (
                        <motion.div
                          className="absolute inset-0 rounded-[8px]"
                          style={{ background: opt.color, opacity: 0.08 }}
                          initial={{ opacity: 0.18 }}
                          animate={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}
                    </AnimatePresence>

                    <div className="relative flex items-center gap-2 px-2.5 py-2">
                      <span className="h-[7px] w-[7px] rounded-full flex-shrink-0" style={{ background: opt.color }} />
                      <span className="text-[11px] font-500 text-ink flex-1 truncate">{opt.label}</span>
                      {isLead && (
                        <span className="text-[7px] font-700 uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                          style={{ color: opt.color, background: opt.color + "20", border: `1px solid ${opt.color}40` }}>
                          ↑ Lead
                        </span>
                      )}
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={pct}
                          initial={{ opacity: 0, y: -3 }}
                          animate={{ opacity: 1,  y:  0 }}
                          exit={{   opacity: 0,  y:  3 }}
                          transition={{ duration: 0.13 }}
                          className="text-[11px] font-700 tabular-nums w-7 text-right"
                          style={{ color: opt.color }}
                        >{pct}%</motion.span>
                      </AnimatePresence>
                    </div>
                    {/* Bottom track */}
                    <div className="relative h-[2px] bg-line overflow-hidden mx-2.5 mb-2 rounded-full">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: opt.color }}
                        animate={{ width: `${pct}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 18 }}
                      />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Live activity feed ─────────────────────────── */}
        <div className="border-t border-line bg-raised px-5 py-3" style={{ minHeight: 96 }}>
          <p className="text-[8px] uppercase tracking-[1.4px] text-subtle mb-2">Live activity</p>
          <div className="space-y-1.5 overflow-hidden" style={{ maxHeight: 68 }}>
            <AnimatePresence initial={false}>
              {feed.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0,   height: "auto" }}
                  exit={{   opacity: 0, x:  10,  height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <span className="h-[5px] w-[5px] rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-[9px] text-subtle font-mono truncate">
                    <span className="text-muted font-600">{item.user}</span> voted <span style={{ color: item.color }} className="font-600">{item.label}</span>
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {feed.length === 0 && (
              <p className="text-[9px] text-subtle italic">Waiting for votes…</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-line flex items-center justify-between">
          <span className="text-[8px] font-mono text-subtle">SSE · Redis pub/sub</span>
          <div className="flex items-center gap-3">
            <span className="text-[8px] text-subtle">{pollIdx + 1}/{POLLS.length} polls</span>
            {/* Cycle progress dots */}
            <div className="flex gap-1">
              {POLLS.map((_, i) => (
                <span key={i} className="h-[4px] rounded-full transition-all duration-500"
                  style={{ width: i === pollIdx ? 12 : 4, background: i === pollIdx ? "var(--accent)" : "var(--line)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Float: new vote toast ─────────────────────────── */}
      <div className="absolute -top-3 -right-3 w-[158px] overflow-hidden">
        <AnimatePresence initial={false}>
          {feed[0] && (
            <motion.div
              key={feed[0].id}
              initial={{ opacity: 0, y: -16, scale: 0.92 }}
              animate={{ opacity: 1,  y: 0,   scale: 1    }}
              exit={{   opacity: 0,  y: -12,  scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="float-card flex items-center gap-2.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: feed[0].color }} />
              <div className="min-w-0">
                <p className="text-[9px] font-600 text-ink leading-[1.3]">New vote</p>
                <p className="text-[8px] text-subtle truncate">{feed[0].user} → <span style={{ color: feed[0].color }}>{feed[0].label}</span></p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Float: stats card ────────────────────────────── */}
      <div className="absolute -bottom-5 -left-3 float-card" style={{ minWidth: 140 }}>
        <p className="text-[8px] uppercase tracking-[1.2px] text-subtle mb-1.5">Total responses</p>
        <p className="font-display font-700 text-[24px] tracking-[-1px] tabular-nums text-ink">
          <AnimatePresence mode="wait">
            <motion.span
              key={total}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1,  y:  0 }}
              exit={{   opacity: 0,  y:  4 }}
              transition={{ duration: 0.15 }}
              className="inline-block"
            >{total}</motion.span>
          </AnimatePresence>
        </p>
        {/* Proportional color bar */}
        <div className="flex gap-[2px] mt-2 h-[3px] rounded-full overflow-hidden">
          {poll.options.map((o, i) => (
            <motion.div
              key={o.label}
              className="h-full rounded-full"
              style={{ background: o.color }}
              animate={{ flex: votes[i] }}
              transition={{ type: "spring", stiffness: 60, damping: 18 }}
            />
          ))}
        </div>
        <p className="text-[8px] text-subtle mt-1.5">+{totalEver} since load</p>
      </div>

      {/* ── New poll cycling indicator ────────────────────── */}
      <div className="absolute -bottom-5 right-0 float-card flex items-center gap-1.5" style={{ padding: "8px 12px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-3 w-3 rounded-full border-2 border-t-transparent flex-shrink-0"
          style={{ borderColor: "color-mix(in srgb, var(--accent) 25%, transparent)", borderTopColor: "var(--accent)" }}
        />
        <span className="text-[8px] text-subtle font-mono">next poll soon</span>
      </div>
    </div>
  );
}

/* ── How it works steps ─────────────────────────────────────────────────── */
const STEPS = [
  { n: "01", title: "Create your poll.", body: "Write your question, add 2–6 options, set an optional expiry. Done in under a minute." },
  { n: "02", title: "Share the link.", body: "Copy a URL or scan a QR code. Anyone with the link can vote — no account needed." },
  { n: "03", title: "Watch it live.", body: "Results update in real-time via SSE + Redis. Bars grow as votes come in. No refresh, ever." },
];

/* ── Feature cards ──────────────────────────────────────────────────────── */
const FEATURES = [
  { icon: Radio,      title: "Genuinely live",       body: "Server-sent events backed by Redis pub/sub. Every vote broadcasts instantly." },
  { icon: BarChart3,  title: "Animated results",     body: "Spring-physics bars that update in real-time. Reads clearly even during bursts." },
  { icon: QrCode,     title: "QR code sharing",      body: "One-tap QR for classrooms and events. Perfect for projecting on a screen." },
  { icon: ShieldCheck,title: "Auth-gated creation",  body: "Anyone can vote, but only logged-in users can create or manage polls." },
  { icon: Zap,        title: "Sub-second updates",   body: "Redis INCR for atomic counting. No race conditions. Always consistent." },
  { icon: Users,      title: "No signup to vote",    body: "Frictionless for audiences. Share the link and they're in — instantly." },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.45, delay: i * 0.07 } }),
};

export function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-5 sm:px-8 pt-12 sm:pt-16 pb-10">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-12 items-center">

          {/* Copy */}
          <motion.div initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            {/* Eyebrow */}
            <div className="eyebrow mb-5">
              <span className="eyebrow-dot" />
              Realtime · Redis · MongoDB · Go
            </div>

            <h1 className="font-display font-800 tracking-[-3px] leading-[1.06] text-[42px] sm:text-[54px] lg:text-[62px] text-ink">
              Instant polls.<br />
              <span className="gradient-text">Real-time results.</span>
            </h1>

            <p className="mt-5 text-[15px] leading-[1.85] text-muted max-w-[480px]">
              Create a poll, share a link, watch votes land live. Built for classrooms,
              team standups, and events — no page refresh needed, ever.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link to="/create">
                    <Button variant="primary" size="lg">
                      Create a poll <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="secondary" size="lg">Go to dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/signup">
                    <Button variant="primary" size="lg">
                      Get started free <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="secondary" size="lg">Log in</Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust strip */}
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-subtle">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1">
                <Lock className="h-3 w-3" /> No spam
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1">
                <Zap className="h-3 w-3" /> Sub-second updates
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1">
                <Users className="h-3 w-3" /> No signup to vote
              </span>
            </div>
          </motion.div>

          {/* Live poll mock */}
          <motion.div
            initial={{ opacity:0, y:18 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.55, delay:0.12 }}
            className="relative pt-6 pb-8 px-4"
          >
            <LivePollMock />
          </motion.div>
        </div>

        {/* ── Principle strip ─────────────────────────────────────── */}
        <div className="mt-10 border-t border-b border-line py-5 flex flex-wrap items-center justify-between gap-4">
          <p className="text-[9px] uppercase tracking-[1.8px] text-subtle max-w-[120px] leading-[1.7]">
            Less guesswork.<br />More direction.
          </p>
          {[
            ["◎", "Evidence-led results"],
            ["⌘", "SSE + Redis real-time"],
            ["↗", "Actionable insights"],
            ["⊞", "Visible live activity"],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-2.5 text-[11px] font-500 text-muted">
              <span className="text-[16px] text-accent">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-[1200px] px-5 sm:px-8 py-14 sm:py-20">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
          <div>
            <div className="eyebrow mb-4"><span className="eyebrow-dot" /> A more thoughtful process</div>
            <h2 className="font-display font-700 text-[28px] sm:text-[36px] tracking-[-1.4px] leading-[1.18] text-ink">
              Not just a score.<br />A way forward.
            </h2>
          </div>
          <p className="max-w-[300px] text-[13px] leading-[1.9] text-muted">
            From the question you want answered to live, shareable results in under a minute.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeUp}
              className="border-t-2 border-line pt-5 pr-4"
            >
              <p className="font-mono text-[10px] text-accent mb-5 tracking-[0.5px]">{s.n} — THE STEP</p>
              <h3 className="font-display font-700 text-[17px] tracking-[-0.5px] text-ink mb-2">{s.title}</h3>
              <p className="text-[12px] leading-[1.9] text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section id="features" className="mx-auto max-w-[1200px] px-5 sm:px-8 pb-14 sm:pb-20">
        <div className="flex flex-wrap justify-between items-end gap-6 mb-8">
          <div>
            <div className="eyebrow mb-4"><span className="eyebrow-dot" /> What makes it work</div>
            <h2 className="font-display font-700 text-[28px] sm:text-[36px] tracking-[-1.4px] leading-[1.18] text-ink">
              Every watt,<br />working smarter.
            </h2>
          </div>
          <p className="max-w-[300px] text-[13px] leading-[1.9] text-muted">
            The full stack — React, Go, MongoDB, Redis — all doing real work, not just ticking boxes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={fadeUp}
              className="bg-surface border border-line rounded-[14px] p-5 hover:border-line-2 hover:-translate-y-1 transition-all duration-200"
            >
              <div className="h-9 w-9 rounded-[9px] bg-accent-soft border border-accent/20 flex items-center justify-center mb-4">
                <f.icon className="h-4 w-4 text-accent" />
              </div>
              <h3 className="font-display font-700 text-[14px] tracking-[-0.3px] text-ink mb-1.5">{f.title}</h3>
              <p className="text-[12px] leading-[1.9] text-muted">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-5 sm:px-8 pb-16">
        <div className="relative overflow-hidden bg-surface border border-line rounded-[22px] px-8 sm:px-12 py-10 flex flex-wrap items-center justify-between gap-6">
          {/* Background ring decorations */}
          <div className="absolute right-24 top-[-130px] w-[380px] h-[380px] border border-accent/10 rounded-full pointer-events-none" />
          <div className="absolute right-24 top-[-85px]  w-[290px] h-[290px] border border-accent/06 rounded-full pointer-events-none" />

          <h2 className="font-display font-500 text-[26px] sm:text-[32px] tracking-[-1.2px] leading-[1.3] text-ink relative z-10">
            You've got the question.<br />
            <span className="text-accent">Let's get the answers, live.</span>
          </h2>
          <Link to={user ? "/create" : "/signup"} className="relative z-10 flex-shrink-0">
            <Button variant="lime" size="lg">
              {user ? "Create a poll" : "Start free"} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8 py-7 flex flex-wrap items-center justify-between gap-4 text-[11px] text-subtle">
          <span className="font-display font-700 text-[14px] tracking-[-0.5px] text-ink">
            Pulse<span className="text-accent">P</span>
          </span>
          <span>Instant polls. Real-time results.</span>
          <span className="font-mono">React · Go + Gin · MongoDB · Redis</span>
        </div>
      </footer>
    </div>
  );
}
