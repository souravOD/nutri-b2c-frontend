// lib/api/core.ts — Auth-aware fetch, JWT caching, and shared helpers
"use client";

import { account } from "../appwrite";

export type FetchOpts = Omit<RequestInit, "headers"> & { headers?: HeadersInit };
type JsonRecord = Record<string, unknown>;

let cachedJwt: { token: string; exp: number } | null = null;

/** Clear the in-memory JWT cache. Call on logout/session expiry. */
export function clearJwtCache(): void {
  cachedJwt = null;
}

function makeIdemKey() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

async function getJwt(): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (cachedJwt && cachedJwt.exp - now > 60) return cachedJwt.token;
    const { jwt } = await account.createJWT();
    const exp = (() => {
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1] ?? ""));
        return typeof payload.exp === "number" ? payload.exp : now + 15 * 60;
      } catch {
        return now + 15 * 60;
      }
    })();
    cachedJwt = { token: jwt, exp };
    return jwt;
  } catch {
    clearJwtCache(); // Clear stale cache on failure (session expired/revoked)
    return null;
  }
}

// ── XR-005: Retry on 5xx / network errors ────────────────────────────────

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 500;

/**
 * Returns true if the request should be retried after a 5xx.
 * GET is always retryable; mutations only when idempotent.
 */
function isRetryable(status: number, method: string, hasIdemKey: boolean): boolean {
  if (status < 500) return false;         // Never retry 4xx
  if (method === "GET") return true;      // GET is always safe
  return hasIdemKey;                      // Mutations only if idempotent
}

/**
 * Fetch with automatic retry on 5xx responses and network errors.
 * Uses exponential backoff: 500ms → 1000ms.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries: number,
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const hasIdemKey = init.headers instanceof Headers && init.headers.has("idempotency-key");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);

      // If response is OK or not retryable, return immediately
      if (res.ok || !isRetryable(res.status, method, hasIdemKey)) {
        return res;
      }

      // 5xx and retryable — wait and retry (unless last attempt)
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, RETRY_BASE_MS * (2 ** attempt)));
        continue;
      }
      return res; // Last attempt — return the failing response
    } catch (err) {
      // Network errors (TypeError for DNS/CORS/connectivity failures)
      if (attempt < maxRetries && err instanceof TypeError) {
        await new Promise(r => setTimeout(r, RETRY_BASE_MS * (2 ** attempt)));
        continue;
      }
      throw err; // Non-retryable or exhausted retries
    }
  }
  // TypeScript exhaustiveness — should never reach here
  throw new Error("fetchWithRetry: unreachable");
}

export async function authFetch(path: string, opts: FetchOpts = {}) {
  const DIRECT_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  const url = DIRECT_BASE ? `${DIRECT_BASE}${path}` : path;
  const jwt = await getJwt();
  const method = (opts.method ?? "GET").toUpperCase();

  // Normalize/dedupe headers
  const headers = new Headers();
  if (opts.headers) new Headers(opts.headers).forEach((v, k) => headers.set(k, v));
  if (opts.body && !headers.has("content-type") && !(opts.body instanceof FormData)) headers.set("content-type", "application/json");
  if (jwt) headers.set("x-appwrite-jwt", jwt);
  if (method !== "GET") headers.set("idempotency-key", makeIdemKey());
  if (typeof window !== "undefined") {
    try { headers.set("x-timezone", Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* skip */ }
  }

  try {
    const res = await fetchWithRetry(url, {
      ...opts,
      headers,
      cache: "no-store",
      credentials: "include",
      mode: "cors",
    }, MAX_RETRIES);
    if (!res.ok) {
      // Auto-clear JWT cache on 401 so next request gets a fresh token
      if (res.status === 401) {
        clearJwtCache();
      }
      const raw = await res.text().catch(() => "");
      let detail = raw;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          detail = parsed?.detail || parsed?.message || raw;
        } catch {
          detail = raw;
        }
      }
      throw new Error(detail || `Request failed ${res.status}`);
    }
    return res;
  } catch (err) {
    const redacted = new Set(["authorization", "x-appwrite-jwt", "idempotency-key", "cookie", "set-cookie"]);
    const safeHeaders = [...headers.entries()].map(([key, value]) => [
      key,
      redacted.has(key.toLowerCase()) ? "[REDACTED]" : value,
    ]);

    // Surface network/CORS issues in the console for easier debugging
    console.error("authFetch network error", { url, method, headers: safeHeaders }, err);
    throw err;
  }
}

