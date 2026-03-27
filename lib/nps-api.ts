"use client";

import { authFetch } from "./api";

// ── NPS Survey API — B2C-026 ──────────────────────────────────────────────

export async function checkNpsEligibility(): Promise<boolean> {
  try {
    const res = await authFetch("/api/v1/nps/eligible");
    const data = await res.json();
    return data.eligible === true;
  } catch {
    return false; // Never block the user
  }
}

export async function submitNps(
  score: number,
  feedbackText?: string
): Promise<void> {
  await authFetch("/api/v1/nps", {
    method: "POST",
    body: JSON.stringify({ score, feedbackText }),
  });
}

export async function dismissNps(): Promise<void> {
  await authFetch("/api/v1/nps/dismiss", { method: "POST" });
}
