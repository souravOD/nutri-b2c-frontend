"use client";

import { useState } from "react";
import {
  FeedbackSheet,
  FeedbackOption,
  FeedbackChip,
  FeedbackSubmitButton,
} from "./feedback-sheet";

interface SearchFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    questionKey: string;
    responseValue?: string;
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
  "Better filters",
  "More results",
  "Dietary labels",
  "Prep time sort",
  "Other",
];

/**
 * Flow 5: Search Results
 *
 * Q1: "How relevant were the results?"
 * Q2 (on negative): "What would help?" (chips)
 */
export function SearchFeedbackSheet({
  open,
  onOpenChange,
  onSubmit,
  onDismiss,
}: SearchFeedbackSheetProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [relevance, setRelevance] = useState<string | null>(null);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
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
      questionKey: "search_relevance",
      responseValue: relevance,
    });
    setSubmitting(false);
  };

  const handleSubmitQ2 = async () => {
    setSubmitting(true);
    await onSubmit({
      questionKey: "search_relevance",
      responseValue: relevance!,
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
        step === 1 ? "How were the results?" : "What would help?"
      }
    >
      {step === 1 ? (
        <>
          <p
            className="text-[13px] text-[#64748B]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            How relevant were the search results?
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

          <FeedbackSubmitButton
            onClick={handleSubmitQ2}
            loading={submitting}
          />
        </>
      )}
    </FeedbackSheet>
  );
}
