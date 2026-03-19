// lib/api/history.ts — Recently viewed / history
"use client";

import { authFetch } from "./core";

type JsonRecord = Record<string, unknown>;

export async function apiLogHistoryView(recipeId: string) {
  await authFetch(`/api/v1/me/history`, {
    method: "POST",
    body: JSON.stringify({ recipeId, event: "viewed" }),
  });
}

export async function apiGetRecentlyViewed(limit = 20) {
  const res = await authFetch(`/api/v1/me/recently-viewed?limit=${limit}`, {
    method: "GET",
  });
  return res.json() as Promise<Array<{ history: JsonRecord; recipe: JsonRecord }>>;
}
