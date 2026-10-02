import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import type { User } from "../types";
import { login as apiLogin, signup as apiSignup } from "../api/auth";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem("pulsep_user");
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("pulsep_token"));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      try {
        const raw = localStorage.getItem("pulsep_user");
        if (raw) setUser(JSON.parse(raw) as User);
      } catch {
        /* ignore */
      }
    }
  }, [token, user]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      localStorage.setItem("pulsep_token", res.token);
      localStorage.setItem("pulsep_user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiSignup({ name, email, password });
      localStorage.setItem("pulsep_token", res.token);
      localStorage.setItem("pulsep_user", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("pulsep_token");
    localStorage.removeItem("pulsep_user");
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, token, loading, login, signup, logout }),
    [user, token, loading, login, signup, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
