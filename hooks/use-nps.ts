"use client";

import { useState, useEffect } from "react";
import { checkNpsEligibility } from "../lib/nps-api";
import { isNpsSurveyEnabled } from "../lib/feedback-config";

/**
 * Hook to check NPS eligibility once per browser session.
 * Uses sessionStorage to avoid repeated API calls on navigation.
 * Gated behind NEXT_PUBLIC_ENABLE_NPS_SURVEY env toggle.
 */
export function useNps() {
  const [showNps, setShowNps] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isNpsSurveyEnabled()) return;
    if (sessionStorage.getItem("nps_checked")) return;

    checkNpsEligibility()
      .then((eligible) => {
        sessionStorage.setItem("nps_checked", "1");
        if (eligible) setShowNps(true);
      })
      .catch(() => {
        // Don't set marker — allow retry on next navigation
      });
  }, []);

  return { showNps, setShowNps };
}
