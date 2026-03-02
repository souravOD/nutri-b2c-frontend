"use client";

import { useState } from "react";
import { UtensilsCrossed, Sun, Moon, Coffee, Minus, Plus, ArrowLeft, Loader2 } from "lucide-react";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface MealTypeSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (mealType: MealType, servings: number) => void;
    isLoading?: boolean;
    /** e.g. "1 can (330 ml)" or "per 100g" */
    servingSizeLabel?: string | null;
}

const MEAL_OPTIONS: { type: MealType; label: string; icon: typeof Sun; color: string }[] = [
    { type: "breakfast", label: "Breakfast", icon: Coffee, color: "#FB923C" },
    { type: "lunch", label: "Lunch", icon: Sun, color: "#FACC15" },
    { type: "dinner", label: "Dinner", icon: Moon, color: "#818CF8" },
    { type: "snack", label: "Snack", icon: UtensilsCrossed, color: "#34D399" },
];

const SERVING_PRESETS = [0.5, 1, 1.5, 2, 3];

/**
 * Two-step bottom sheet / centered modal:
 * Step 1 — Pick meal type
 * Step 2 — Adjust servings → Confirm
 */
export function MealTypeSheet({ isOpen, onClose, onSelect, isLoading, servingSizeLabel }: MealTypeSheetProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedMeal, setSelectedMeal] = useState<MealType | null>(null);
    const [servings, setServings] = useState(1);

    if (!isOpen) return null;

    const handleMealPick = (type: MealType) => {
        setSelectedMeal(type);
        setStep(2);
    };

    const handleConfirm = () => {
        if (selectedMeal) {
            onSelect(selectedMeal, servings);
        }
    };

    const handleClose = () => {
        // Reset state on close
        setStep(1);
        setSelectedMeal(null);
        setServings(1);
        onClose();
    };

    const handleBack = () => {
        setStep(1);
    };

    const adjustServings = (delta: number) => {
        setServings((prev) => {
            const next = Math.round((prev + delta) * 10) / 10;
            return Math.max(0.5, Math.min(10, next));
        });
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Sheet (mobile = bottom sheet, desktop = centered modal) */}
            <div
                className="fixed z-50 bg-white px-6 pt-5 pb-8 animate-in slide-in-from-bottom duration-200
                    bottom-0 left-0 right-0 rounded-t-[24px]
                    lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[24px] lg:max-w-[420px] lg:w-full lg:shadow-2xl"
                role="dialog"
                aria-label="Add to meal"
            >
                {/* Handle (mobile only) */}
                <div className="w-10 h-1 rounded-full bg-[#E2E8F0] mx-auto mb-4 lg:hidden" />

                {/* ── Step 1: Pick Meal Type ──────────────────────────────────── */}
                {step === 1 && (
                    <>
                        <h3
                            className="text-[16px] font-bold text-[#0F172A] mb-4"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Add to which meal?
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            {MEAL_OPTIONS.map(({ type, label, icon: Icon, color }) => (
                                <button
                                    key={type}
                                    type="button"
                                    disabled={isLoading}
                                    onClick={() => handleMealPick(type)}
                                    className="flex items-center gap-3 rounded-2xl border border-[#F1F5F9] bg-[#F8FAFC] p-4 text-left transition-colors hover:bg-[#F1F5F9] active:bg-[#E2E8F0] disabled:opacity-50"
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                                        style={{ backgroundColor: `${color}20` }}
                                    >
                                        <Icon className="w-5 h-5" style={{ color }} />
                                    </div>
                                    <span
                                        className="text-[14px] font-semibold text-[#0F172A]"
                                        style={{ fontFamily: "Inter, sans-serif" }}
                                    >
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="w-full mt-4 py-3 text-[14px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Cancel
                        </button>
                    </>
                )}

                {/* ── Step 2: Servings ────────────────────────────────────────── */}
                {step === 2 && selectedMeal && (
                    <>
                        {/* Back + Title */}
                        <div className="flex items-center gap-3 mb-5">
                            <button
                                type="button"
                                onClick={handleBack}
                                className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
                                aria-label="Back to meal selection"
                            >
                                <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
                            </button>
                            <div>
                                <h3
                                    className="text-[16px] font-bold text-[#0F172A]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    How many servings?
                                </h3>
                                <p
                                    className="text-[12px] text-[#94A3B8] mt-0.5 capitalize"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    Adding to {selectedMeal}
                                    {servingSizeLabel ? ` · ${servingSizeLabel}` : " · per 100g"}
                                </p>
                            </div>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center justify-center gap-5 mb-5">
                            <button
                                type="button"
                                onClick={() => adjustServings(-0.5)}
                                disabled={servings <= 0.5}
                                className="w-11 h-11 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F7F8F6] active:bg-[#F1F5F9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Decrease servings"
                            >
                                <Minus className="w-5 h-5 text-[#0F172A]" />
                            </button>

                            <div className="text-center min-w-[80px]">
                                <span
                                    className="text-[32px] font-bold text-[#0F172A] leading-none"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {servings}
                                </span>
                                <p
                                    className="text-[12px] text-[#94A3B8] mt-1"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {servings === 1 ? "serving" : "servings"}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => adjustServings(0.5)}
                                disabled={servings >= 10}
                                className="w-11 h-11 rounded-full border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F7F8F6] active:bg-[#F1F5F9] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Increase servings"
                            >
                                <Plus className="w-5 h-5 text-[#0F172A]" />
                            </button>
                        </div>

                        {/* Quick presets */}
                        <div className="flex items-center justify-center gap-2 mb-5">
                            {SERVING_PRESETS.map((val) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setServings(val)}
                                    className={`h-[34px] px-3.5 rounded-full text-[13px] font-medium transition-colors ${servings === val
                                            ? "bg-[#538100] text-white"
                                            : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                                        }`}
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {val}
                                </button>
                            ))}
                        </div>

                        {/* Confirm button */}
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="w-full h-[48px] bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl text-[15px] font-semibold flex items-center justify-center gap-2 transition-colors active:scale-[0.98] disabled:opacity-60"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Logging...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Log {servings} {servings === 1 ? "Serving" : "Servings"} to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="w-full mt-3 py-2.5 text-[14px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        </>
    );
}
