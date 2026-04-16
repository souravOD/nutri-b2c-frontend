"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { submitBetaFeedback } from "@/lib/feedback-api";
import { usePageFeature, ALL_FEATURES, type PageFeature } from "@/hooks/use-page-feature";
import {
  StarIcon,
  IssueBugIcon,
  SuggestionIcon,
  PraiseIcon,
  CloseIcon,
  ChevronDownIcon,
} from "@/components/feedback/feedback-icons";

interface GlobalFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FeedbackType = "issue" | "suggestion" | "praise";

const FEEDBACK_TYPES: Array<{ key: FeedbackType; label: string }> = [
  { key: "issue", label: "Issue/Bug" },
  { key: "suggestion", label: "Suggestion" },
  { key: "praise", label: "Praise" },
];

export function GlobalFeedbackModal({ open, onOpenChange }: GlobalFeedbackModalProps) {
  const autoFeature = usePageFeature();

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>("suggestion");
  const [selectedFeature, setSelectedFeature] = useState<PageFeature>(autoFeature);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync auto-detected feature when route changes
  useEffect(() => {
    setSelectedFeature(autoFeature);
  }, [autoFeature]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRating(0);
      setHoveredStar(0);
      setFeedbackType("suggestion");
      setSelectedFeature(autoFeature);
      setComments("");
      setSubmitted(false);
      setDropdownOpen(false);
    }
  }, [open, autoFeature]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // ESC to close modal
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
        onOpenChange(false);
      }
    },
    [onOpenChange]
  );

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(false);
    try {
      await submitBetaFeedback({
        flow: "user_initiated",
        questionKey: "global_feedback",
        responseValue: rating ? String(rating) : undefined,
        followUpText: comments || undefined,
        rating: rating || undefined,
        feedbackType,
        feature: selectedFeature.code,
        contextMetadata: {
          featureLabel: selectedFeature.label,
          source: "fab_button",
        },
      });
      setSubmitted(true);
      setTimeout(() => onOpenChange(false), 1800);
    } catch (err) {
      console.error("[GlobalFeedback] submit failed:", err);
      setSubmitError(true);
    } finally {
      setIsSubmitting(false);
    }
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
            Your feedback helps us build a better experience for everyone.
          </p>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
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
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 flex items-center justify-center transition-colors"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "#F4F4F5",
            }}
            aria-label="Close feedback form"
          >
            <CloseIcon />
          </button>

          <h2
            id="feedback-modal-title"
            className="text-[20px] font-extrabold pr-10"
            style={{ color: "#18181B", letterSpacing: "-0.5px", lineHeight: "28px" }}
          >
            Help us improve Nutri.
            <br />
            What&apos;s on your mind?
          </h2>
          <p
            className="mt-2 text-[14px] font-medium"
            style={{ color: "#71717A", lineHeight: "20px" }}
          >
            Your feedback helps us build a better experience for everyone.
          </p>
        </div>

        {/* ── Form body ───────────────────────────────────── */}
        <div className="px-6 pb-2 sm:px-8 space-y-6 mt-4">
          {/* Rate your experience */}
          <div>
            <label
              className="block text-[12px] font-bold uppercase mb-3"
              style={{ color: "#A1A1AA", letterSpacing: "0.6px" }}
            >
              Rate your experience
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= (hoveredStar || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    className="p-0.5 transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  >
                    <StarIcon fill={isFilled ? "#99CC33" : "#D4D4D8"} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback type */}
          <div>
            <label
              className="block text-[12px] font-bold uppercase mb-3"
              style={{ color: "#A1A1AA", letterSpacing: "0.6px" }}
            >
              Feedback type
            </label>
            <div className="grid grid-cols-3 gap-3">
              {FEEDBACK_TYPES.map(({ key, label }) => {
                const isSelected = feedbackType === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFeedbackType(key)}
                    className="flex flex-col items-center gap-2 p-[18px] transition-all"
                    style={{
                      borderRadius: 16,
                      border: `2px solid ${isSelected ? "#99CC33" : "#F4F4F5"}`,
                      background: isSelected ? "rgba(153,204,51,0.05)" : "white",
                    }}
                  >
                    {key === "issue" && (
                      <IssueBugIcon fill={isSelected ? "#18181B" : "#A1A1AA"} />
                    )}
                    {key === "suggestion" && (
                      <SuggestionIcon fill={isSelected ? "#18181B" : "#A1A1AA"} />
                    )}
                    {key === "praise" && (
                      <PraiseIcon fill={isSelected ? "#18181B" : "#A1A1AA"} />
                    )}
                    <span
                      className="text-[12px] font-bold"
                      style={{ color: "#18181B" }}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Select feature */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="text-[12px] font-bold uppercase"
                style={{ color: "#A1A1AA", letterSpacing: "0.6px" }}
              >
                Select feature
              </label>
              <span
                className="text-[10px] font-bold uppercase"
                style={{ color: "#D4D4D8", letterSpacing: "0.6px" }}
              >
                Optional
              </span>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between p-[18px] transition-colors"
                style={{
                  borderRadius: 16,
                  border: `2px solid ${dropdownOpen ? "#99CC33" : "#F4F4F5"}`,
                  background: "white",
                }}
              >
                <span
                  className="text-[16px] font-medium"
                  style={{ color: "#18181B" }}
                >
                  {selectedFeature.label}
                </span>
                <ChevronDownIcon
                  style={{
                    transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute top-full left-0 right-0 mt-2 overflow-y-auto z-10"
                  style={{
                    maxHeight: 240,
                    borderRadius: 16,
                    border: "2px solid #F4F4F5",
                    background: "white",
                    boxShadow: "0px 10px 25px -5px rgba(0,0,0,0.1)",
                  }}
                >
                  {ALL_FEATURES.map((feat) => (
                    <button
                      key={feat.code}
                      type="button"
                      onClick={() => {
                        setSelectedFeature(feat);
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-[18px] py-3 transition-colors"
                      style={{
                        color:
                          selectedFeature.code === feat.code
                            ? "#99CC33"
                            : "#18181B",
                        fontWeight:
                          selectedFeature.code === feat.code ? 600 : 400,
                        fontSize: 14,
                        background:
                          selectedFeature.code === feat.code
                            ? "rgba(153,204,51,0.05)"
                            : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedFeature.code !== feat.code) {
                          e.currentTarget.style.background = "#FAFAFA";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedFeature.code !== feat.code) {
                          e.currentTarget.style.background = "transparent";
                        }
                      }}
                    >
                      {feat.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Your comments */}
          <div>
            <label
              className="block text-[12px] font-bold uppercase mb-3"
              style={{ color: "#A1A1AA", letterSpacing: "0.6px" }}
            >
              Your comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Tell us more about your experience..."
              maxLength={2000}
              className="w-full resize-none outline-none text-[16px] placeholder:font-normal"
              style={{
                minHeight: 120,
                borderRadius: 16,
                border: "2px solid #F4F4F5",
                padding: "18px 22px",
                color: "#18181B",
                fontFamily: "Inter, sans-serif",
                lineHeight: "24px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#99CC33";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#F4F4F5";
              }}
            />
          </div>
        </div>

        {/* ── Footer / CTA ────────────────────────────────── */}
        <div
          className="px-6 pb-8 pt-4 sm:px-8"
          style={{ borderTop: "1px solid #F4F4F5" }}
        >
          {submitError && (
            <div
              className="mb-3 flex items-center gap-2 px-4 py-3 text-[13px] font-semibold"
              style={{
                borderRadius: 12,
                background: "#FEF2F2",
                color: "#DC2626",
                border: "1px solid #FECACA",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Something went wrong. Please try again.
            </div>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center transition-all"
            style={{
              borderRadius: 100,
              padding: "20px 0",
              background: isSubmitting ? "#B8E065" : "#99CC33",
              boxShadow:
                "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.8 : 1,
            }}
          >
            <span
              className="text-[18px] font-extrabold"
              style={{ color: "black", fontFamily: "Inter, sans-serif" }}
            >
              {isSubmitting ? "Sending..." : "Send Feedback"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
