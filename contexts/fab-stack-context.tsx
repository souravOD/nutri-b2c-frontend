"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { isFeedbackEnabled } from "@/lib/feedback-config";

/**
 * contexts/fab-stack-context.tsx
 *
 * Centralised context that calculates dynamic `bottom` positions for all
 * right-side floating action buttons so they never overlap.
 *
 * Stack order (from bottom to top, mobile):
 *   1. Feedback  (lowest, just above bottom nav)
 *   2. Chatbot   (above feedback)
 *   3. QuickScan (highest)
 *
 * Stack order (desktop — no bottom nav):
 *   1. Feedback  (lowest)
 *   2. Chatbot   (above feedback)
 *
 * QuickScan is mobile/page-specific — hidden on desktop (lg:hidden).
 *
 * Positions auto-adjust when feedback is disabled; the chatbot
 * slides down to reclaim the space.
 */

// ── constants ───────────────────────────────────────────────
const BUTTON_SIZE_MOBILE = 48; // w-12
const BUTTON_SIZE_DESKTOP = 56; // w-14 (lg)
const GAP = 16; // space between buttons
const BOTTOM_NAV_HEIGHT = 76; // bottom-nav.tsx: 9+18+4+15+28 ≈ 74, rounded up
const DESKTOP_BASE = 24; // bottom-6 equivalent

interface FabPositions {
  /** Feedback FAB */
  feedbackMobile: number;
  feedbackDesktop: number;
  /** Chatbot FAB */
  chatbotMobile: number;
  chatbotDesktop: number;
  /** QuickScan FAB (mobile only, page-specific) */
  quickScanMobile: number;
}

const FabStackContext = createContext<FabPositions | null>(null);

export function FabStackProvider({ children }: { children: ReactNode }) {
  const feedbackOn = isFeedbackEnabled();

  const positions = useMemo<FabPositions>(() => {
    // ── Mobile stack (bottom → top) ───────────────────────
    let nextMobile = BOTTOM_NAV_HEIGHT + 8; // 8px above nav

    const feedbackMobile = nextMobile;

    if (feedbackOn) {
      nextMobile += BUTTON_SIZE_MOBILE + GAP;
    }

    const chatbotMobile = nextMobile;
    nextMobile += BUTTON_SIZE_MOBILE + GAP;

    const quickScanMobile = nextMobile;

    // ── Desktop stack (bottom → top) ─────────────────────
    let nextDesktop = DESKTOP_BASE;

    const feedbackDesktop = nextDesktop;

    if (feedbackOn) {
      nextDesktop += BUTTON_SIZE_DESKTOP + GAP;
    }

    const chatbotDesktop = nextDesktop;

    return {
      feedbackMobile,
      feedbackDesktop,
      chatbotMobile,
      chatbotDesktop,
      quickScanMobile,
    };
  }, [feedbackOn]);

  return (
    <FabStackContext.Provider value={positions}>
      {children}
    </FabStackContext.Provider>
  );
}

export function useFabPositions(): FabPositions {
  const ctx = useContext(FabStackContext);
  if (!ctx) {
    // Fallback if outside provider — shouldn't happen in practice
    return {
      feedbackMobile: 84,
      feedbackDesktop: 24,
      chatbotMobile: 148,
      chatbotDesktop: 96,
      quickScanMobile: 212,
    };
  }
  return ctx;
}
