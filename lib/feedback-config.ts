"use client";

/**
 * lib/feedback-config.ts — Beta feedback frontend configuration
 *
 * Centralizes the feature flag check and shared constants.
 */

/**
 * Check if beta feedback is enabled via the NEXT_PUBLIC env var.
 * Returns false if unset — zero UI, zero API calls.
 */
export function isFeedbackEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_BETA_FEEDBACK === "true";
}

/**
 * Test mode: When true, bypasses ALL throttle/eligibility checks and
 * triggers the feedback sheet immediately on every page load/API call.
 *
 * Set NEXT_PUBLIC_BETA_FEEDBACK_TEST_MODE=true in .env.local for testing.
 * Always false in production (default).
 */
export function isFeedbackTestMode(): boolean {
  return process.env.NEXT_PUBLIC_BETA_FEEDBACK_TEST_MODE === "true";
}

/**
 * Check if the NPS survey popup is enabled.
 * Controls the "How likely to recommend Nutri?" modal.
 * Set NEXT_PUBLIC_ENABLE_NPS_SURVEY=true in .env.local for testing.
 * Always false if unset.
 */
export function isNpsSurveyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_NPS_SURVEY === "true";
}
