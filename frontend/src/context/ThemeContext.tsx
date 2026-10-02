import { createContext, useContext, useState, useCallback } from "react";

export type Theme = "dark" | "light";

type ThemeState = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const Ctx = createContext<ThemeState | null>(null);

// Direct DOM manipulation — no useEffect, no lag, no cascade issues
function applyNow(t: Theme) {
  const html = document.documentElement;
  html.className = t; // sets class="dark" or class="light" directly
  // Remove ANY previous inline body styles that could fight the CSS vars
  document.body.removeAttribute("style");
  try { localStorage.setItem("pulsep-theme", t); } catch { /* ignore */ }
}

// Read initial theme from localStorage (or default dark)
function getInitial(): Theme {
  try {
    const s = localStorage.getItem("pulsep-theme");
    if (s === "light") return "light";
  } catch { /* ignore */ }
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const t = getInitial();
    // Apply immediately on first render
    applyNow(t);
    return t;
  });

  const setTheme = useCallback((t: Theme) => {
    applyNow(t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setThemeState(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyNow(next);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTheme(): ThemeState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}
