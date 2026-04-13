"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  FeedbackSheet,
  FeedbackOption,
  FeedbackChip,
  FeedbackSubmitButton,
} from "./feedback-sheet";

interface FeedFeedbackSheetProps {
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

const RELEVANCE_OPTIONS = [
  "Very relevant",
  "Mostly relevant",
  "Not what I wanted",
];

const IMPROVEMENT_CHIPS = [
  "More variety",
  "Match my diet goals",
  "Seasonal recipes",
  "Quicker meals",
  "Cultural preferences",
  "Other",
];

/**
 * Flow: Feed (Homepage Recommendation Feed)
 *
 * Q1: "How relevant were the recipe recommendations to your preferences?"
 * Q2 (follow-up for negative): "What would improve your recommendations?" (chips)
 */
export function FeedFeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  onDismiss,
}: FeedFeedbackSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [relevance, setRelevance] = useState<string | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleChip = (chip: string) => {
    setSelectedChips((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]
    );
  };

  const handleSubmitQ1 = async () => {
    if (!relevance) return;
    if (relevance === "Not what I wanted") {
      setStep(2);
      return;
    }
    setSubmitting(true);
    await onSubmit({
      questionKey: "feed_relevance",
      responseValue: relevance,
    });
    setSubmitting(false);
  };

  const handleSubmitQ2 = async () => {
    setSubmitting(true);
    await onSubmit({
      questionKey: "feed_relevance",
      responseValue: relevance!,
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
          ? "How were the recommendations?"
          : "What would improve them?"
      }
    >
      {step === 1 ? (
        <>
          <p
            className="text-[13px] text-[#64748B]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            How relevant were the recipe recommendations to your personal preferences?
          </p>

          <div className="space-y-2">
            {RELEVANCE_OPTIONS.map((opt) => (
              <FeedbackOption
                key={opt}
                label={opt}
                selected={relevance === opt}
                onClick={() => setRelevance(opt)}
              />
            ))}
          </div>

          <FeedbackSubmitButton
            onClick={handleSubmitQ1}
            disabled={!relevance}
            loading={submitting}
            label={relevance === "Not what I wanted" ? "Next" : "Submit"}
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
