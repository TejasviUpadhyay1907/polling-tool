import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";
import { Input, Label, FieldError } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

function getErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
  return e?.response?.data?.message || e?.response?.data?.error || e?.message || "Something went wrong";
}

/* ── Shared wrapper ──────────────────────────────────────────────────────── */
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      {/* Background radial glow */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 60%)" }} />
      <div className="relative z-10 mx-auto max-w-[440px] px-4 sm:px-6 pt-10 sm:pt-14 pb-12">
        {children}
      </div>
    </div>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════════════════ */
export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Brand mark */}
        <div className="mb-7 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect width="28" height="28" rx="8" fill="url(#lg-grad)" />
              <path d="M5 17 L9 11 L13 19 L17 8 L21 14 L23 14" stroke="var(--accent-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="lg-grad" x1="0" y1="0" x2="28" y2="28"><stop stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
            </svg>
            <span className="font-display font-800 text-[20px] tracking-[-0.8px] text-ink">Pulse<span className="text-accent">P</span></span>
          </div>
          <h1 className="font-display font-700 text-[22px] tracking-[-0.8px] text-ink">Log in to your account</h1>
          <p className="text-[13px] text-muted mt-1.5">Welcome back — manage polls and watch results live.</p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-line rounded-[18px] shadow-card p-6 sm:p-7">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Field label="Email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Button type="submit" loading={loading} variant="primary" size="lg" className="w-full mt-2">
              Log in <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-line text-center text-[12px] text-muted">
            No account?{" "}
            <Link to="/signup" className="font-600 text-accent hover:text-lime transition-colors">
              Sign up free
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-subtle mt-4 font-mono">
          API: {(import.meta.env.VITE_API_URL as string) || "http://localhost:8080"}
        </p>
      </motion.div>
    </AuthShell>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SIGNUP
═══════════════════════════════════════════════════════════════════════════ */
export function Signup() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!name.trim() || name.trim().length < 2) next.name = "Name must be at least 2 characters";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email";
    if (!password || password.length < 6) next.password = "At least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(name.trim(), email.trim(), password);
      toast.success("Account created");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-7 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <svg width="32" height="32" viewBox="0 0 28 28" fill="none" aria-hidden>
              <rect width="28" height="28" rx="8" fill="url(#sg-grad)" />
              <path d="M5 17 L9 11 L13 19 L17 8 L21 14 L23 14" stroke="var(--accent-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <defs><linearGradient id="sg-grad" x1="0" y1="0" x2="28" y2="28"><stop stopColor="var(--accent)" /><stop offset="1" stopColor="var(--accent-2)" /></linearGradient></defs>
            </svg>
            <span className="font-display font-800 text-[20px] tracking-[-0.8px] text-ink">Pulse<span className="text-accent">P</span></span>
          </div>
          <h1 className="font-display font-700 text-[22px] tracking-[-0.8px] text-ink">Create your account</h1>
          <p className="text-[13px] text-muted mt-1.5">Start creating live polls in seconds.</p>
        </div>

        <div className="bg-surface border border-line rounded-[18px] shadow-card p-6 sm:p-7">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <Field label="Name" error={errors.name}>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field label="Email" error={errors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password" error={errors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-muted transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {/* Password strength hint */}
            {password.length > 0 && (
              <div className="flex gap-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-200"
                    style={{
                      background: password.length >= (i + 1) * 2
                        ? i < 2 ? "var(--warning)" : "var(--accent)"
                        : "var(--line)"
                    }}
                  />
                ))}
              </div>
            )}

            <Button type="submit" loading={loading} variant="primary" size="lg" className="w-full mt-2">
              Create account <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-line text-center text-[12px] text-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-600 text-accent hover:text-lime transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </motion.div>
    </AuthShell>
  );
}
