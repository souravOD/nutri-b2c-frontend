"use client";

import { useState } from "react";
import {
    ArrowLeft,
    CheckCircle,
    ChefHat,
    Lightbulb,
    AlertTriangle,
    Plus,
} from "lucide-react";
import { useAnalyzer } from "./analyzer-context";
import { AllergenAlert } from "@/components/scan/allergen-alert";
import { DietBadges } from "@/components/scan/diet-badges";
import { HealthCheckTable } from "@/components/scan/health-check-table";
import { MealTypeSheet } from "@/components/scan/meal-type-sheet";
import { apiAddMealItem } from "@/lib/api";
import type { AddMealItemPayload } from "@/lib/types";

/**
 * Shared result view used by both mobile result page and desktop inline view.
 * Reads analysis result from AnalyzerContext.
 *
 * Props:
 * - variant: "mobile" uses card-style layout (rounded-[24px] cards)
 *            "desktop" uses the current flat layout (rounded-[48px] sections)
 * - onBack: called when user clicks "Analyze another recipe"
 */
export function AnalyzerResult({
    variant = "desktop",
    onBack,
}: {
    variant?: "mobile" | "desktop";
    onBack?: () => void;
}) {
    const { result, saveSuccess, error, handleSave, handleClear } = useAnalyzer();

    const [showMealSheet, setShowMealSheet] = useState(false);
    const [isAddingMeal, setIsAddingMeal] = useState(false);
    const [mealSuccess, setMealSuccess] = useState<string | null>(null);

    if (!result) return null;

    const nutrition = result.nutritionPerServing;
    const allergenWarnings = result.allergenWarnings ?? [];
    const healthWarnings = result.healthWarnings ?? [];
    const dietTags = result.inferred?.diets ?? [];

    const handleAddToMeal = async (
        mealType: "breakfast" | "lunch" | "dinner" | "snack"
    ) => {
        setIsAddingMeal(true);
        setMealSuccess(null);
        try {
            const payload: AddMealItemPayload = {
                date: new Date().toISOString().slice(0, 10),
                mealType,
                customName: result.title ?? "Analyzed Recipe",
                servings: result.servings ?? 1,
                source: "recipe",
                nutrition: {
                    calories: nutrition?.calories,
                    proteinG: nutrition?.protein_g ?? nutrition?.protein,
                    carbsG: nutrition?.carbs_g ?? nutrition?.carbs,
                    fatG: nutrition?.fat_g ?? nutrition?.fat,
                    fiberG: nutrition?.fiber_g ?? nutrition?.fiber,
                    sugarG: nutrition?.sugar_g ?? nutrition?.sugar,
                    sodiumMg: nutrition?.sodium_mg ?? nutrition?.sodium,
                },
            };
            await apiAddMealItem(payload);
            setShowMealSheet(false);
            setMealSuccess(
                `Added "${result.title ?? "Recipe"}" to ${mealType}!`
            );
        } catch (err) {
            console.error("[AnalyzerResult] Add to meal failed:", err);
        } finally {
            setIsAddingMeal(false);
        }
    };

    // ── Mobile variant ─────────────────────────────────────────────────────
    if (variant === "mobile") {
        return (
            <div className="flex flex-col gap-4 pb-[100px]">
                {/* Recipe Hero Card */}
                <section
                    className="bg-white rounded-[24px] border border-[#F1F5F9] overflow-hidden"
                    style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
                >
                    <div className="h-24 bg-gradient-to-br from-[#99CC33]/20 to-[#538100]/10 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                    </div>
                    <div className="px-5 py-4">
                        <h2
                            className="text-[18px] font-bold text-[#0F172A] leading-6"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {result.title ?? "Analyzed Recipe"}
                        </h2>
                        {result.summary && (
                            <p
                                className="text-[14px] text-[#64748B] mt-1 leading-5"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {result.summary}
                            </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {result.servings && (
                                <span className="text-[12px] text-[#94A3B8]">
                                    Serves {result.servings}
                                </span>
                            )}
                            {result.inferred?.cuisines?.map((c) => (
                                <span
                                    key={c}
                                    className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F1F5F9] text-[#64748B]"
                                >
                                    🌍 {c}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Nutrition Summary (per serving) */}
                {nutrition && (() => {
                    const proteinVal = nutrition.protein_g ?? nutrition.protein ?? 0;
                    const carbsVal = nutrition.carbs_g ?? nutrition.carbs ?? 0;
                    const fatVal = nutrition.fat_g ?? nutrition.fat ?? 0;
                    const maxMacro = Math.max(proteinVal, carbsVal, fatVal, 1); // for proportional bars

                    return (
                        <section
                            className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
                            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3
                                    className="text-[14px] font-bold text-[#0F172A]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    Nutrition Summary
                                </h3>
                                <span className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">
                                    per serving
                                </span>
                            </div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[13px] font-medium text-[#64748B]">
                                    Calories
                                </span>
                                <span className="text-[20px] font-bold text-[#0F172A]">
                                    {Math.round(nutrition.calories ?? 0)}{" "}
                                    <span className="text-[14px] font-normal text-[#94A3B8]">
                                        kcal
                                    </span>
                                </span>
                            </div>

                            {/* Macro bars — proportional to each other, per serving */}
                            <div className="flex flex-col gap-3">
                                {[
                                    { label: "Protein", value: proteinVal, color: "#99CC33" },
                                    { label: "Carbs", value: carbsVal, color: "#60A5FA" },
                                    { label: "Fats", value: fatVal, color: "#FB923C" },
                                ].map((macro) => (
                                    <div key={macro.label} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[14px] font-medium text-[#0F172A]"
                                                style={{ fontFamily: "Inter, sans-serif" }}>
                                                {macro.label}
                                            </span>
                                            <span className="text-[14px] font-bold text-[#0F172A]"
                                                style={{ fontFamily: "Inter, sans-serif" }}>
                                                {Math.round(macro.value)}g
                                            </span>
                                        </div>
                                        <div className="w-full h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500 ease-out"
                                                style={{
                                                    width: `${Math.min(100, (macro.value / maxMacro) * 100)}%`,
                                                    backgroundColor: macro.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Micro-nutrients */}
                            {(() => {
                                const micros = [
                                    { label: "Fiber", value: nutrition.fiber_g ?? nutrition.fiber, unit: "g" },
                                    { label: "Sugar", value: nutrition.sugar_g ?? nutrition.sugar, unit: "g" },
                                    { label: "Sodium", value: nutrition.sodium_mg ?? nutrition.sodium, unit: "mg" },
                                    { label: "Potassium", value: nutrition.potassium, unit: "mg" },
                                    { label: "Iron", value: nutrition.iron, unit: "mg" },
                                    { label: "Calcium", value: nutrition.calcium, unit: "mg" },
                                    { label: "Vitamin D", value: nutrition.vitaminD, unit: "µg" },
                                ].filter((m) => m.value != null && m.value !== 0);
                                if (micros.length === 0) return null;
                                return (
                                    <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
                                        <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[1px] mb-2">
                                            Micro-nutrients
                                        </h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {micros.map((m) => (
                                                <div
                                                    key={m.label}
                                                    className="flex flex-col items-center p-2 rounded-xl bg-[#F8FAFC]"
                                                >
                                                    <span className="text-[11px] font-medium text-[#64748B]">
                                                        {m.label}
                                                    </span>
                                                    <span className="text-[13px] font-bold text-[#1E293B]">
                                                        {typeof m.value === "number"
                                                            ? m.value < 10
                                                                ? m.value.toFixed(1)
                                                                : Math.round(m.value)
                                                            : m.value}
                                                        {m.unit}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </section>
                    );
                })()}

                {/* Raw Allergens */}
                {result.inferred?.allergens && result.inferred.allergens.length > 0 && (
                    <div className="px-1">
                        <h3 className="text-[13px] font-bold text-[#64748B] uppercase tracking-[1px] mb-2">
                            Contains
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {result.inferred.allergens.map((a) => (
                                <span
                                    key={a}
                                    className="px-3 py-1.5 rounded-full text-[13px] font-semibold"
                                    style={{
                                        background: "rgba(239,68,68,0.08)",
                                        border: "1px solid rgba(239,68,68,0.25)",
                                        color: "#DC2626",
                                    }}
                                >
                                    ⚠️ {a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Family Allergen Alert */}
                {allergenWarnings.length > 0 && (
                    <AllergenAlert warnings={allergenWarnings} />
                )}

                {/* Diet Compatibility */}
                {dietTags.length > 0 && <DietBadges tags={dietTags} />}

                {/* Health Condition Check */}
                {healthWarnings.length > 0 && (
                    <HealthCheckTable warnings={healthWarnings} />
                )}

                {/* Ingredients */}
                {result.ingredients && result.ingredients.length > 0 && (
                    <section
                        className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
                        style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
                    >
                        <h3 className="text-[14px] font-bold text-[#0F172A] mb-2">
                            Ingredients
                        </h3>
                        <ul className="flex flex-col gap-1.5">
                            {result.ingredients.map((ing, i) => (
                                <li
                                    key={i}
                                    className="text-[13px] text-[#64748B] leading-5 flex items-start gap-2"
                                >
                                    <span className="text-[#99CC33] mt-1">•</span>
                                    <span>
                                        {ing.qty != null && (
                                            <span className="font-medium text-[#0F172A]">
                                                {ing.qty} {ing.unit ?? ""}{" "}
                                            </span>
                                        )}
                                        {ing.item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Cooking Steps */}
                {result.steps && result.steps.length > 0 && (
                    <section
                        className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
                        style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
                    >
                        <h3 className="text-[14px] font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                            <ChefHat className="w-4 h-4" /> Steps ({result.steps.length})
                        </h3>
                        <ol className="flex flex-col gap-3">
                            {result.steps.map((step, idx) => (
                                <li key={idx} className="flex gap-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#99CC33] text-white text-[12px] font-bold shrink-0 mt-0.5">
                                        {idx + 1}
                                    </span>
                                    <span className="text-[13px] text-[#334155] leading-5">
                                        {step}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {/* AI Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                    <section
                        className="rounded-[24px] p-5"
                        style={{
                            background: "#FFFBEB",
                            border: "1px solid rgba(217,119,6,0.15)",
                        }}
                    >
                        <h3 className="text-[14px] font-bold text-[#92400E] mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" /> AI Suggestions
                        </h3>
                        <ul className="flex flex-col gap-2">
                            {result.suggestions.map((s, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <span className="text-[13px] mt-0.5">💡</span>
                                    <span className="text-[13px] text-[#78350F] leading-5">
                                        {s}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Save + Success feedback */}
                {saveSuccess && (
                    <div
                        className="flex items-center gap-3 p-4 rounded-2xl"
                        style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                    >
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-[14px] font-medium text-green-800">
                            Recipe saved to your collection!
                        </p>
                    </div>
                )}
                {mealSuccess && (
                    <div
                        className="flex items-center gap-3 p-4 rounded-2xl"
                        style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                    >
                        <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        <p className="text-[14px] font-medium text-green-800">
                            {mealSuccess}
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div
                        className="flex items-center gap-3 p-4 rounded-2xl"
                        style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                    >
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                        <p className="text-[14px] font-medium text-red-800">{error}</p>
                    </div>
                )}

                {/* Save button (mobile — appears above the fixed Add to Meal CTA) */}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveSuccess}
                    className="w-full h-[48px] rounded-2xl text-[15px] font-bold transition-colors disabled:opacity-60"
                    style={{
                        background: saveSuccess ? "#86EFAC" : "#99CC33",
                        color: "#161910",
                    }}
                >
                    {saveSuccess ? "✅ Saved!" : "💾 Save to My Recipes"}
                </button>

                {/* Fixed bottom: Add to Meal CTA (mobile only) */}
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-[#F1F5F9] px-6 py-4 lg:hidden">
                    <button
                        type="button"
                        onClick={() => setShowMealSheet(true)}
                        className="w-full h-[52px] bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl text-[16px] font-semibold flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Add to Meal
                    </button>
                </div>

                {/* Meal Type Sheet */}
                <MealTypeSheet
                    isOpen={showMealSheet}
                    onClose={() => setShowMealSheet(false)}
                    onSelect={handleAddToMeal}
                    isLoading={isAddingMeal}
                />
            </div>
        );
    }

    // ── Desktop variant ────────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 py-4">
            {/* Back / Clear button */}
            <button
                type="button"
                onClick={onBack ?? handleClear}
                className="self-start flex items-center gap-2 text-[14px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Analyze another recipe
            </button>

            {/* Recipe hero */}
            <div className="relative rounded-[48px] overflow-hidden bg-[#1E293B] min-h-[180px]">
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)",
                    }}
                />
                <div className="relative z-10 flex flex-col justify-end p-5 min-h-[180px]">
                    <h2 className="text-[30px] font-bold text-white leading-9">
                        {result.title || "Recipe Analysis"}
                    </h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {result.servings && (
                            <span
                                className="px-3 py-1 rounded-full text-[12px] font-medium text-white"
                                style={{
                                    background: "rgba(255,255,255,0.2)",
                                    backdropFilter: "blur(6px)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                }}
                            >
                                🍽 {result.servings} servings
                            </span>
                        )}
                        {result.inferred?.cuisines?.map((c) => (
                            <span
                                key={c}
                                className="px-3 py-1 rounded-full text-[12px] font-medium text-white"
                                style={{
                                    background: "rgba(255,255,255,0.2)",
                                    backdropFilter: "blur(6px)",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                }}
                            >
                                🌍 {c}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary */}
            {result.summary && (
                <p className="text-[15px] text-[#475569] leading-6 italic px-1">
                    {result.summary}
                </p>
            )}

            {/* Nutrition Summary */}
            {nutrition && (
                <div className="px-4">
                    <h3 className="text-[18px] font-bold text-[#1E293B] mb-4">
                        Nutrition Summary
                    </h3>
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[14px] font-medium text-[#475569]">
                                Calories
                            </span>
                            <span className="text-[14px] font-bold text-[#0F172A]">
                                {Math.round(nutrition.calories || 0)} kcal
                            </span>
                        </div>
                        <div className="w-full h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.min(
                                        100,
                                        ((nutrition.calories || 0) / 800) * 100
                                    )}%`,
                                    background: "#99CC33",
                                }}
                            />
                        </div>
                    </div>

                    {/* Macro breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            {
                                label: "Protein",
                                value: nutrition.protein_g ?? nutrition.protein,
                                color: "#99CC33",
                            },
                            {
                                label: "Carbs",
                                value: nutrition.carbs_g ?? nutrition.carbs,
                                color: "#60A5FA",
                            },
                            {
                                label: "Fats",
                                value: nutrition.fat_g ?? nutrition.fat,
                                color: "#FB923C",
                            },
                        ].map((macro) => (
                            <div key={macro.label} className="flex flex-col gap-1">
                                <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-[-0.6px]">
                                    {macro.label}
                                </span>
                                <span className="text-[14px] font-bold text-[#1E293B]">
                                    {Math.round(macro.value || 0)}g
                                </span>
                                <div className="w-full h-1 bg-[#F3F4F6] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${Math.min(
                                                100,
                                                ((macro.value || 0) / 80) * 100
                                            )}%`,
                                            background: macro.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Micro-nutrients */}
                    {(() => {
                        const micros = [
                            { label: "Fiber", value: nutrition.fiber_g ?? nutrition.fiber, unit: "g" },
                            { label: "Sugar", value: nutrition.sugar_g ?? nutrition.sugar, unit: "g" },
                            { label: "Sodium", value: nutrition.sodium_mg ?? nutrition.sodium, unit: "mg" },
                            { label: "Potassium", value: nutrition.potassium, unit: "mg" },
                            { label: "Iron", value: nutrition.iron, unit: "mg" },
                            { label: "Calcium", value: nutrition.calcium, unit: "mg" },
                            { label: "Vitamin D", value: nutrition.vitaminD, unit: "µg" },
                            { label: "Sat. Fat", value: nutrition.saturated_fat_g ?? nutrition.saturatedFat, unit: "g" },
                        ].filter((m) => m.value != null && m.value !== 0);
                        if (micros.length === 0) return null;
                        return (
                            <div className="mt-5 pt-4 border-t border-[#F1F5F9]">
                                <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[1px] mb-3">
                                    Micro-nutrients
                                </h4>
                                <div className="grid grid-cols-4 gap-3">
                                    {micros.map((m) => (
                                        <div
                                            key={m.label}
                                            className="flex flex-col items-center p-2 rounded-xl bg-[#F8FAFC]"
                                        >
                                            <span className="text-[11px] font-medium text-[#64748B]">
                                                {m.label}
                                            </span>
                                            <span className="text-[14px] font-bold text-[#1E293B]">
                                                {typeof m.value === "number"
                                                    ? m.value < 10
                                                        ? m.value.toFixed(1)
                                                        : Math.round(m.value)
                                                    : m.value}
                                                {m.unit}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Raw Allergen Badges */}
            {result.inferred?.allergens &&
                result.inferred.allergens.length > 0 && (
                    <div className="px-4">
                        <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.4px] mb-3 px-1">
                            Contains
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {result.inferred.allergens.map((a) => (
                                <span
                                    key={a}
                                    className="flex items-center gap-1.5 px-[17px] py-[8.5px] rounded-full text-[14px] font-semibold"
                                    style={{
                                        background: "rgba(239,68,68,0.08)",
                                        border: "1px solid rgba(239,68,68,0.25)",
                                        color: "#DC2626",
                                    }}
                                >
                                    ⚠️ {a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

            {/* Family Allergen Warnings */}
            {allergenWarnings.length > 0 && (
                <div
                    className="flex gap-4 items-start p-[17px] rounded-[48px]"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                >
                    <div className="w-10 h-10 rounded-full bg-[#EF4444] flex items-center justify-center shrink-0">
                        <svg width="22" height="19" viewBox="0 0 22 19" fill="none">
                            <path
                                d="M11 1L1 18h20L11 1z"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M11 7v4M11 14h.01"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-bold text-[#7F1D1D] mb-1">
                            Family Allergen Alert
                        </h4>
                        {allergenWarnings.map((w, idx) => (
                            <p key={idx} className="text-[14px] text-[#B91C1C] leading-5">
                                {w.message}
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {/* Diet Compatibility */}
            {dietTags.length > 0 && (
                <div className="px-4">
                    <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.4px] mb-3 px-1">
                        Diet Compatibility
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {dietTags.map((diet) => (
                            <span
                                key={diet}
                                className="flex items-center gap-1.5 px-[17px] py-[8.5px] rounded-full text-[14px] font-semibold"
                                style={{
                                    background: "rgba(153,204,51,0.1)",
                                    border: "1px solid rgba(153,204,51,0.3)",
                                    color: "#99CC33",
                                }}
                            >
                                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                    <circle cx="7.5" cy="7.5" r="7" fill="#99CC33" />
                                    <path
                                        d="M4.5 7.5L6.5 9.5L10.5 5.5"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {diet}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Health Condition Check */}
            {healthWarnings.length > 0 && (
                <div
                    className="flex flex-col gap-4 p-5 rounded-[48px]"
                    style={{
                        background: "white",
                        border: "1px solid rgba(153,204,51,0.1)",
                    }}
                >
                    <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.4px]">
                        Health Condition Check
                    </h3>
                    <div className="flex flex-col divide-y divide-[#F1F5F9]">
                        {healthWarnings.map((hw, idx) => {
                            const isSafe =
                                hw.message.toLowerCase().includes("safe") || hw.value < 50;
                            const isModerate = hw.message
                                .toLowerCase()
                                .includes("moderate");
                            const tagLabel = isSafe
                                ? "SAFE"
                                : isModerate
                                    ? "MODERATE"
                                    : "CAUTION";
                            const tagBg = isSafe
                                ? "rgba(153,204,51,0.1)"
                                : isModerate
                                    ? "#FFFBEB"
                                    : "#FEF2F2";
                            const tagColor = isSafe
                                ? "#99CC33"
                                : isModerate
                                    ? "#D97706"
                                    : "#EF4444";
                            return (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between py-2"
                                >
                                    <span className="text-[14px] font-medium text-[#0F172A]">
                                        {hw.conditionName || hw.nutrient}
                                    </span>
                                    <span
                                        className="px-2 py-1 rounded-2xl text-[12px] font-bold"
                                        style={{ background: tagBg, color: tagColor }}
                                    >
                                        {tagLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Ingredients list */}
            {result.ingredients && result.ingredients.length > 0 && (
                <div
                    className="flex flex-col gap-3 p-5 rounded-[48px]"
                    style={{
                        background: "white",
                        border: "1px solid rgba(153,204,51,0.1)",
                    }}
                >
                    <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.4px]">
                        Ingredients ({result.ingredients.length})
                    </h3>
                    <div className="flex flex-col divide-y divide-[#F1F5F9]">
                        {result.ingredients.map((ing, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-2.5">
                                <div className="w-2 h-2 rounded-full bg-[#99CC33] shrink-0" />
                                <span className="text-[14px] text-[#0F172A]">
                                    {ing.qty && `${ing.qty} `}
                                    {ing.unit && `${ing.unit} `}
                                    {ing.item}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cooking Steps */}
            {result.steps && result.steps.length > 0 && (
                <div
                    className="flex flex-col gap-3 p-5 rounded-[48px]"
                    style={{
                        background: "white",
                        border: "1px solid rgba(153,204,51,0.1)",
                    }}
                >
                    <h3 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.4px] flex items-center gap-2">
                        <ChefHat className="w-4 h-4" /> Steps ({result.steps.length})
                    </h3>
                    <ol className="flex flex-col gap-3 pl-1">
                        {result.steps.map((step, idx) => (
                            <li key={idx} className="flex gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#99CC33] text-white text-[12px] font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                </span>
                                <span className="text-[14px] text-[#334155] leading-6">
                                    {step}
                                </span>
                            </li>
                        ))}
                    </ol>
                </div>
            )}

            {/* AI Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
                <div
                    className="flex flex-col gap-3 p-5 rounded-[48px]"
                    style={{
                        background: "#FFFBEB",
                        border: "1px solid rgba(217,119,6,0.15)",
                    }}
                >
                    <h3 className="text-[14px] font-bold text-[#92400E] uppercase tracking-[1.4px] flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" /> AI Suggestions
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {result.suggestions.map((s, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                                <span className="text-[14px] mt-0.5">💡</span>
                                <span className="text-[14px] text-[#78350F] leading-5">
                                    {s}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Save button + feedback */}
            {saveSuccess && (
                <div
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-[14px] font-medium text-green-800">
                        Recipe saved to your collection!
                    </p>
                </div>
            )}
            {mealSuccess && (
                <div
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}
                >
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-[14px] font-medium text-green-800">
                        {mealSuccess}
                    </p>
                </div>
            )}
            {error && (
                <div
                    className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                >
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <p className="text-[14px] font-medium text-red-800">{error}</p>
                </div>
            )}
            <div className="flex gap-3 pt-2 pb-8">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saveSuccess}
                    className="flex-1 h-[52px] rounded-full text-[15px] font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                        background: saveSuccess ? "#86EFAC" : "#99CC33",
                        color: "#161910",
                        boxShadow: "0px 4px 6px -4px rgba(0,0,0,0.1)",
                    }}
                >
                    {saveSuccess ? "✅ Saved!" : "💾 Save to My Recipes"}
                </button>
            </div>
        </div>
    );
}
