"use client";

import { Plus, Sparkles, RefreshCw, GripVertical, Search, Trash2 } from "lucide-react";
import type { MealPlanItem } from "@/lib/types";

interface WeeklyDayCardProps {
    date: Date;
    isToday: boolean;
    meals: MealPlanItem[];
    onAddMeal?: (date: string, mealType: string) => void;
    onViewRecipe?: (recipeId: string, itemId: string) => void;
    onSwapMeal?: (itemId: string) => void;
    onSearchSubstitute?: (itemId: string, date: string, mealType: string) => void;
    onDeleteMeal?: (itemId: string) => void;
    swappingItemId?: string | null;
    deletingItemId?: string | null;
    /** "weekly" shows full per-slot CTAs; "monthly" shows inline "Not planned yet" pill */
    variant?: "weekly" | "monthly";
    /** drag-and-drop handlers */
    onDragStart?: (itemId: string, fromDate: string, fromType: string) => void;
    onDropSlot?: (toDate: string, toType: string) => void;
    draggingItemId?: string | null;
}

const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"] as const;

function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
}

function formatDayName(d: Date) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
}

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10);
}

export function WeeklyDayCard({
    date,
    isToday,
    meals,
    onAddMeal,
    onViewRecipe,
    onSwapMeal,
    onSearchSubstitute,
    onDeleteMeal,
    swappingItemId,
    deletingItemId,
    variant = "weekly",
    onDragStart,
    onDropSlot,
    draggingItemId,
}: WeeklyDayCardProps) {
    const mealsByType = new Map<string, MealPlanItem[]>();
    for (const m of meals) {
        const t = m.mealType || "dinner";
        if (!mealsByType.has(t)) mealsByType.set(t, []);
        mealsByType.get(t)!.push(m);
    }

    const totalKcal = meals.reduce((s, m) => s + (m.caloriesPerServing ?? 0) * (m.servings || 1), 0);

    // Fix 5: Check if entire day is empty (no meals for any slot)
    const isEntireDayEmpty = meals.length === 0;

    return (
        <div className="flex flex-col gap-3">
            {/* Day Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {formatDate(date)}
                </h3>
                {isToday && (
                    <span className="px-3 py-1 text-sm font-medium text-[#538100] bg-[rgba(153,204,51,0.1)] rounded-full">
                        Today
                    </span>
                )}
            </div>

            {/* Meal Slots */}
            <div className="flex flex-col gap-3">
                {/* Fix 5: "Auto-generate {Day}" CTA when entire day is empty (weekly variant only) */}
                {isEntireDayEmpty && variant === "weekly" ? (
                    <button
                        onClick={() => onAddMeal?.(toDateStr(date), "breakfast")}
                        className="flex items-center justify-center gap-2 h-24 bg-white border border-[rgba(153,204,51,0.05)] rounded-[48px] shadow-sm hover:shadow-md transition-shadow"
                    >
                        <span
                            className="text-base font-bold text-[#6B8F24]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Auto-generate {formatDayName(date)}
                        </span>
                        <div className="w-[37px] h-[37px] flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-[#538100]" />
                        </div>
                    </button>
                ) : (
                    MEAL_ORDER.map((type) => {
                        const items = mealsByType.get(type);
                        if (items && items.length > 0) {
                            return items.map((item) => {
                                const isSwapping = swappingItemId === item.id;
                                const isDeleting = deletingItemId === item.id;
                                return (
                                <div
                                    key={item.id}
                                    draggable={variant === "weekly" && !!onDragStart}
                                    onDragStart={(e) => {
                                        e.dataTransfer.effectAllowed = "move";
                                        onDragStart?.(item.id, toDateStr(date), type);
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        if (draggingItemId && draggingItemId !== item.id) {
                                            e.currentTarget.classList.add("ring-2", "ring-[#99CC33]");
                                        }
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.classList.remove("ring-2", "ring-[#99CC33]");
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.classList.remove("ring-2", "ring-[#99CC33]");
                                        if (draggingItemId && draggingItemId !== item.id) {
                                            onDropSlot?.(toDateStr(date), type);
                                        }
                                    }}
                                    className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-4 p-[14px] md:p-[17px] bg-white rounded-3xl md:rounded-[48px] border border-[rgba(153,204,51,0.05)] shadow-sm cursor-pointer hover:shadow-md transition-all ${
                                        isSwapping ? "opacity-60 animate-pulse" : ""
                                    } ${isDeleting ? "opacity-40 scale-95" : ""} ${draggingItemId === item.id ? "opacity-40 scale-95" : ""}`}
                                >
                                    {/* Top Row: Grip + Image + Info */}
                                    <div className="flex gap-3 md:gap-4 items-center flex-1 min-w-0" onClick={() => onViewRecipe?.(item.recipeId, item.id)}>
                                        {/* Drag Handle */}
                                        {variant === "weekly" && onDragStart && (
                                            <div className="cursor-grab active:cursor-grabbing shrink-0 touch-none">
                                                <GripVertical className="w-4 h-4 text-slate-300" />
                                            </div>
                                        )}
                                        {/* Recipe Image */}
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-full shrink-0 overflow-hidden bg-slate-100">
                                            {item.recipe?.imageUrl ? (
                                                <img
                                                    src={item.recipe.imageUrl}
                                                    alt={item.recipe?.title || ""}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                                    No img
                                                </div>
                                            )}
                                        </div>
                                        {/* Meal Info */}
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#538100]"
                                                style={{ fontFamily: "Inter, sans-serif" }}
                                            >
                                                {type}
                                            </p>
                                            <p
                                                className="text-sm md:text-base font-semibold text-[#1E293B] truncate"
                                                style={{ fontFamily: "Inter, sans-serif" }}
                                            >
                                                {item.recipe?.title || "Recipe"}
                                            </p>
                                            <p
                                                className="text-xs text-[#64748B]"
                                                style={{ fontFamily: "Inter, sans-serif" }}
                                            >
                                                {item.recipe?.cookTimeMinutes ? `${item.recipe.cookTimeMinutes} mins` : ""}{" "}
                                                {item.caloriesPerServing
                                                    ? `${item.recipe?.cookTimeMinutes ? "• " : ""}${item.caloriesPerServing * (item.servings || 1)} kcal`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    {/* Bottom Row (mobile) / Inline (desktop): Action Buttons */}
                                    {variant === "weekly" && (
                                        <div className="flex gap-1.5 justify-end md:shrink-0 pl-8 md:pl-0">
                                            {/* Manual Search Substitute */}
                                            {onSearchSubstitute && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSearchSubstitute(item.id, toDateStr(date), type);
                                                    }}
                                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-[#f0f7e6] hover:bg-[#e2efcf] transition-colors"
                                                    title="Search & substitute recipe"
                                                >
                                                    <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#538100]" />
                                                </button>
                                            )}
                                            {/* Auto-Swap (RAG) */}
                                            {onSwapMeal && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isSwapping) onSwapMeal(item.id);
                                                    }}
                                                    disabled={isSwapping}
                                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-[#f0f7e6] hover:bg-[#e2efcf] transition-colors disabled:opacity-50"
                                                    title="Auto-swap with AI suggestion"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 text-[#538100] ${isSwapping ? "animate-spin" : ""}`} />
                                                </button>
                                            )}
                                            {/* Delete */}
                                            {onDeleteMeal && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!isDeleting) onDeleteMeal(item.id);
                                                    }}
                                                    disabled={isDeleting}
                                                    className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    title="Remove from plan"
                                                >
                                                    <Trash2 className={`w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 ${isDeleting ? "animate-pulse" : ""}`} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                );
                            });
                        }

                        // Fix 9: Monthly variant — inline "Not planned yet" pill card
                        if (variant === "monthly") {
                            return (
                                <div
                                    key={`empty-${type}`}
                                    className="flex gap-4 items-center p-[14px] bg-white border-2 border-dashed border-[#f1f5f9] rounded-[48px] shadow-sm opacity-80"
                                >
                                    {/* Gray placeholder circle */}
                                    <div className="w-16 h-16 rounded-full shrink-0 bg-[#F8FAFC] flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-[#94A3B8]" />
                                    </div>
                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-xs font-semibold uppercase tracking-[-0.3px] text-[#94A3B8]"
                                            style={{ fontFamily: "Inter, sans-serif" }}
                                        >
                                            {type}
                                        </p>
                                        <p
                                            className="text-base font-bold text-[#94A3B8]"
                                            style={{ fontFamily: "Inter, sans-serif" }}
                                        >
                                            Not planned yet
                                        </p>
                                    </div>
                                    {/* Sparkle generate button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAddMeal?.(toDateStr(date), type);
                                        }}
                                        className="w-[37px] h-[37px] flex items-center justify-center shrink-0"
                                    >
                                        <Sparkles className="w-5 h-5 text-[#538100]" />
                                    </button>
                                </div>
                            );
                        }

                        // Weekly variant — dashed border CTA (also drop target)
                        return (
                            <button
                                key={`empty-${type}`}
                                onClick={() => onAddMeal?.(toDateStr(date), type)}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2", "ring-[#99CC33]"); }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2", "ring-[#99CC33]"); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove("ring-2", "ring-[#99CC33]");
                                    onDropSlot?.(toDateStr(date), type);
                                }}
                                className="flex flex-col gap-2 items-center justify-center p-6 bg-[#f0f7e6] border-2 border-dashed border-[rgba(153,204,51,0.2)] rounded-[48px] hover:bg-[#e6f0d6] transition-colors"
                            >
                                <Plus className="w-5 h-5 text-[#538100]" />
                                <span
                                    className="text-sm font-bold text-[#538100]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    Plan {type.charAt(0).toUpperCase() + type.slice(1)}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {/* Add meal to this day (compact '+' button) */}
            {variant === "weekly" && !isEntireDayEmpty && onAddMeal && (
                <button
                    onClick={() => onAddMeal(toDateStr(date), "")}
                    className="flex items-center justify-center gap-2 py-2 text-[#538100] hover:text-[#446d00] transition-colors"
                >
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-[rgba(153,204,51,0.3)] flex items-center justify-center hover:border-[#538100] transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
                        Add meal
                    </span>
                </button>
            )}

            {/* Day Total */}
            {totalKcal > 0 && (
                <p className="text-sm font-semibold text-slate-500 text-right">
                    Total: {totalKcal} kcal
                </p>
            )}
        </div>
    );
}
