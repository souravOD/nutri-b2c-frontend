// lib/api/settings.ts — User settings
"use client";

import { authFetch } from "./core";

export async function apiGetSettings() {
  const r = await authFetch("/api/v1/me/settings");
  return r.json();
}

export async function apiPatchSettings(body: Record<string, unknown>) {
  return authFetch("/api/v1/me/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
