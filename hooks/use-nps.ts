"use client";

import { useState, useEffect } from "react";
import { checkNpsEligibility } from "../lib/nps-api";

/**
 * Hook to check NPS eligibility once per browser session.
 * Uses sessionStorage to avoid repeated API calls on navigation.
 */
export function useNps() {
  const [showNps, setShowNps] = useState(false);

  useEffect(() => {
    // Only check once per session
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("nps_checked")) return;

    sessionStorage.setItem("nps_checked", "1");
    checkNpsEligibility()
      .then((eligible) => {
        if (eligible) setShowNps(true);
      })
      .catch(() => {
        // Silently fail — never block UX
      });
  }, []);

  return { showNps, setShowNps };
}
