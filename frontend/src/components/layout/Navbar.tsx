import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, Plus, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../ui/Button";
import { ThemeToggle } from "../ui/ThemeToggle";

/* ── Logo ───────────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group" aria-label="PulseP home">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <rect width="28" height="28" rx="8" fill="url(#nav-logo-grad)" />
        <path
          d="M5 17 L9 11 L13 19 L17 8 L21 14 L23 14"
          stroke="var(--accent-ink)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="nav-logo-grad" x1="0" y1="0" x2="28" y2="28">
            <stop stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="font-display font-800 tracking-[-0.8px] text-[18px]"
        style={{ color: "var(--ink)" }}
      >
        Pulse<span style={{ color: "var(--accent)" }}>P</span>
      </span>
    </Link>
  );
}

/* ── Navbar ─────────────────────────────────────────────────────────────── */
export function Navbar() {
  const { user, logout } = useAuth();
  const { theme }        = useTheme();
  const navigate         = useNavigate();
  const { pathname }     = useLocation();
  const isLanding        = pathname === "/";

  return (
    <header className="sticky top-0 z-40 glass">
      <div
        className="mx-auto max-w-[1200px] px-5 sm:px-8 h-[68px] flex items-center justify-between gap-4"
      >
        <Logo />

        {/* Centre nav — landing only */}
        {isLanding && (
          <nav className="hidden md:flex items-center gap-7 text-[12px] font-500" style={{ color: "var(--muted)" }}>
            <a href="#how"      className="hover:text-ink transition-colors" style={{ color: "inherit" }}>How it works</a>
            <a href="#features" className="hover:text-ink transition-colors" style={{ color: "inherit" }}>Features</a>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* ── Theme toggle (3-way: light / dark / system) ─────────── */}
          <ThemeToggle />

          {/* Divider */}
          <span className="hidden sm:block h-5 w-px mx-1" style={{ background: "var(--line)" }} />

          {/* ── Auth controls ────────────────────────────────────────── */}
          {user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <LayoutDashboard className="h-[14px] w-[14px]" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>

              <Link to="/create">
                <Button variant="primary" size="sm">
                  <Plus className="h-[14px] w-[14px]" />
                  <span className="hidden sm:inline">New poll</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>

              {/* Avatar + name */}
              <div className="hidden md:flex items-center gap-2 ml-1 pl-3" style={{ borderLeft: "1px solid var(--line)" }}>
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-700 uppercase flex-shrink-0"
                  style={{ background: "var(--accent-soft)", border: "1px solid var(--accent)", color: "var(--accent)" }}
                >
                  {user.name?.[0] ?? "U"}
                </div>
                <span className="text-[12px] max-w-[110px] truncate" style={{ color: "var(--muted)" }}>
                  {user.name}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => { logout(); navigate("/"); }}
                aria-label="Log out"
                className="hover:text-error"
                style={{ color: "var(--subtle)" }}
              >
                <LogOut className="h-[14px] w-[14px]" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Subtle theme indicator strip at very bottom of nav */}
      <AnimatePresence>
        <motion.div
          key={theme}
          className="h-[2px] w-full origin-left"
          style={{ background: `linear-gradient(90deg, var(--accent), var(--accent-2), transparent)` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </AnimatePresence>
    </header>
  );
}
