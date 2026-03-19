// lib/api/core.ts — Auth-aware fetch, JWT caching, and shared helpers
"use client";

import { account } from "../appwrite";

export type FetchOpts = Omit<RequestInit, "headers"> & { headers?: HeadersInit };
type JsonRecord = Record<string, unknown>;

let cachedJwt: { token: string; exp: number } | null = null;

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
    return null;
  }
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
    const res = await fetch(url, {
      ...opts,
      headers,
      cache: "no-store",
      credentials: "include",
      mode: "cors",
    });
    if (!res.ok) {
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
