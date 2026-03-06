"use client"

import { useState, useEffect } from "react"
import { X, Utensils, Plus, Users, Check } from "lucide-react"
import type { Recipe, MealType } from "@/lib/types"

interface LogMealModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipe: Recipe | null
    onConfirm: (recipeId: string, mealType: MealType, servings: number) => void
    loading?: boolean
    /** When set, pre-selects this meal slot and hides the slot picker. */
    defaultMealType?: MealType
}

const PORTION_OPTIONS = [
    { value: "1", number: "1", label: "SERVING" },
    { value: "2", number: "2", label: "SERVINGS" },
    { value: "3", number: "3", label: "SERVINGS" },
    { value: "custom", number: "+", label: "CUSTOM" },
]

const SLOT_OPTIONS: { value: MealType; label: string }[] = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
]

function formatTime(minutes: number | undefined | null): string {
    if (!minutes) return "—"
    if (minutes < 60) return `${minutes} min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function LogMealModal({
    open,
    onOpenChange,
    recipe,
    onConfirm,
    loading,
    defaultMealType,
}: LogMealModalProps) {
    const [portions, setPortions] = useState("1")
    const [slot, setSlot] = useState<MealType>(defaultMealType || "breakfast")
    const [customPortions, setCustomPortions] = useState("")

    // Sync slot when defaultMealType changes (e.g. user clicks Dinner "+" then Lunch "+")
    useEffect(() => {
        if (defaultMealType) setSlot(defaultMealType)
    }, [defaultMealType, open])

    if (!open || !recipe) return null

    const servings = portions === "custom"
        ? parseFloat(customPortions) || 1
        : parseInt(portions)

    const kcal = Math.round((recipe.nutrition?.calories ?? recipe.calories ?? 0) * servings)
    const timeDisplay = formatTime(recipe.prepTime || recipe.totalTimeMinutes)

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-[rgba(15,23,42,0.4)] backdrop-blur-[2px] animate-in fade-in-0"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal — centered and scrollable */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className="
            bg-white rounded-[32px] shadow-2xl overflow-hidden
            flex flex-col max-h-[90vh] w-full max-w-[448px]
            pointer-events-auto animate-in fade-in-0 zoom-in-95
          "
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {/* ── Hero Image with gradient ── */}
                    {recipe.imageUrl && (
                        <div className="relative h-[192px] w-full flex-shrink-0">
                            <img
                                src={recipe.imageUrl}
                                alt={recipe.title || "Meal"}
                                className="w-full h-full object-cover"
                            />
                            {/* Bottom gradient fade to white */}
                            <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent" />
                            {/* Close button */}
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-3 h-3 text-[#0F172A]" />
                            </button>
                        </div>
                    )}

                    {/* ── Scrollable content ── */}
                    <div className="overflow-y-auto flex-1 px-8 pb-8">
                        {/* Utensils icon + heading */}
                        <div className="flex flex-col items-center text-center pt-2 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[rgba(153,204,51,0.2)] flex items-center justify-center mb-3">
                                <Utensils className="w-5 h-5 text-[#99CC33]" />
                            </div>
                            <h2 className="text-[24px] font-bold text-[#0F172A] leading-8">
                                Log this meal?
                            </h2>
                        </div>

                        {/* ── Recipe Details Card ── */}
                        <div className="bg-[#F7F8F6] border border-[rgba(153,204,51,0.05)] rounded-[16px] p-[17px] mb-6">
                            <p className="text-[18px] font-semibold text-[#0F172A] leading-7">
                                {recipe.title}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1 text-[14px] text-[#475569] leading-5">
                                    ⏱ {timeDisplay}
                                </span>
                                <span className="flex items-center gap-1 text-[14px] text-[#475569] leading-5">
                                    🔥 {kcal} kcal
                                </span>
                            </div>
                        </div>

                        {/* ── Portion Size Selector ── */}
                        <div className="mb-6">
                            <p className="text-[14px] font-medium text-[#334155] leading-5 mb-3">
                                Portion Size
                            </p>
                            <div className="flex gap-2">
                                {PORTION_OPTIONS.map((opt) => {
                                    const selected = portions === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setPortions(opt.value)}
                                            className={`
                        flex flex-col items-center justify-center rounded-[16px] border-2 py-3.5 px-3 flex-1 transition-colors
                        ${selected
                                                    ? "border-[#99CC33] bg-[rgba(153,204,51,0.05)]"
                                                    : "border-[#E2E8F0] bg-white hover:border-[#CBD5E1]"
                                                }
                      `}
                                        >
                                            {opt.value === "custom" ? (
                                                <Plus className={`w-4 h-4 mb-0.5 ${selected ? "text-[#99CC33]" : "text-[#475569]"}`} />
                                            ) : (
                                                <span className={`text-[18px] font-bold leading-7 ${selected ? "text-[#99CC33]" : "text-[#475569]"}`}>
                                                    {opt.number}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-semibold uppercase leading-[15px] ${selected ? "text-[#99CC33]" : "text-[#475569]"}`}>
                                                {opt.label}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            {portions === "custom" && (
                                <input
                                    type="number"
                                    min="0.5"
                                    step="0.5"
                                    value={customPortions}
                                    onChange={(e) => setCustomPortions(e.target.value)}
                                    placeholder="Enter servings"
                                    className="mt-3 w-full px-4 py-2.5 rounded-[12px] border-2 border-[#E2E8F0] text-[14px] text-[#0F172A] bg-white focus:outline-none focus:border-[#99CC33] transition-colors"
                                />
                            )}
                        </div>

                        {/* ── Meal Slot Selector — 2×2 grid (hidden when defaultMealType is set) ── */}
                        {!defaultMealType && (
                            <div className="mb-6">
                                <p className="text-[14px] font-medium text-[#334155] leading-5 mb-3">
                                    Select Meal Slot
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {SLOT_OPTIONS.map((opt) => {
                                        const selected = slot === opt.value
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setSlot(opt.value)}
                                                className={`
                            py-3 rounded-full border-2 text-[14px] font-bold text-center transition-colors
                            ${selected
                                                        ? "border-[#99CC33] bg-[rgba(153,204,51,0.05)] text-[#99CC33]"
                                                        : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#CBD5E1]"
                                                    }
                           `}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── (Optional) Log for Family ── */}
                        <div className="border-t border-[#F1F5F9] pt-6 mb-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-9 h-7 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-[#99CC33]" />
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-[#1E293B] leading-6">
                                        (Optional) Log for Family
                                    </p>
                                    <p className="text-[12px] text-[#64748B] leading-4">
                                        Add this meal to family profiles
                                    </p>
                                </div>
                            </div>
                            {/* Family member chips — static demo */}
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="flex items-center gap-[7px] pl-[13px] pr-[14px] py-2.5 rounded-full border-2 border-[#99CC33] bg-[rgba(153,204,51,0.05)] text-[14px] font-medium text-[#334155]"
                                >
                                    <span className="w-[18px] h-[18px] rounded-full bg-[#99CC33] flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </span>
                                    Sarah
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 px-[14px] py-2.5 rounded-full border-2 border-[#E2E8F0] text-[14px] font-medium text-[#475569]"
                                >
                                    <span className="w-4 h-4 rounded-full border border-[#CBD5E1] bg-white" />
                                    Leo
                                </button>
                                <button
                                    type="button"
                                    className="p-2.5 rounded-full border-2 border-dashed border-[#CBD5E1] hover:border-[#99CC33] transition-colors"
                                >
                                    <Plus className="w-2 h-2 text-[#94A3B8]" />
                                </button>
                            </div>
                        </div>

                        {/* ── CTAs ── */}
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={() => onConfirm(recipe.id, slot, servings)}
                                disabled={loading}
                                className="w-full py-4 rounded-[48px] bg-[#99CC33] text-[#0F172A] text-[16px] font-bold text-center hover:bg-[#8ABB2A] transition-colors disabled:opacity-50 relative"
                                style={{
                                    boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                                }}
                            >
                                {loading ? "Logging..." : "Log Meal"}
                            </button>
                            <button
                                type="button"
                                onClick={() => onOpenChange(false)}
                                className="w-full py-3 text-[16px] font-medium text-[#64748B] text-center hover:text-[#0F172A] transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
