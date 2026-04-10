"use client";

import { useState, useEffect } from "react";
import { X, Clock, ChefHat, Users, AlertTriangle, ChevronDown, ChevronUp, UtensilsCrossed, Check } from "lucide-react";

interface RecipeDetail {
    id: string;
    title: string;
    description?: string | null;
    imageUrl?: string | null;
    cuisine?: { id: string; code: string; name: string } | null;
    mealType?: string | null;
    difficulty?: string | null;
    prepTimeMinutes?: number | null;
    cookTimeMinutes?: number | null;
    totalTimeMinutes?: number | null;
    servings?: number | null;
    instructions?: (string | { text?: string })[];
    ingredients?: { qty?: number | string; quantity?: number | string; unit?: string; name: string; preparation_note?: string }[];
    nutrition?: {
        calories?: number | null;
        protein_g?: number | null;
        carbs_g?: number | null;
        fat_g?: number | null;
        fiber_g?: number | null;
    };
    allergens?: string[];
}

interface RecipeDetailDrawerProps {
    recipeId: string | null;
    planId?: string | null;
    mealPlanItemId?: string | null;
    onClose: () => void;
}

const INITIAL_INGREDIENTS = 5;
const INITIAL_STEPS = 2;

async function fetchRecipeDetail(id: string): Promise<RecipeDetail> {
    const { account } = await import("@/lib/appwrite");
    const jwt = await account.createJWT();
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${base}/api/v1/recipes/${id}`, {
        headers: { Authorization: `Bearer ${jwt.jwt}` },
    });
    if (!res.ok) throw new Error(`Recipe fetch failed: ${res.status}`);
    return res.json();
}

async function logMealFromPlan(planId: string, itemId: string): Promise<void> {
    const { account } = await import("@/lib/appwrite");
    const jwt = await account.createJWT();
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const res = await fetch(`${base}/api/v1/meal-plans/${planId}/log-meal`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${jwt.jwt}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemId }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(String((data as Record<string, unknown>)?.error ?? `Log meal failed: ${res.status}`));
    }
}

export function RecipeDetailDrawer({ recipeId, planId, mealPlanItemId, onClose }: RecipeDetailDrawerProps) {
    const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAllIngredients, setShowAllIngredients] = useState(false);
    const [showAllSteps, setShowAllSteps] = useState(false);
    const [logState, setLogState] = useState<"idle" | "logging" | "logged" | "error">("idle");

    useEffect(() => {
        if (!recipeId) {
            setRecipe(null);
            return;
        }
        setLoading(true);
        setError(null);
        setShowAllIngredients(false);
        setShowAllSteps(false);
        setLogState("idle");
        fetchRecipeDetail(recipeId)
            .then(setRecipe)
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [recipeId]);

    if (!recipeId) return null;

    const isOpen = !!recipeId;

    const handleLogMeal = async () => {
        if (!planId || !mealPlanItemId) return;
        setLogState("logging");
        try {
            await logMealFromPlan(planId, mealPlanItemId);
            setLogState("logged");
        } catch {
            setLogState("error");
            setTimeout(() => setLogState("idle"), 2500);
        }
    };

    // Shared content renderer
    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-8 h-8 border-2 border-[#538100] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-500" style={{ fontFamily: "Inter, sans-serif" }}>Loading recipe...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center py-20 gap-3 px-6">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                    <p className="text-sm text-slate-500 text-center">{error}</p>
                </div>
            );
        }
        if (!recipe) return null;

        const allIngredients = recipe.ingredients ?? [];
        const visibleIngredients = showAllIngredients ? allIngredients : allIngredients.slice(0, INITIAL_INGREDIENTS);
        const hiddenIngredientsCount = allIngredients.length - INITIAL_INGREDIENTS;

        const allSteps = recipe.instructions ?? [];
        const visibleSteps = showAllSteps ? allSteps : allSteps.slice(0, INITIAL_STEPS);
        const hiddenStepsCount = allSteps.length - INITIAL_STEPS;

        // Check if nutrition has any actual values
        const n = recipe.nutrition;
        const hasNutrition = n && (n.calories || n.protein_g || n.carbs_g || n.fat_g);

        return (
            <>
                {/* Hero Image */}
                {recipe.imageUrl && (
                    <div className="w-full h-56 md:h-64 overflow-hidden shrink-0">
                        <img
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div className="px-5 pt-4 pb-8">
                    {/* Title & Meta */}
                    {recipe.mealType && (
                        <span
                            className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#538100]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {recipe.mealType}
                        </span>
                    )}
                    <h2
                        className="text-2xl font-bold text-[#0F172A] mb-2"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {recipe.title}
                    </h2>

                    {recipe.description && (
                        <p className="text-sm text-slate-500 mb-4 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                            {recipe.description}
                        </p>
                    )}

                    {/* Quick Info Pills */}
                    <div className="flex flex-wrap gap-2 mb-5">
                        {(recipe.totalTimeMinutes || recipe.cookTimeMinutes) && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {recipe.totalTimeMinutes || recipe.cookTimeMinutes} mins
                                </span>
                            </div>
                        )}
                        {recipe.servings && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full">
                                <Users className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {recipe.servings} servings
                                </span>
                            </div>
                        )}
                        {recipe.difficulty && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full">
                                <ChefHat className="w-3.5 h-3.5 text-slate-500" />
                                <span className="text-xs font-medium text-slate-600 capitalize" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {recipe.difficulty}
                                </span>
                            </div>
                        )}
                        {recipe.cuisine?.name && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full">
                                <span className="text-xs font-medium text-slate-600" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {recipe.cuisine.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Nutrition Grid — only show if we have real values */}
                    {hasNutrition && (
                        <div className="mb-6">
                            <h3
                                className="text-sm font-bold text-[#0F172A] mb-3"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                Nutrition per serving
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { label: "Calories", value: n!.calories, unit: "kcal", color: "#EF4444" },
                                    { label: "Protein", value: n!.protein_g, unit: "g", color: "#3B82F6" },
                                    { label: "Carbs", value: n!.carbs_g, unit: "g", color: "#F59E0B" },
                                    { label: "Fat", value: n!.fat_g, unit: "g", color: "#8B5CF6" },
                                ].map(({ label, value, unit, color }) => (
                                    <div key={label} className="flex flex-col items-center p-3 bg-slate-50 rounded-2xl">
                                        <span className="text-lg font-bold" style={{ fontFamily: "Inter, sans-serif", color }}>
                                            {value != null ? Math.round(Number(value)) : "—"}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {unit}
                                        </span>
                                        <span className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Allergens */}
                    {recipe.allergens && recipe.allergens.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-[#0F172A] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
                                Allergens
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {recipe.allergens.map((a) => (
                                    <span
                                        key={a}
                                        className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-100"
                                        style={{ fontFamily: "Inter, sans-serif" }}
                                    >
                                        {a}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Ingredients — collapsible */}
                    {allIngredients.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-[#0F172A] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                                Ingredients ({allIngredients.length})
                            </h3>
                            <ul className="space-y-2">
                                {visibleIngredients.map((ing, i) => {
                                    const name = typeof ing === "string" ? ing : ing.name;
                                    // Handle both qty (our type) and quantity (backend field)
                                    const qty = typeof ing === "object" ? (ing.qty ?? ing.quantity) : null;
                                    const unit = typeof ing === "object" ? ing.unit : null;
                                    const note = typeof ing === "object" ? ing.preparation_note : null;
                                    return (
                                        <li key={i} className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#538100] mt-1.5 shrink-0" />
                                            <span className="text-sm text-slate-700" style={{ fontFamily: "Inter, sans-serif" }}>
                                                {qty ? `${qty}${unit ? ` ${unit}` : ""} ` : ""}
                                                {name}
                                                {note ? `, ${note}` : ""}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                            {hiddenIngredientsCount > 0 && (
                                <button
                                    onClick={() => setShowAllIngredients(!showAllIngredients)}
                                    className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#538100] hover:text-[#446d00] transition-colors"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {showAllIngredients ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Show less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            +{hiddenIngredientsCount} more ingredients
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Instructions — collapsible */}
                    {allSteps.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-[#0F172A] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                                Instructions
                            </h3>
                            <ol className="space-y-3">
                                {visibleSteps.map((step, i) => (
                                    <li key={i} className="flex gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#f0f7e6] flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-[#538100]" style={{ fontFamily: "Inter, sans-serif" }}>
                                                {i + 1}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed pt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {typeof step === "string" ? step : String((step as Record<string, unknown>)?.text ?? JSON.stringify(step))}
                                        </p>
                                    </li>
                                ))}
                            </ol>
                            {hiddenStepsCount > 0 && (
                                <button
                                    onClick={() => setShowAllSteps(!showAllSteps)}
                                    className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-[#538100] hover:text-[#446d00] transition-colors"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {showAllSteps ? (
                                        <>
                                            <ChevronUp className="w-4 h-4" />
                                            Show less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-4 h-4" />
                                            +{hiddenStepsCount} more steps
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Log Meal Button */}
                    {planId && mealPlanItemId && (
                        <button
                            onClick={handleLogMeal}
                            disabled={logState === "logging" || logState === "logged"}
                            className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold text-sm rounded-full transition-all shadow-sm ${logState === "logged"
                                    ? "bg-green-600 text-white"
                                    : logState === "error"
                                        ? "bg-red-500 text-white"
                                        : "bg-[#538100] hover:bg-[#446d00] text-white disabled:opacity-60"
                                }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {logState === "logging" ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Logging...
                                </>
                            ) : logState === "logged" ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Meal Logged!
                                </>
                            ) : logState === "error" ? (
                                "Failed — Try Again"
                            ) : (
                                <>
                                    <UtensilsCrossed className="w-4 h-4" />
                                    Log This Meal
                                </>
                            )}
                        </button>
                    )}
                </div>
            </>
        );
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
                onClick={onClose}
            />

            {/* ─── Mobile: Bottom sheet (< md) ─── */}
            <div
                className={`
                    fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl
                    transition-transform duration-300 ease-out
                    md:hidden
                    ${isOpen ? "translate-y-0" : "translate-y-full"}
                `}
                style={{ maxHeight: "92vh" }}
            >
                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-slate-300 rounded-full" />
                </div>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors z-10"
                >
                    <X className="w-4 h-4 text-slate-600" />
                </button>
                {/* Scrollable content */}
                <div className="overflow-y-auto" style={{ maxHeight: "calc(92vh - 40px)" }}>
                    {renderContent()}
                </div>
            </div>

            {/* ─── Desktop: Right side panel (≥ md) ─── */}
            <div
                className={`
                    fixed top-0 right-0 bottom-0 z-50 bg-white shadow-2xl border-l border-slate-200
                    transition-transform duration-300 ease-out
                    hidden md:flex md:flex-col
                    w-[480px]
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                {/* Header bar */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
                    <h3
                        className="text-sm font-bold text-[#0F172A] uppercase tracking-wider"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Recipe Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-600" />
                    </button>
                </div>
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto">
                    {renderContent()}
                </div>
            </div>
        </>
    );
}
