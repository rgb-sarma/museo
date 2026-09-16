import axios from "axios";

/**
 * the web preview for this is localhost
 * on a device or emulator, set VITE_API_URL to the machine's LAN IP (e.g. http://192.168.1.20:8000)
 * in app/.env.local
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const TOKEN_KEY = "museo.token";

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// pull a readable message out of a FastAPI error response.
export function errorMessage(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
    if (!err.response) return "Cannot reach the server. Is the API running?";
  }
  return fallback;
}
