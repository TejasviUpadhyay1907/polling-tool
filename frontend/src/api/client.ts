import axios from "axios";

const baseURL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:8080";

export const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pulsep_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("pulsep_token");
      localStorage.removeItem("pulsep_user");
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/p/")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export function getApiBase(): string {
  return baseURL;
}
