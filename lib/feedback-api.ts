"use client";

import { authFetch } from "./api";

// ── Beta Feedback API — Client ─────────────────────────────────────────────

export type FeedbackFlow =
  | "feed"
  | "nutrition"
  | "meal_plan"
  | "ai_chat"
  | "recipe_analyzer"
  | "search"
  | "grocery_substitutions";

/**
 * Check if the current user is eligible for a feedback prompt on the given flow.
 * Returns false on any error to avoid blocking the user.
 */
export async function checkFeedbackEligibility(flow: FeedbackFlow): Promise<boolean> {
  try {
    const res = await authFetch(`/api/v1/feedback/eligible?flow=${flow}`);
    const data = await res.json();
    return data.eligible === true;
  } catch {
    return false;
  }
}

/**
 * Submit a feedback response.
 */
export async function submitBetaFeedback(payload: {
  flow: FeedbackFlow;
  questionKey: string;
  responseValue?: string;
  followUpText?: string;
  followUpTags?: string[];
  isSafetyFlag?: boolean;
  contextMetadata?: Record<string, unknown>;
}): Promise<void> {
  await authFetch("/api/v1/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Record that a feedback prompt was dismissed (analytics only).
 */
export async function dismissBetaFeedback(flow: FeedbackFlow): Promise<void> {
  await authFetch("/api/v1/feedback/dismiss", {
    method: "POST",
    body: JSON.stringify({ flow }),
  });
}

/**
 * Record that a feedback prompt was displayed (throttle update).
 */
export async function recordFeedbackShown(flow: FeedbackFlow): Promise<void> {
  try {
    await authFetch("/api/v1/feedback/shown", {
      method: "POST",
      body: JSON.stringify({ flow }),
    });
  } catch {
    // Best-effort — don't block UI if this fails
  }
}
