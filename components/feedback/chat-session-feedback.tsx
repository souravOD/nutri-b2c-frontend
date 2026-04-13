"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { FeedbackChip, FeedbackOption, FeedbackSubmitButton } from "./feedback-sheet";

interface ChatSessionFeedbackProps {
  onSubmit: (data: {
    questionKey: string;
    responseValue?: string;
    followUpText?: string;
    followUpTags?: string[];
  }) => Promise<void>;
  onDismiss: () => void;
}

const HELPFULNESS_OPTIONS = [
  "Very helpful",
  "Somewhat helpful",
  "Not helpful",
];

const IMPROVEMENT_CHIPS = [
  "Better recipes",
  "More accurate info",
  "Faster responses",
  "Understand context",
  "Felt unsafe",
  "Other",
];

/**
 * Flow 3b: AI Chat Session-End Feedback
 *
 * Renders IN-PLACE inside the chat panel (NOT as a Sheet overlay).
 * This replaces the message list when the user closes the chat after ≥3 bot messages.
 *
 * Responsive by design — it fills whatever container the chat panel provides:
 * - Mobile: full-screen chat area (inset-0 bottom-[72px])
 * - Tablet/Desktop: 400px × 540px floating panel
 */
export function ChatSessionFeedback({
  onSubmit,
  onDismiss,
}: ChatSessionFeedbackProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [helpfulness, setHelpfulness] = useState<string | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmitQ1 = () => {
    if (!helpfulness) return;
    if (helpfulness === "Not helpful") {
      setStep(2);
      return;
    }
    handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    const isSafety = selectedChips.includes("Felt unsafe");
    await onSubmit({
      questionKey: "chat_helpfulness",
      responseValue: helpfulness!,
      followUpText: freeText || undefined,
      followUpTags: selectedChips.length > 0 ? selectedChips : undefined,
      ...(isSafety && { isSafetyFlag: true }),
    });
    setSubmitting(false);
  };

  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-full bg-[#99CC33]/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-[24px]">💬</span>
        </div>
        <h3
          className="text-[16px] font-bold text-[#0F172A]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {step === 1 ? "How was your chat?" : "What could be better?"}
        </h3>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            {HELPFULNESS_OPTIONS.map((opt) => (
              <FeedbackOption
                key={opt}
                label={opt}
                selected={helpfulness === opt}
                onClick={() => setHelpfulness(opt)}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 h-10 rounded-xl text-[13px] font-medium text-[#64748B] border border-[#E2E8F0] hover:bg-[#F1F5F9] transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Skip
            </button>
            <FeedbackSubmitButton
              onClick={handleSubmitQ1}
              disabled={!helpfulness}
              loading={submitting}
              label={helpfulness === "Not helpful" ? "Next" : "Submit"}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {IMPROVEMENT_CHIPS.map((chip) => (
              <FeedbackChip
                key={chip}
                label={chip}
                selected={selectedChips.includes(chip)}
                onClick={() => toggleChip(chip)}
              />
            ))}
          </div>

          <Textarea
            placeholder="Tell us more... (optional)"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            maxLength={500}
            className="text-[13px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          />

          <FeedbackSubmitButton
            onClick={handleFinalSubmit}
            loading={submitting}
          />
        </div>
      )}
    </div>
  );
}
