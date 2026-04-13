"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { isFeedbackEnabled, isFeedbackTestMode } from "@/lib/feedback-config";
import {
  checkFeedbackEligibility,
  submitBetaFeedback,
  dismissBetaFeedback,
  recordFeedbackShown,
  type FeedbackFlow,
} from "@/lib/feedback-api";

interface UseBetaFeedbackOptions {
  /** Delay in ms before checking eligibility (default: 3000) */
  delay?: number;
  /** Guard condition — must be true for eligibility check to fire */
  enabled?: boolean;
  /** Flow-specific metadata to attach to submissions */
  context?: Record<string, unknown>;
}

/**
 * Reusable hook for all 6 feedback flows.
 *
 * Handles: feature flag → session dedup → delay → eligibility API → throttle recording.
 * Returns controls to show/hide the feedback UI and submit/dismiss responses.
 *
 * TEST MODE (NEXT_PUBLIC_BETA_FEEDBACK_TEST_MODE=true):
 *   Bypasses all gates — shows sheet immediately on every mount.
 *   Useful for local UI testing without needing DB tables or API endpoints.
 */
export function useBetaFeedback(flow: FeedbackFlow, options: UseBetaFeedbackOptions = {}) {
  const { delay = 3000, enabled = true, context = {} } = options;

  const [show, setShow] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    // Gate 1: Feature flag (client-side env var)
    if (!isFeedbackEnabled()) return;

    // Gate 2: Guard condition from caller
    if (!enabled) return;

    // ─── TEST MODE: bypass all throttle/dedup/eligibility checks ───
    if (isFeedbackTestMode()) {
      // Show immediately with a minimal delay (500ms) so the page renders first
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }

    // ─── PRODUCTION MODE: full gate chain ───

    // Gate 3: Already checked this hook instance (prevents re-fire on re-renders)
    if (checkedRef.current) return;

    // Gate 4: Session dedup — only one eligibility check per flow per browser session
    if (typeof window === "undefined") return;
    const sessionKey = `feedback_checked_${flow}`;
    if (sessionStorage.getItem(sessionKey)) return;

    checkedRef.current = true;

    const timer = setTimeout(async () => {
      try {
        const eligible = await checkFeedbackEligibility(flow);
        sessionStorage.setItem(sessionKey, "1");
        if (eligible) {
          setShow(true);
          // Record that we showed the prompt (throttle update)
          recordFeedbackShown(flow);
        }
      } catch {
        // Never block the user
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [flow, delay, enabled]);

  /**
   * Submit a feedback response and close the sheet.
   */
  const submit = useCallback(
    async (data: {
      questionKey: string;
      responseValue?: string;
      followUpText?: string;
      followUpTags?: string[];
      isSafetyFlag?: boolean;
    }) => {
      try {
        await submitBetaFeedback({
          flow,
          ...data,
          contextMetadata: context,
        });
      } catch {
        // Best-effort
      } finally {
        setShow(false);
      }
    },
    [flow, context]
  );

  /**
   * Dismiss (close without answering). Records dismissal for analytics.
   */
  const dismiss = useCallback(async () => {
    try {
      await dismissBetaFeedback(flow);
    } catch {
      // Best-effort
    } finally {
      setShow(false);
    }
  }, [flow]);

  return { show, setShow, submit, dismiss };
}
