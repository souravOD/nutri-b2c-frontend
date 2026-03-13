"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Sparkles, FileText, CheckCircle2, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    useMealPlans,
    useMealPlanDetail,
    useActivatePlan,
    useSwapMeal,
    useAddMealPlanItem,
    useReorderMealPlanItems,
    useDeleteMealPlanItem,
} from "@/hooks/use-meal-plan";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useActiveMember } from "@/contexts/member-context";
import { useToast } from "@/hooks/use-toast";
import { WeeklyDayCard } from "@/components/meal-plan/weekly-day-card";
import { RecipeDetailDrawer } from "@/components/meal-plan/recipe-detail-drawer";
import { apiSearchRecipes } from "@/lib/api";
import type { MealPlanItem, Recipe } from "@/lib/types";

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date) {
    const dt = new Date(d);
    dt.setDate(dt.getDate() - dt.getDay()); // Sunday
    return dt;
}

function formatWeekRange(start: Date) {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const sMonth = start.toLocaleDateString("en-US", { month: "short" });
    const eMonth = end.toLocaleDateString("en-US", { month: "short" });
    const sDay = start.getDate().toString().padStart(2, "0");
    const eDay = end.getDate().toString().padStart(2, "0");
    if (sMonth === eMonth) return `Week of ${sMonth} ${sDay} - ${eDay}`;
    return `Week of ${sMonth} ${sDay} - ${eMonth} ${eDay}`;
}

