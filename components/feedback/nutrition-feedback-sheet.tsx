"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FeedbackSheet,
  FeedbackOption,
  FeedbackChip,
  FeedbackSubmitButton,
} from "./feedback-sheet";

interface NutritionFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    questionKey: string;
    responseValue?: string;
    followUpText?: string;
    followUpTags?: string[];
  }) => Promise<void>;
  onDismiss: () => void;
}

const USEFULNESS_OPTIONS = [
  "Very useful",
  "Somewhat useful",
  "Not very useful",
  "I don't use it",
];

const IMPROVEMENT_CHIPS = [
  "More macro details",
  "Better visualizations",
  "Meal comparisons",
  "Goal tracking",
  "Weekly trends",
  "Other",
];

/**
 * Flow: Nutrition Dashboard Feedback
 *
 * Q1: "How useful is the nutrition dashboard for tracking your goals?"
 * Q2 (follow-up for negative): "What improvements would help you the most?" (chips)
 */
export function NutritionFeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  onDismiss,
}: NutritionFeedbackSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [usefulness, setUsefulness] = useState<string | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmitQ1 = async () => {
    if (!usefulness) return;
    if (usefulness === "Not very useful" || usefulness === "I don't use it") {
      setStep(2);
      return;
    }
    setSubmitting(true);
    await onSubmit({
      questionKey: "nutrition_usefulness",
      responseValue: usefulness,
    });
    setSubmitting(false);
  };

  const handleSubmitQ2 = async () => {
    setSubmitting(true);
    await onSubmit({
      questionKey: "nutrition_usefulness",
      responseValue: usefulness!,
      followUpText: freeText || undefined,
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
        step === 1
          ? "How useful is this dashboard?"
          : "What improvements would help?"
      }
    >
      {step === 1 ? (
        <>
          <p
            className="text-[13px] text-[#64748B]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            How useful is the nutrition dashboard for tracking your goals?
          </p>

          <div className="space-y-2">
            {USEFULNESS_OPTIONS.map((opt) => (
              <FeedbackOption
                key={opt}
                label={opt}
                selected={usefulness === opt}
                onClick={() => setUsefulness(opt)}
              />
            ))}
          </div>

          <FeedbackSubmitButton
            onClick={handleSubmitQ1}
            disabled={!usefulness}
            loading={submitting}
            label={
              usefulness === "Not very useful" || usefulness === "I don't use it"
                ? "Next"
                : "Submit"
            }
          />
        </>
      ) : (
        <>
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
            placeholder="Anything else? (optional)"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            maxLength={500}
            className="text-[13px]"
            style={{ fontFamily: "Inter, sans-serif" }}
          />

          <FeedbackSubmitButton
            onClick={handleSubmitQ2}
            loading={submitting}
          />
        </>
      )}
    </FeedbackSheet>
  );
}
