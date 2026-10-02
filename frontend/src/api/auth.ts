import { api } from "./client";
import type { AuthResponse } from "../types";

export async function signup(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const { data } = await api.post("/auth/signup", payload);
  const d = (data?.data ?? data) as AuthResponse;
  return d;
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const { data } = await api.post("/auth/login", payload);
  const d = (data?.data ?? data) as AuthResponse;
  return d;
}

export async function me(): Promise<{ user: AuthResponse["user"] } | null> {
  try {
    const { data } = await api.get("/auth/me");
    const d = (data?.data ?? data) as { user: AuthResponse["user"] };
    return d;
  } catch {
    return null;
  }
}
