"use client";

import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface FeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable bottom-sheet wrapper for feedback prompts.
 *
 * - Mobile: Full-width bottom sheet, slides up
 * - Tablet/Desktop: Centered dialog-style card (max 480px, vertically centered)
 * - Uses B2C Nutri design tokens for full theme consistency
 */
export function FeedbackSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: FeedbackSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          // ─── Force white background + dark text (no theme variable issues) ───
          "!bg-white !text-[#0F172A]",
          // Mobile: full-width, auto-height, rounded top corners
          "rounded-t-[20px] px-5 pb-6 pt-4",
          // ─── Desktop: centered card instead of full-width bottom bar ───
          // Remove the default inset-x-0 positioning and use centering
          "sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2",
          "sm:-translate-x-1/2 sm:-translate-y-1/2",
          "sm:max-w-[480px] sm:w-[90vw] sm:rounded-[20px]",
          className
        )}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {/* Drag handle indicator — mobile only */}
        <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mx-auto mb-3 sm:hidden" />

        <SheetHeader className="p-0">
          <SheetTitle
            className="text-[16px] sm:text-[18px] font-bold !text-[#0F172A] text-left"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-3 space-y-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────

interface FeedbackOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * Single-select option button (e.g., "Very accurately", "Mostly right").
 * Uses Nutri design tokens for consistency.
 */
export function FeedbackOption({ label, selected, onClick }: FeedbackOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full h-10 px-4 rounded-xl text-[13px] font-medium transition-all",
        "border text-left",
        selected
          ? "border-[#99CC33] bg-[#ECFCCB] text-[#538100]"
          : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#99CC33]/50"
      )}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {label}
    </button>
  );
}

interface FeedbackChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * Multi-select chip pill (e.g., "Quick add favorites", "Voice input").
 */
export function FeedbackChip({ label, selected, onClick }: FeedbackChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-[12px] sm:text-[13px] font-medium transition-all",
        "border",
        selected
          ? "border-[#99CC33] bg-[#ECFCCB] text-[#538100]"
          : "border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#99CC33]/50"
      )}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {label}
    </button>
  );
}

interface FeedbackSubmitButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  label?: string;
}

/**
 * Full-width submit button at the bottom of a feedback sheet.
 * Matches Nutri green CTA styling.
 */
export function FeedbackSubmitButton({
  onClick,
  disabled = false,
  loading = false,
  label = "Submit Feedback",
}: FeedbackSubmitButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "w-full h-11 rounded-xl text-[14px] font-semibold transition-colors",
        "bg-[#99CC33] text-white hover:bg-[#88BB22]",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {loading ? "Submitting..." : label}
    </button>
  );
}
