"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { submitNps, dismissNps } from "@/lib/nps-api";

/**
 * components/nps/nps-survey-modal.tsx
 *
 * Redesigned NPS survey modal matching the global feedback modal's
 * premium Figma theme (white card, rounded-32, Nutri Green CTA).
 *
 * Replaces the original generic shadcn Dialog implementation.
 */

interface NpsSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NpsSurveyModal({ open, onOpenChange }: NpsSurveyModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setScore(null);
      setFeedback("");
      setSubmitted(false);
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleDismiss();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onOpenChange]
  );

  const handleSubmit = async () => {
    if (score === null || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await submitNps(score, feedback || undefined);
      setSubmitted(true);
      setTimeout(() => onOpenChange(false), 1800);
    } catch (err) {
      console.error("[NPS] submit failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await dismissNps();
    } catch {
      // Best-effort
    }
    onOpenChange(false);
  };

  if (!open) return null;

  // ── Success state ─────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center px-4"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <div
          className="w-full max-w-[512px] bg-white flex flex-col items-center gap-4 py-12 px-8"
          style={{
            borderRadius: 32,
            boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)",
            fontFamily: "Inter, sans-serif",
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(153,204,51,0.1)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                fill="#99CC33"
              />
            </svg>
          </div>
          <h2
            className="text-[20px] font-extrabold text-center"
            style={{ color: "#18181B", letterSpacing: "-0.5px" }}
          >
            Thank you!
          </h2>
          <p
            className="text-[14px] font-medium text-center"
            style={{ color: "#71717A" }}
          >
            Your feedback helps us make Nutri better for everyone.
          </p>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className="w-full max-w-[512px] bg-white overflow-y-auto"
        style={{
          borderRadius: 32,
          boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)",
          maxHeight: "90vh",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* ── Header ──────────────────────────────────────── */}
        <div className="relative px-6 pt-8 pb-2 sm:px-8">
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-6 right-6 flex items-center justify-center transition-colors"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F4F4F5",
            }}
            aria-label="Close NPS survey"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 11.6667 11.6667"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.16667 11.6667L0 10.5L4.66667 5.83333L0 1.16667L1.16667 0L5.83333 4.66667L10.5 0L11.6667 1.16667L7 5.83333L11.6667 10.5L10.5 11.6667L5.83333 7L1.16667 11.6667"
                fill="#71717A"
              />
            </svg>
          </button>

          <h2
            className="text-[20px] font-extrabold pr-10"
            style={{ color: "#18181B", letterSpacing: "-0.5px", lineHeight: "28px" }}
          >
            How likely are you to
            <br />
            recommend Nutri?
          </h2>
          <p
            className="mt-2 text-[14px] font-medium"
            style={{ color: "#71717A", lineHeight: "20px" }}
          >
            On a scale of 0 to 10, how likely are you to recommend Nutri to a
            friend or colleague?
          </p>
        </div>

        {/* ── Form body ───────────────────────────────────── */}
        <div className="px-6 pb-2 sm:px-8 space-y-6 mt-4">
          {/* Score selector */}
          <div>
            <label
              className="block text-[12px] font-bold uppercase mb-3"
              style={{ color: "#A1A1AA", letterSpacing: "0.6px" }}
            >
              Your score
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => {
                const isSelected = score === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setScore(i)}
                    className="flex items-center justify-center transition-all duration-150"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: "Inter, sans-serif",
                      background: isSelected ? "#99CC33" : "#F4F4F5",
                      color: isSelected ? "white" : "#71717A",
                      border: isSelected
                        ? "2px solid #99CC33"
                        : "2px solid transparent",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                    }}
                    aria-label={`Score ${i}`}
                  >
                    {i}
                  </button>
                );
              })}
            </div>
            <div
              className="flex justify-between mt-2 px-1 text-[11px] font-medium"
              style={{ color: "#A1A1AA" }}
            >
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>

          {/* Feedback textarea — show after score selection */}
          {score !== null && (
            <div>
              <label
                className="block text-[12px] font-bold uppercase mb-3"
                style={{ color: "#A1A1AA", letterSpacing: "0.6px" }}
              >
                {score <= 6
                  ? "We're sorry to hear that. What could we improve?"
                  : score <= 8
                    ? "Thanks! What would make it a 10?"
                    : "Awesome! What do you love most?"}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Your feedback (optional)..."
                maxLength={2000}
                rows={3}
                className="w-full resize-none outline-none text-[14px] placeholder:font-normal"
                style={{
                  borderRadius: 16,
                  border: "2px solid #F4F4F5",
                  padding: "18px 22px",
                  color: "#18181B",
                  fontFamily: "Inter, sans-serif",
                  lineHeight: "22px",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#99CC33";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#F4F4F5";
                }}
              />
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div
          className="px-6 pb-8 pt-4 sm:px-8 flex items-center gap-3"
          style={{ borderTop: "1px solid #F4F4F5" }}
        >
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center transition-all"
            style={{
              borderRadius: 100,
              padding: "16px 0",
              background: "transparent",
              border: "2px solid #F4F4F5",
              cursor: "pointer",
            }}
          >
            <span
              className="text-[14px] font-semibold"
              style={{ color: "#71717A", fontFamily: "Inter, sans-serif" }}
            >
              Not now
            </span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={score === null || isSubmitting}
            className="flex-1 flex items-center justify-center transition-all"
            style={{
              borderRadius: 100,
              padding: "16px 0",
              background: score === null ? "#E8E8E0" : isSubmitting ? "#B8E065" : "#99CC33",
              boxShadow:
                score !== null
                  ? "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)"
                  : "none",
              cursor: score === null ? "not-allowed" : isSubmitting ? "not-allowed" : "pointer",
              opacity: score === null ? 0.6 : isSubmitting ? 0.8 : 1,
            }}
          >
            <span
              className="text-[14px] font-extrabold"
              style={{
                color: score === null ? "#A1A1AA" : "black",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
