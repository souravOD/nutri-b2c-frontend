"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitNps, dismissNps } from "@/lib/nps-api";

interface NpsSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SCORE_COLORS: Record<string, string> = {
  detractor: "bg-red-500 hover:bg-red-600 text-white",
  passive: "bg-yellow-500 hover:bg-yellow-600 text-white",
  promoter: "bg-green-500 hover:bg-green-600 text-white",
  selected: "ring-2 ring-offset-2 ring-primary scale-110",
  unselected: "bg-muted hover:bg-muted-foreground/20 text-muted-foreground",
};

function scoreCategory(n: number): "detractor" | "passive" | "promoter" {
  if (n <= 6) return "detractor";
  if (n <= 8) return "passive";
  return "promoter";
}

export function NpsSurveyModal({ open, onOpenChange }: NpsSurveyModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (score === null) return;
    setIsSubmitting(true);
    try {
      await submitNps(score, feedback || undefined);
      setSubmitted(true);
      setTimeout(() => onOpenChange(false), 1500);
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

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="text-4xl">🎉</div>
            <DialogTitle>Thank you!</DialogTitle>
            <DialogDescription>
              Your feedback helps us make Nutri better for everyone.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>How likely are you to recommend Nutri?</DialogTitle>
          <DialogDescription>
            On a scale of 0 to 10, how likely are you to recommend Nutri to a
            friend or colleague?
          </DialogDescription>
        </DialogHeader>

        {/* Score buttons */}
        <div className="flex flex-col gap-2 py-4">
          <div className="flex justify-between gap-1">
            {Array.from({ length: 11 }, (_, i) => {
              const isSelected = score === i;
              const category = scoreCategory(i);
              return (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium
                    transition-all duration-150
                    ${isSelected ? SCORE_COLORS[category] + " " + SCORE_COLORS.selected : SCORE_COLORS.unselected}
                  `}
                  aria-label={`Score ${i}`}
                >
                  {i}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>
        </div>

        {/* Feedback textarea — show after score selection */}
        {score !== null && (
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nps-feedback">
              {score <= 6
                ? "We're sorry to hear that. What could we improve?"
                : score <= 8
                  ? "Thanks! What would make it a 10?"
                  : "Awesome! What do you love most?"}
            </label>
            <Textarea
              id="nps-feedback"
              placeholder="Your feedback (optional)..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleDismiss} disabled={isSubmitting}>
            Not now
          </Button>
          <Button onClick={handleSubmit} disabled={score === null || isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
