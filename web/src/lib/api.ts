// Tiny fetch wrapper for the api worker.
// In dev (Vite proxies /api → :8787) we bypass CF Access and pass the
// dev headers; in prod the browser is already inside CF Access so the
// cookie + injected JWT do the work.

import type { ApiError } from "@smm/shared";

const isDev = import.meta.env.DEV;

const devHeaders = (): HeadersInit => {
  if (!isDev) return {};
  // Stored email lets us iterate locally without setting up an Access tunnel.
  const email = localStorage.getItem("smm.devEmail") || "dev@local";
  return { "Cf-Access-Jwt-Assertion": "dev", "X-Dev-Email": email };
};

export class ApiCallError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const r = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...devHeaders(),
      ...(init?.headers ?? {}),
    },
  });
  if (!r.ok) {
    const body = (await r.json().catch(() => null)) as ApiError | null;
    // Auto-redirect to /login on a 401 from any auth-protected route
    // (only meaningful in webauthn mode; in cf_access mode CF handles it).
    if (r.status === 401 && typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new ApiCallError(r.status, body?.error.code ?? "http_error", body?.error.message ?? r.statusText);
  }
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
};

export const swrFetcher = (path: string) => api(path);