export default function WeeklyMealPlanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // ── Swap state ─────────────────────────────────────────
    const [swappingItemId, setSwappingItemId] = useState<string | null>(null);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

    // ── Add-item / Recipe search state ─────────────────────
    const [addSlot, setAddSlot] = useState<{ date: string; mealType: string } | null>(null);
    // ── Multi-step add flow ─────────────────────────────────
    const [addStep, setAddStep] = useState<"type" | "servings" | "search">("type");
    const [addServings, setAddServings] = useState(1);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    // ── Substitute search state (replace existing meal) ────
    const [substituteTarget, setSubstituteTarget] = useState<{ itemId: string; date: string; mealType: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Recipe[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Derived: is the search sheet open?
    const searchSheetOpen = addSlot !== null || substituteTarget !== null;
    const searchSheetTitle = substituteTarget
        ? `Substitute ${substituteTarget.mealType.charAt(0).toUpperCase() + substituteTarget.mealType.slice(1)}`
        : addSlot
            ? addStep === "type"
                ? "Add Meal"
                : addStep === "search"
                    ? `Add ${addSlot.mealType.charAt(0).toUpperCase() + addSlot.mealType.slice(1)}`
                    : selectedRecipe
                        ? `${selectedRecipe.title}`
                        : "Choose Servings"
            : "";

    // ── Drag-and-drop state ────────────────────────────────
    const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
    const [dragSource, setDragSource] = useState<{ date: string; type: string } | null>(null);

    const todayStr = toDateStr(new Date());

    // Household members
    const { members } = useHouseholdMembers();
    const { activeMemberId } = useActiveMember();
    const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);

    // Auto-select: prefer global active member, fall back to owner
    useEffect(() => {
        if (members.length > 0 && !selectedMemberId) {
            const initial = (activeMemberId && members.find((m) => m.id === activeMemberId))
                ? activeMemberId
                : (members.find((m) => m.isProfileOwner) ?? members[0])?.id;
            if (initial) setSelectedMemberId(initial);
        }
    }, [members, activeMemberId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch active + draft plans (filtered by member)
    const { plans: activePlans, isLoading: activePlansLoading } = useMealPlans("active", selectedMemberId);
    const { plans: draftPlans, isLoading: draftPlansLoading } = useMealPlans("draft", selectedMemberId);

    const activePlan = activePlans[0] ?? null;
    const draftPlan = !activePlan ? (draftPlans[0] ?? null) : null;
    const displayPlan = activePlan ?? draftPlan;
    const isDraft = displayPlan?.status === "draft";

    // Auto-navigate to the plan's date range
    useEffect(() => {
        if (displayPlan?.startDate) {
            const planStart = new Date(displayPlan.startDate + "T00:00:00");
            setWeekStart(startOfWeek(planStart));
        }
    }, [displayPlan?.startDate]);

    // Hooks
    const activatePlanMutation = useActivatePlan();
    const swapMutation = useSwapMeal();
    const addItemMutation = useAddMealPlanItem();
    const reorderMutation = useReorderMealPlanItems();
    const deleteMutation = useDeleteMealPlanItem();

    const handleActivate = () => {
        if (!displayPlan) return;
        activatePlanMutation.mutate(displayPlan.id, {
            onSuccess: () => {
                toast({ title: "Plan activated!", description: "Your meal plan is now active." });
            },
            onError: () => {
                toast({ title: "Failed to activate plan", variant: "destructive" });
            },
        });
    };

    // ── Swap handler ──────────────────────────────────────
    const handleSwapMeal = useCallback((itemId: string) => {
        if (!displayPlan) return;
        setSwappingItemId(itemId);
        swapMutation.mutate(
            { planId: displayPlan.id, itemId, reason: "User requested substitute" },
            {
                onSuccess: (data: any) => {
                    setSwappingItemId(null);
                    toast({
                        title: "Meal swapped!",
                        description: data?.reasoning || "Recipe replaced with a similar alternative.",
                    });
                },
                onError: () => {
                    setSwappingItemId(null);
                    toast({ title: "Swap failed", description: "Could not find a suitable replacement.", variant: "destructive" });
                },
            }
        );
    }, [displayPlan, swapMutation, toast]);

    // ── Delete handler ─────────────────────────────────────
    const handleDeleteMeal = useCallback((itemId: string) => {
        if (!displayPlan) return;
        setDeletingItemId(itemId);
        deleteMutation.mutate(
            { planId: displayPlan.id, itemId },
            {
                onSuccess: () => {
                    setDeletingItemId(null);
                    toast({ title: "Meal removed", description: "Recipe removed from your plan." });
                },
                onError: () => {
                    setDeletingItemId(null);
                    toast({ title: "Failed to remove", variant: "destructive" });
                },
            }
        );
    }, [displayPlan, deleteMutation, toast]);

    // ── Add-item: open search sheet ───────────────────────
    const handleAddMeal = useCallback((date: string, mealType: string) => {
        setSubstituteTarget(null);
        setSearchQuery("");
        setSearchResults([]);
        setAddServings(1);
        setSelectedRecipe(null);
        if (!mealType) {
            // "+ Add meal" button → start at meal type step
            setAddSlot({ date, mealType: "" });
            setAddStep("type");
        } else {
            // Specific slot button (e.g. "Plan Breakfast") → skip to search
            setAddSlot({ date, mealType });
            setAddStep("search");
        }
    }, []);

    // ── Search substitute: open search sheet for existing meal ─
    const handleSearchSubstitute = useCallback((itemId: string, date: string, mealType: string) => {
        setAddSlot(null);
        setSubstituteTarget({ itemId, date, mealType });
        setSearchQuery("");
        setSearchResults([]);
    }, []);

    // ── Add-item: search recipes ──────────────────────────
    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await apiSearchRecipes({ q: searchQuery, filters: {} });
            setSearchResults(results);
        } catch {
            toast({ title: "Search failed", variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery, toast]);

    // ── Select recipe: add new OR substitute existing ─────
    const handleSelectRecipe = useCallback((recipe: Recipe) => {
        if (!displayPlan) return;

        if (substituteTarget) {
            // Substitute mode: delete old item and insert new one atomically
            addItemMutation.mutate(
                {
                    planId: displayPlan.id,
                    recipeId: recipe.id,
                    mealDate: substituteTarget.date,
                    mealType: substituteTarget.mealType,
                    replaceItemId: substituteTarget.itemId,
                },
                {
                    onSuccess: () => {
                        setSubstituteTarget(null);
                        toast({ title: "Recipe substituted!", description: `Replaced with ${recipe.title}.` });
                    },
                    onError: () => {
                        toast({ title: "Failed to substitute", variant: "destructive" });
                    },
                }
            );
        } else if (addSlot) {
            addItemMutation.mutate(
                {
                    planId: displayPlan.id,
                    recipeId: recipe.id,
                    mealDate: addSlot.date,
                    mealType: addSlot.mealType,
                    servings: addServings,
                },
                {
                    onSuccess: () => {
                        setAddSlot(null);
                        setSelectedRecipe(null);
                        toast({ title: "Meal added!", description: `${recipe.title} added to your plan.` });
                    },
                    onError: () => {
                        toast({ title: "Failed to add meal", variant: "destructive" });
                    },
                }
            );
        }
    }, [displayPlan, addSlot, substituteTarget, addItemMutation, toast]);

    // Fetch plan detail (declared before DnD handlers that need `items`)
    const { items, isLoading: detailLoading } = useMealPlanDetail(displayPlan?.id ?? null);

    // ── DnD handlers ──────────────────────────────────────
    const handleDragStart = useCallback((itemId: string, fromDate: string, fromType: string) => {
        setDraggingItemId(itemId);
        setDragSource({ date: fromDate, type: fromType });
    }, []);

    const handleDropSlot = useCallback((toDate: string, toType: string) => {
        if (!displayPlan || !draggingItemId || !dragSource) return;

        // Check if target slot already has a meal (for two-way swap)
        const targetSlotItems = items.filter(
            (i) => i.mealDate === toDate && i.mealType === toType && i.id !== draggingItemId
        );
        const targetItem = targetSlotItems[0];

        const moves: { itemId: string; mealDate: string; mealType: string }[] = [
            // Move dragged item to target slot
            { itemId: draggingItemId, mealDate: toDate, mealType: toType },
        ];

        // If target slot has a meal, move it to the dragged item's original slot (swap)
        if (targetItem) {
            moves.push({
                itemId: targetItem.id,
                mealDate: dragSource.date,
                mealType: dragSource.type,
            });
        }

        reorderMutation.mutate(
            { planId: displayPlan.id, moves },
            {
                onSuccess: () => {
                    toast({
                        title: targetItem ? "Meals swapped!" : "Meal moved!",
                        description: targetItem
                            ? `Swapped meals between slots.`
                            : `Rearranged to ${toType} on ${toDate}.`,
                    });
                },
                onError: () => {
                    toast({ title: "Move failed", variant: "destructive" });
                },
            }
        );
        setDraggingItemId(null);
        setDragSource(null);
    }, [displayPlan, draggingItemId, dragSource, items, reorderMutation, toast]);

    const isLoading = activePlansLoading || draftPlansLoading || detailLoading;

    // Build week days
    const weekDays = useMemo(() => {
        const days: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [weekStart]);

    // Group items by date
    const itemsByDate = useMemo(() => {
        const map = new Map<string, MealPlanItem[]>();
        for (const item of items) {
            const d = item.mealDate;
            if (!map.has(d)) map.set(d, []);
            map.get(d)!.push(item);
        }
        return map;
    }, [items]);

    const goToPrevWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() - 7);
        setWeekStart(d);
    };

    const goToNextWeek = () => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + 7);
        setWeekStart(d);
    };

    return (
        <div className="min-h-screen bg-[#f7f8f6]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2">
                <button onClick={() => router.push("/meal-plan")} className="p-2 rounded-full">
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                </button>
                <h1 className="flex-1 text-center text-xl font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>Meal Planning</h1>
                <Link href="/meal-plan" className="flex items-center justify-center w-12 h-12">
                    <Calendar className="w-[18px] h-5 text-slate-600" />
                </Link>
            </div>

            {/* Sub-header: icon + "Weekly Plan" */}
            <div className="backdrop-blur-md bg-[rgba(247,248,246,0.8)] border-b border-[rgba(153,204,51,0.1)] pb-px">
                <div className="max-w-[576px] md:max-w-[640px] mx-auto p-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-[22px] h-[22px] text-[#538100]" />
                        <h2 className="text-xl font-bold text-[#0F172A] tracking-[-0.5px]" style={{ fontFamily: "Inter, sans-serif" }}>Weekly Plan</h2>
                    </div>
                </div>

                {/* Toggle: Weekly / Monthly */}
                <div className="max-w-[576px] md:max-w-[640px] mx-auto px-4 py-3">
                    <div className="flex h-11 bg-[#e2e8f0] rounded-full p-1">
                        <div className="flex-1 flex items-center justify-center bg-white rounded-full shadow-sm">
                            <span className="text-sm font-semibold text-[#538100]" style={{ fontFamily: "Inter, sans-serif" }}>Weekly</span>
                        </div>
                        <Link
                            href="/meal-plan/monthly"
                            className="flex-1 flex items-center justify-center rounded-full"
                        >
                            <span className="text-sm font-semibold text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Monthly</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Member Selector (multi-member households) ── */}
            {members.length > 1 && (
                <div className="max-w-[576px] md:max-w-[640px] mx-auto px-4 pt-3">
                    <p
                        className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Viewing plan for
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {members.map((member) => {
                            const isSelected = selectedMemberId === member.id;
                            const displayName = member.fullName?.split(" ")[0] || "Member";
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => setSelectedMemberId(member.id)}
                                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
                                        isSelected
                                            ? "bg-[#99CC33] text-[#0F172A] shadow-sm"
                                            : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                                    }`}
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {displayName}{member.isProfileOwner ? " (You)" : ""}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Draft Plan Banner */}
            {isDraft && displayPlan && (
                <div className="max-w-[576px] md:max-w-[640px] mx-auto mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-amber-900" style={{ fontFamily: "Inter, sans-serif" }}>
                                Draft Plan
                            </h3>
                            <p className="text-xs text-amber-700 mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
                                Review your AI-generated meal plan below. Once you&apos;re happy with it, activate it to start tracking.
                            </p>
                            <button
                                onClick={handleActivate}
                                disabled={activatePlanMutation.isPending}
                                className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 bg-[#538100] text-white text-sm font-bold rounded-full hover:bg-[#446d00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {activatePlanMutation.isPending ? "Activating..." : "Activate This Plan"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main - Calendar Layout */}
            <div className="flex flex-col gap-8 max-w-[576px] md:max-w-[640px] mx-auto pt-6 px-4 pb-32">
                {/* Week Navigator */}
                <div className="flex items-center justify-between px-2">
                    <button onClick={goToPrevWeek} className="p-2 rounded-full hover:bg-slate-100">
                        <ChevronLeft className="w-3 h-3 text-slate-600" />
                    </button>
                    <h3
                        className="text-[18px] font-bold text-[#0F172A]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {formatWeekRange(weekStart)}
                    </h3>
                    <button onClick={goToNextWeek} className="p-2 rounded-full hover:bg-slate-100">
                        <ChevronRight className="w-3 h-3 text-slate-600" />
                    </button>
                </div>

                {/* Day Cards */}
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400">Loading plan...</div>
                ) : !displayPlan ? (
                    <div className="text-center py-12">
                        <p className="text-slate-500 mb-4">No active meal plan found.</p>
                        <Link
                            href="/meal-plan/ai-planner"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-[#538100] text-white font-bold rounded-full"
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate a Plan
                        </Link>
                    </div>
                ) : (
                    weekDays.map((day) => {
                        const dateStr = toDateStr(day);
                        const meals = itemsByDate.get(dateStr) ?? [];
                        const isToday = dateStr === todayStr;
                        return (
                            <div
                                key={dateStr}
                                onDragOver={(e) => e.preventDefault()}
                            >
                                <WeeklyDayCard
                                    date={day}
                                    isToday={isToday}
                                    meals={meals}
                                    onAddMeal={handleAddMeal}
                                    onViewRecipe={(recipeId, itemId) => { setSelectedRecipeId(recipeId); setSelectedItemId(itemId); }}
                                    onSwapMeal={handleSwapMeal}
                                    onSearchSubstitute={handleSearchSubstitute}
                                    onDeleteMeal={handleDeleteMeal}
                                    swappingItemId={swappingItemId}
                                    deletingItemId={deletingItemId}
                                    onDragStart={handleDragStart}
                                    onDropSlot={handleDropSlot}
                                    draggingItemId={draggingItemId}
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* Recipe Detail Drawer */}
            <RecipeDetailDrawer
                recipeId={selectedRecipeId}
                planId={displayPlan?.id ?? null}
                mealPlanItemId={selectedItemId}
                onClose={() => { setSelectedRecipeId(null); setSelectedItemId(null); }}
            />

            {/* ── Add-Item / Substitute Recipe Search Sheet ─────────── */}
            {searchSheetOpen && (
                <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => { setAddSlot(null); setSubstituteTarget(null); setSelectedRecipe(null); }}
                    />
                    {/* Sheet: bottom sheet on mobile, centered modal on desktop */}
                    <div className="relative w-full max-w-[576px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[80vh] flex flex-col animate-in slide-in-from-bottom md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
                        {/* Sheet Header */}
                        <div className="flex items-center justify-between p-4 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                {searchSheetTitle}
                            </h3>
                            <button
                                onClick={() => { setAddSlot(null); setSubstituteTarget(null); setSelectedRecipe(null); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>

                        {/* Step 1: Pick Meal Type */}
                        {addSlot && addStep === "type" && (
                            <div className="p-4">
                                <p className="text-sm text-slate-500 mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                                    What type of meal are you adding?
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {["breakfast", "lunch", "dinner", "snack"].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setAddSlot({ ...addSlot, mealType: type });
                                                setAddStep("search");
                                            }}
                                            className="py-4 px-4 bg-[#f8faf5] border-2 border-[#E2E8F0] rounded-2xl text-center font-bold text-[15px] text-[#0F172A] hover:border-[#99CC33] hover:bg-[#f0f7e6] transition-all"
                                            style={{ fontFamily: "Inter, sans-serif" }}
                                        >
                                            {type === "breakfast" && "🌅 "}
                                            {type === "lunch" && "☀️ "}
                                            {type === "dinner" && "🌙 "}
                                            {type === "snack" && "🍎 "}
                                            {type.charAt(0).toUpperCase() + type.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Search recipes (also used for substitute) */}
                        {((!substituteTarget && addStep === "search") || substituteTarget) && (
                            <>
                                {/* Search Bar */}
                                <div className="p-4">
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                                placeholder="Search recipes..."
                                                className="w-full pl-10 pr-4 py-3 bg-[#f1f5f9] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#99CC33]"
                                                style={{ fontFamily: "Inter, sans-serif" }}
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            onClick={handleSearch}
                                            disabled={isSearching || !searchQuery.trim()}
                                            className="px-5 py-3 bg-[#538100] text-white text-sm font-bold rounded-full hover:bg-[#446d00] disabled:opacity-50 transition-colors"
                                        >
                                            {isSearching ? "..." : "Search"}
                                        </button>
                                    </div>
                                </div>

                                {/* Results */}
                                <div className="flex-1 overflow-y-auto px-4 pb-8">
                                    {searchResults.length === 0 && !isSearching && (
                                        <p className="text-center text-slate-400 py-8 text-sm">
                                            {substituteTarget
                                                ? "Search for a recipe to replace the current one"
                                                : "Search for a recipe to add to your plan"}
                                        </p>
                                    )}
                                    {isSearching && (
                                        <p className="text-center text-slate-400 py-8 text-sm animate-pulse">
                                            Searching recipes...
                                        </p>
                                    )}
                                    {searchResults.map((recipe) => (
                                        <button
                                            key={recipe.id}
                                            onClick={() => {
                                                if (substituteTarget) {
                                                    handleSelectRecipe(recipe);
                                                } else {
                                                    setSelectedRecipe(recipe);
                                                    setAddStep("servings");
                                                }
                                            }}
                                            disabled={addItemMutation.isPending}
                                            className="w-full flex gap-4 items-center p-3 mb-2 bg-white border border-slate-100 rounded-2xl hover:bg-[#f8faf5] transition-colors text-left disabled:opacity-50"
                                        >
                                            <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden bg-slate-100">
                                                {recipe.imageUrl ? (
                                                    <img
                                                        src={recipe.imageUrl}
                                                        alt={recipe.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                                                        No img
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-[#1E293B] truncate">{recipe.title}</p>
                                                <p className="text-xs text-[#64748B]">
                                                    {recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} mins` : ""}
                                                    {recipe.calories ? ` · ${recipe.calories} kcal` : ""}
                                                </p>
                                            </div>
                                            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[#f0f7e6]">
                                                <span className="text-[#538100] text-lg font-bold">{substituteTarget ? "↻" : "+"}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Step 3: Pick Servings */}
                        {addSlot && addStep === "servings" && selectedRecipe && (
                            <div className="p-4">
                                <div className="flex gap-3 items-center p-3 mb-4 bg-[#f8faf5] border border-[#E2E8F0] rounded-2xl">
                                    <div className="w-12 h-12 rounded-xl shrink-0 overflow-hidden bg-slate-100">
                                        {selectedRecipe.imageUrl ? (
                                            <img src={selectedRecipe.imageUrl} alt={selectedRecipe.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">No img</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#1E293B] truncate">{selectedRecipe.title}</p>
                                        <p className="text-xs text-[#64748B]">
                                            {selectedRecipe.calories ? `${selectedRecipe.calories} kcal/serving` : ""}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-500 mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                                    How many servings?
                                </p>
                                <div className="flex items-center justify-center gap-4 mb-6">
                                    <button
                                        onClick={() => setAddServings(Math.max(1, addServings - 1))}
                                        disabled={addServings <= 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xl font-bold hover:bg-slate-200 disabled:opacity-30 transition-colors"
                                    >
                                        −
                                    </button>
                                    <span className="text-3xl font-bold text-[#0F172A] w-12 text-center" style={{ fontFamily: "Inter, sans-serif" }}>
                                        {addServings}
                                    </span>
                                    <button
                                        onClick={() => setAddServings(Math.min(10, addServings + 1))}
                                        disabled={addServings >= 10}
                                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xl font-bold hover:bg-slate-200 disabled:opacity-30 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => { if (selectedRecipe) handleSelectRecipe(selectedRecipe); }}
                                    disabled={addItemMutation.isPending}
                                    className="w-full py-3 bg-[#99CC33] text-[#0F172A] font-bold text-[14px] rounded-full hover:bg-[#6B8F24] disabled:opacity-50 transition-colors"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {addItemMutation.isPending ? "Adding..." : `Add to Plan · ${addServings} serving${addServings > 1 ? "s" : ""}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
