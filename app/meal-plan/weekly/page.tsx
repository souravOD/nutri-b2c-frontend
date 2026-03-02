"use client";

import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMealPlans, useMealPlanDetail, useActivatePlan } from "@/hooks/use-meal-plan";
import { useToast } from "@/hooks/use-toast";
import { WeeklyDayCard } from "@/components/meal-plan/weekly-day-card";
import { RecipeDetailDrawer } from "@/components/meal-plan/recipe-detail-drawer";
import type { MealPlanItem } from "@/lib/types";

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

    const todayStr = toDateStr(new Date());

    // Fetch active + draft plans
    const { plans: activePlans, isLoading: activePlansLoading } = useMealPlans("active");
    const { plans: draftPlans, isLoading: draftPlansLoading } = useMealPlans("draft");

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

    // Activate plan hook
    const activatePlanMutation = useActivatePlan();

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

    // Fetch plan detail
    const { items, isLoading: detailLoading } = useMealPlanDetail(displayPlan?.id ?? null);

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

            {/* Main - Calendar Layout (matches Figma data-node-id 279:4624) */}
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
                    weekDays.map((day, idx) => {
                        const dateStr = toDateStr(day);
                        const meals = itemsByDate.get(dateStr) ?? [];
                        const isToday = dateStr === todayStr;
                        return (
                            <div key={dateStr}>
                                <WeeklyDayCard
                                    date={day}
                                    isToday={isToday}
                                    meals={meals}
                                    onAddMeal={() => router.push("/meal-plan/ai-planner")}
                                    onViewRecipe={(recipeId, itemId) => { setSelectedRecipeId(recipeId); setSelectedItemId(itemId); }}
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
        </div>
    );
}
