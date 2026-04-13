"use client";

import { useState, useCallback } from "react";
import { isFeedbackEnabled } from "@/lib/feedback-config";
import {
  submitBetaFeedback,
  type FeedbackFlow,
} from "@/lib/feedback-api";

interface SubstitutionFeedbackInlineProps {
  /** The item that was substituted */
  itemName: string;
}

const QUALITY_OPTIONS = [
  { label: "Yes 👍", value: "yes" },
  { label: "Somewhat", value: "somewhat" },
  { label: "No 👎", value: "no" },
];

/**
 * Flow 6: Grocery Substitutions — Inline feedback card
 *
 * Renders INSIDE the substitutions panel (below the subs list) in ItemRow.
 * NOT a sheet — just a compact inline card that fits the expand-in-place pattern.
 *
 * Responsive: Uses flex-wrap for narrow screens (<360px).
 */
export function SubstitutionFeedbackInline({
  itemName,
}: SubstitutionFeedbackInlineProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Don't render if feedback is disabled
  if (!isFeedbackEnabled()) return null;

  const handleSelect = useCallback(async (value: string) => {
    setSelected(value);
    setSubmitted(true);
    try {
      await submitBetaFeedback({
        flow: "grocery_substitutions" as FeedbackFlow,
        questionKey: "substitution_quality",
        responseValue: value,
        contextMetadata: { itemName },
      });
    } catch {
      // Best-effort
    }
  }, [itemName]);

  if (submitted) {
    return (
      <div
        className="mt-2 p-2 rounded-lg bg-[#ECFCCB]/50 text-center"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        <p className="text-[11px] text-[#538100] font-medium">Thanks for your feedback! 🎉</p>
      </div>
    );
  }

  return (
    <div className="mt-2 p-2.5 rounded-lg bg-white border border-[#E2E8F0]">
      <p
        className="text-[11px] text-[#64748B] mb-1.5"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Were these substitutions helpful?
      </p>
      <div className="flex flex-wrap gap-1.5">
        {QUALITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className="h-6 px-2 sm:px-2.5 rounded-full bg-[#F7F8F6] border border-[#E2E8F0] text-[10px] sm:text-[11px] font-medium text-[#0F172A] hover:border-[#99CC33] hover:bg-[#ECFCCB] transition-colors"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
