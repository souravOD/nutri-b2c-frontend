"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FeedbackSheet,
  FeedbackChip,
  FeedbackOption,
  FeedbackSubmitButton,
} from "./feedback-sheet";

interface MealPlanFeedbackSheetProps {
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

const IMPROVEMENT_CHIPS = [
  "Too many ingredients",
  "Too complex",
  "Doesn't match diet",
  "Too expensive",
  "Repeat meals",
  "Other",
];

const FAMILY_OPTIONS = [
  "Yes, great for everyone",
  "Mostly, with small changes",
  "Not really",
];

/**
 * Flow 2: Meal Plan Generation
 *
 * Q1: Star rating 1-5 "How well does this plan fit your preferences?"
 * Q2 (on ≤3 stars): "What could be better?" (chips)
 * Q3: "Would this plan work for your whole family?"
 */
export function MealPlanFeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  onDismiss,
}: MealPlanFeedbackSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rating, setRating] = useState<number | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [familyFit, setFamilyFit] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmitRating = () => {
    if (rating === null) return;
    if (rating <= 3) {
      setStep(2);
    } else {
      setStep(3);
    }
  };

  const handleSubmitChips = () => {
    setStep(3);
  };

  const handleSubmitFamily = async () => {
    setSubmitting(true);
    // Submit Q1 first
    await onSubmit({
      questionKey: "plan_fit",
      responseValue: `${rating} stars`,
      followUpText: freeText || undefined,
      followUpTags: selectedChips.length > 0 ? selectedChips : undefined,
    });
    // Submit Q3 (family fit) as a separate response
    if (familyFit) {
      await onSubmit({
        questionKey: "family_fit",
        responseValue: familyFit,
      });
    }
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
          ? "How's your meal plan?"
          : step === 2
            ? "What could be better?"
            : "Family fit?"
      }
    >
      {step === 1 ? (
        <>
          <p
            className="text-[13px] text-[#64748B]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            How well does this plan fit your preferences?
          </p>

          {/* Star rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="text-[28px] transition-transform hover:scale-110"
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
              >
                {rating !== null && n <= rating ? "⭐" : "☆"}
              </button>
            ))}
          </div>

          <FeedbackSubmitButton
            onClick={handleSubmitRating}
            disabled={rating === null}
            label="Next"
          />
        </>
      ) : step === 2 ? (
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

          <FeedbackSubmitButton onClick={handleSubmitChips} label="Next" />
        </>
      ) : (
        <>
          <p
            className="text-[13px] text-[#64748B]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Would this plan work for your whole family?
          </p>

          <div className="space-y-2">
            {FAMILY_OPTIONS.map((opt) => (
              <FeedbackOption
                key={opt}
                label={opt}
                selected={familyFit === opt}
                onClick={() => setFamilyFit(opt)}
              />
            ))}
          </div>

          <FeedbackSubmitButton
            onClick={handleSubmitFamily}
            disabled={!familyFit}
            loading={submitting}
          />
        </>
      )}
    </FeedbackSheet>
  );
}
