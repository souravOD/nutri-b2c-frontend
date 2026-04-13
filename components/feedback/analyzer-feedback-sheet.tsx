"use client";

import { useState } from "react";
import {
  FeedbackSheet,
  FeedbackOption,
  FeedbackChip,
  FeedbackSubmitButton,
} from "./feedback-sheet";

interface AnalyzerFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    questionKey: string;
    responseValue?: string;
    followUpTags?: string[];
  }) => Promise<void>;
  onDismiss: () => void;
}

const ACCURACY_OPTIONS = [
  "Very accurate",
  "Mostly right",
  "Some issues",
  "Not accurate",
];

const ISSUE_CHIPS = [
  "Wrong calories",
  "Missing ingredients",
  "Wrong portions",
  "Allergens missed",
  "Other",
];

/**
 * Flow 4: Recipe Analyzer
 *
 * Q1: "How accurate was the analysis?"
 * Q2 (on negative): "What was wrong?" (chips)
 *
 * IMPORTANT: Must be rendered at the RecipeAnalyzerInner component root,
 * OUTSIDE both renderMobile() and renderDesktop() trees.
 * This is because the Sheet is portal-based and works for both viewport trees.
 */
export function AnalyzerFeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  onDismiss,
}: AnalyzerFeedbackSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [accuracy, setAccuracy] = useState<string | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmitQ1 = async () => {
    if (!accuracy) return;
    if (accuracy === "Some issues" || accuracy === "Not accurate") {
      setStep(2);
      return;
    }
    setSubmitting(true);
    await onSubmit({
      questionKey: "analysis_accuracy",
      responseValue: accuracy,
    });
    setSubmitting(false);
  };

  const handleSubmitQ2 = async () => {
    setSubmitting(true);
    await onSubmit({
      questionKey: "analysis_accuracy",
      responseValue: accuracy!,
      followUpTags: selectedChips.length > 0 ? selectedChips : undefined,
    });
    setSubmitting(false);
  };

  return (
    <FeedbackSheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onDismiss();
        onOpenChange(o);
      }}
      title={
        step === 1 ? "How was the analysis?" : "What was off?"
      }
    >
      {step === 1 ? (
        <>
          <p
            className="text-[13px] text-[#64748B]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            How accurate was the nutritional breakdown?
          </p>

          <div className="space-y-2">
            {ACCURACY_OPTIONS.map((opt) => (
              <FeedbackOption
                key={opt}
                label={opt}
                selected={accuracy === opt}
                onClick={() => setAccuracy(opt)}
              />
            ))}
          </div>

          <FeedbackSubmitButton
            onClick={handleSubmitQ1}
            disabled={!accuracy}
            loading={submitting}
            label={
              accuracy === "Some issues" || accuracy === "Not accurate"
                ? "Next"
                : "Submit"
            }
          />
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {ISSUE_CHIPS.map((chip) => (
              <FeedbackChip
                key={chip}
                label={chip}
                selected={selectedChips.includes(chip)}
                onClick={() => toggleChip(chip)}
              />
            ))}
          </div>

          <FeedbackSubmitButton
            onClick={handleSubmitQ2}
            loading={submitting}
          />
        </>
      )}
    </FeedbackSheet>
  );
}
