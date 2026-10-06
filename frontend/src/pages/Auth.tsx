import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, CheckCircle2, Radio, Users, Zap, BarChart3 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "signup";

function getErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || "Something went wrong";
}

/* ── Mini animated poll preview ─────────────────────────────────────────── */
function MiniPoll() {
  const [votes, setVotes] = useState([52, 28, 12, 8]);
  useEffect(() => {
    const t = setInterval(() => {
      setVotes(prev => {
        const idx = Math.floor(Math.random() * 4);
        return prev.map((v, i) => i === idx ? v + 1 : v);
      });
    }, 1200);
    return () => clearInterval(t);
  }, []);
  const total = votes.reduce((a, b) => a + b, 0);
  const opts = [
    { label: "React",   color: "#aed6b6" },
    { label: "Vue",     color: "#72d4c2" },
    { label: "Svelte",  color: "#e6bf79" },
    { label: "Angular", color: "#a5b4fc" },
  ];
  return (
    <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: 18, backdropFilter: "blur(8px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>pulsep / live</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 8, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#aed6b6", background: "rgba(174,214,182,0.12)", border: "1px solid rgba(174,214,182,0.25)", borderRadius: 99, padding: "2px 7px" }}>
          <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#aed6b6", display: "inline-block", animation: "pulseDot 2s infinite" }} />
          Live
        </span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "Manrope,sans-serif", marginBottom: 3 }}>Best frontend framework?</p>
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>
        {total} votes · updates live
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {opts.map((o, i) => {
          const pct = Math.round((votes[i] / total) * 100);
          return (
            <div key={o.label} style={{ position: "relative", borderRadius: 6, overflow: "hidden", background: "rgba(255,255,255,0.04)", padding: "6px 10px" }}>
              <motion.div
                style={{ position: "absolute", inset: 0, background: o.color, opacity: 0.15, borderRadius: 6 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: "spring", stiffness: 80, damping: 18 }}
              />
              <div style={{ position: "relative", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.75)" }}>{o.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: o.color }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Branded left panel ──────────────────────────────────────────────────── */
function BrandPanel({ mode }: { mode: Mode }) {
  const features = [
    { icon: Radio,    text: "Redis SSE real-time updates" },
    { icon: Users,    text: "No signup needed to vote"    },
    { icon: Zap,      text: "Sub-second live results"     },
    { icon: BarChart3,text: "Animated live charts"        },
  ];

  return (
    <div style={{
      position: "relative",
      display: "flex",
      flexDirection: "column",
      padding: "44px 36px",
      background: "linear-gradient(150deg, #0d2d24 0%, #0b1e2a 50%, #0b171b 100%)",
      overflow: "hidden",
      height: "100%",
    }}>
      {/* Decorative blobs */}
      <div style={{ position: "absolute", top: -100, right: -100, width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(114,212,194,0.14), transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(174,214,182,0.10), transparent 65%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "auto" }}>
        <svg width="30" height="30" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="url(#bp-grad)" />
          <path d="M5 17 L9 11 L13 19 L17 8 L21 14 L23 14" stroke="#10271e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="bp-grad" x1="0" y1="0" x2="28" y2="28">
              <stop stopColor="#aed6b6"/><stop offset="1" stopColor="#72d4c2"/>
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: "-0.7px", color: "#edf4ef" }}>
          Pulse<span style={{ color: "#aed6b6" }}>P</span>
        </span>
      </div>

      {/* Main copy — animates on mode change */}
      <div style={{ marginTop: 44, marginBottom: 28 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.32 }}
          >
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#72d4c2", marginBottom: 10 }}>
              {mode === "login" ? "Welcome back" : "Get started free"}
            </p>
            <h2 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: "-1px", lineHeight: 1.25, color: "#edf4ef", margin: "0 0 10px" }}>
              {mode === "login" ? "Your polls\nare waiting." : "Start your\npolling journey."}
            </h2>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>
              {mode === "login"
                ? "Log back in and watch your results update live in real time."
                : "Create polls, share links, watch results roll in. No refresh needed."}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Feature list */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          {features.map((f, i) => (
            <motion.div
              key={f.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.28 }}
              style={{ display: "flex", alignItems: "center", gap: 10 }}
            >
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(174,214,182,0.1)", border: "1px solid rgba(174,214,182,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <f.icon style={{ width: 12, height: 12, color: "#aed6b6" }} />
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{f.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mini poll */}
      <MiniPoll />

      {/* Bottom tagline */}
      <p style={{ marginTop: 20, fontSize: 10, color: "rgba(255,255,255,0.22)", textAlign: "center", letterSpacing: "0.5px" }}>
        Built with Go · MongoDB · Redis · React
      </p>
    </div>
  );
}

/* ── Shared input ────────────────────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: "var(--muted)", marginBottom: 7 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: "var(--error)", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>⚠ {error}</p>}
    </div>
  );
}

function TextInput({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const borderColor = error ? "var(--error)" : "var(--line)";
  return (
    <input
      {...props}
      style={{
        width: "100%", height: 44, borderRadius: 10,
        border: `1.5px solid ${borderColor}`,
        padding: "0 14px", fontSize: 14,
        background: "var(--raised)", color: "var(--ink)",
        caretColor: "var(--accent-2)", outline: "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxSizing: "border-box",
        ...(props.style || {}),
      }}
      onFocus={e => {
        if (!error) e.target.style.borderColor = "var(--accent-2)";
        e.target.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--accent-2) 18%, transparent)";
      }}
      onBlur={e => {
        if (!error) e.target.style.borderColor = "var(--line)";
        e.target.style.boxShadow = "none";
      }}
    />
  );
}

/* ── Login form ──────────────────────────────────────────────────────────── */
function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      navigate("/dashboard", { replace: true });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: "100%", maxWidth: 400 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", color: "var(--ink)", margin: "0 0 8px" }}>
          Welcome back 👋
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
          Sign in to manage your polls and see live results.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <Field label="Email address" error={errors.email}>
          <TextInput type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
        </Field>

        <Field label="Password" error={errors.password}>
          <div style={{ position: "relative" }}>
            <TextInput
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--subtle)", padding: 0, display: "flex" }}>
              {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </Field>

        <button type="submit" disabled={loading}
          style={{
            height: 46, borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "var(--line)" : "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "var(--accent-ink)", fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: loading ? "none" : "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
            transition: "all 0.15s", marginTop: 4,
          }}
        >
          {loading
            ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            : <>Log in <ArrowRight style={{ width: 16, height: 16 }} /></>}
        </button>
      </form>

      <div style={{ margin: "24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: 11, color: "var(--subtle)" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
        No account?{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 700, fontSize: 13, padding: 0 }}>
          Sign up free →
        </button>
      </p>
    </div>
  );
}

/* ── Signup form ─────────────────────────────────────────────────────────── */
function SignupForm({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ name?: string; email?: string; password?: string }>({});

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const pwColor = ["", "#f0a297", "#e6bf79", "#aed6b6", "#72d4c2"][pwStrength];
  const pwLabel = ["", "Too short", "Weak", "Good", "Strong"][pwStrength];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) next.name = "At least 2 characters";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!password || password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      toast.success("Account created!");
      navigate("/dashboard", { replace: true });
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Step indicator */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {["Create account", "Make your poll", "Share & go live"].map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 3, borderRadius: 99, background: i === 0 ? "var(--accent)" : "var(--line)", marginBottom: 5 }} />
            <span style={{ fontSize: 9, color: i === 0 ? "var(--accent)" : "var(--subtle)", fontWeight: i === 0 ? 700 : 400 }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Manrope,sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: "-1px", color: "var(--ink)", margin: "0 0 8px" }}>
          Create your account ✨
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
          Free forever. No credit card. Start polling in minutes.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="Full name" error={errors.name}>
          <TextInput autoComplete="name" placeholder="Tejasvi Upadhyay" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
        </Field>

        <Field label="Email address" error={errors.email}>
          <TextInput type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} error={errors.email} />
        </Field>

        <Field label="Password" error={errors.password}>
          <div style={{ position: "relative" }}>
            <TextInput
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 6 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              error={errors.password}
              style={{ paddingRight: 44 }}
            />
            <button type="button" onClick={() => setShowPw(v => !v)}
              style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--subtle)", padding: 0, display: "flex" }}>
              {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ marginTop: 7 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 3 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= pwStrength ? pwColor : "var(--line)", transition: "all 0.3s" }} />
                ))}
              </div>
              <span style={{ fontSize: 10, color: pwColor, fontWeight: 600 }}>{pwLabel}</span>
            </div>
          )}
        </Field>

        <button type="submit" disabled={loading}
          style={{
            height: 46, borderRadius: 10, border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "var(--line)" : "linear-gradient(135deg, var(--accent), var(--accent-2))",
            color: "var(--accent-ink)", fontSize: 14, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: loading ? "none" : "0 4px 16px color-mix(in srgb, var(--accent) 30%, transparent)",
            transition: "all 0.15s", marginTop: 4,
          }}
        >
          {loading
            ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.35)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
            : <>Create account <ArrowRight style={{ width: 16, height: 16 }} /></>}
        </button>
      </form>

      {/* Perks */}
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
        {["Free forever — no credit card", "No signup needed for voters", "Real-time via Redis SSE"].map(t => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <CheckCircle2 style={{ width: 12, height: 12, color: "var(--success)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "var(--muted)" }}>{t}</span>
          </div>
        ))}
      </div>

      <div style={{ margin: "18px 0 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: 11, color: "var(--subtle)" }}>or</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>
      <p style={{ textAlign: "center", fontSize: 13, color: "var(--muted)", marginTop: 14 }}>
        Already have an account?{" "}
        <button onClick={onSwitch} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontWeight: 700, fontSize: 13, padding: 0 }}>
          Log in →
        </button>
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN AUTH PAGE — handles the sliding animation
═══════════════════════════════════════════════════════════════════════════ */
export function AuthPage({ initialMode }: { initialMode: Mode }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(initialMode);

  // Sync URL when mode changes
  const switchTo = (next: Mode) => {
    setMode(next);
    navigate(next === "login" ? "/login" : "/signup", { replace: true });
  };

  // direction: +1 = signup sliding in from right, -1 = login sliding in from left
  const direction = mode === "signup" ? 1 : -1;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--bg)",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* ── Sliding container ────────────────────────────────────────────── */}
      {/* When mode=login:  [BrandPanel LEFT] [LoginForm RIGHT]  */}
      {/* When mode=signup: [SignupForm LEFT] [BrandPanel RIGHT] */}

      <AnimatePresence initial={false} mode="wait">
        {mode === "login" ? (
          <motion.div
            key="login-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: "flex", width: "100%", minHeight: "100vh" }}
          >
            {/* Left — brand panel slides in from left */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{ width: "42%", minHeight: "100vh", flexShrink: 0 }}
            >
              <BrandPanel mode="login" />
            </motion.div>

            {/* Right — form slides in from right */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.04 }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}
            >
              <LoginForm onSwitch={() => switchTo("signup")} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="signup-layout"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ display: "flex", width: "100%", minHeight: "100vh" }}
          >
            {/* Left — form slides in from left */}
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.04 }}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 48px", overflowY: "auto" }}
            >
              <SignupForm onSwitch={() => switchTo("login")} />
            </motion.div>

            {/* Right — brand panel slides in from right */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              style={{ width: "42%", minHeight: "100vh", flexShrink: 0 }}
            >
              <BrandPanel mode="signup" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Keep named exports for any legacy imports
export const Login  = () => <AuthPage initialMode="login"  />;
export const Signup = () => <AuthPage initialMode="signup" />;
