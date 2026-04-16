"use client";

import { useState } from "react";
import { isFeedbackEnabled } from "@/lib/feedback-config";
import { FeedbackMessageIcon } from "@/components/feedback/feedback-icons";
import { GlobalFeedbackModal } from "@/components/feedback/global-feedback-modal";
import { useFabPositions } from "@/contexts/fab-stack-context";

/**
 * components/feedback/feedback-fab.tsx
 *
 * Floating action button — round icon-only circle on both mobile and desktop.
 * Position is dynamically calculated via FabStackContext so it never overlaps
 * with the chatbot or quick-scan FABs.
 *
 * Gated behind NEXT_PUBLIC_ENABLE_BETA_FEEDBACK env flag.
 */
export function FeedbackFAB() {
  const [modalOpen, setModalOpen] = useState(false);
  const pos = useFabPositions();

  if (!isFeedbackEnabled()) return null;

  return (
    <>
      {/* Mobile */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed z-50 flex lg:hidden items-center justify-center right-4 w-12 h-12 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          bottom: pos.feedbackMobile,
          background: "#2D2D2D",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Send feedback"
      >
        <FeedbackMessageIcon />
      </button>

      {/* Desktop */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="fixed z-50 hidden lg:flex items-center justify-center right-6 w-14 h-14 rounded-full transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          bottom: pos.feedbackDesktop,
          background: "#2D2D2D",
          boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
          border: "none",
          cursor: "pointer",
        }}
        aria-label="Send feedback"
      >
        <FeedbackMessageIcon />
      </button>

      <GlobalFeedbackModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
