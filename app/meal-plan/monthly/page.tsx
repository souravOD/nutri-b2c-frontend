"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Calendar, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMealPlans, useMealPlanDetail, useActivatePlan } from "@/hooks/use-meal-plan";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useToast } from "@/hooks/use-toast";
import { MonthlyCalendar } from "@/components/meal-plan/monthly-calendar";
import { WeeklyDayCard } from "@/components/meal-plan/weekly-day-card";
import { RecipeDetailDrawer } from "@/components/meal-plan/recipe-detail-drawer";
import type { MealPlanItem } from "@/lib/types";

function toDateStr(d: Date) {
    return d.toISOString().slice(0, 10);
}

export default function MonthlyMealPlanPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    // Household members
    const { members } = useHouseholdMembers();
    const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(undefined);

    // Fetch active + draft plans (filtered by member)
    const { plans: activePlans, isLoading: activePlansLoading } = useMealPlans("active", selectedMemberId);
    const { plans: draftPlans, isLoading: draftPlansLoading } = useMealPlans("draft", selectedMemberId);

    const activePlan = activePlans[0] ?? null;
    const draftPlan = !activePlan ? (draftPlans[0] ?? null) : null;
    const displayPlan = activePlan ?? draftPlan;
    const isDraft = displayPlan?.status === "draft";

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

    // Build meal status map for calendar dots
    const mealStatusByDate = useMemo(() => {
        const map = new Map<string, "complete" | "partial" | "empty">();
        const grouped = new Map<string, MealPlanItem[]>();

        for (const item of items) {
            const d = item.mealDate;
            if (!grouped.has(d)) grouped.set(d, []);
            grouped.get(d)!.push(item);
        }

        for (const [date, dayItems] of grouped.entries()) {
            const typesPlanned = new Set(dayItems.map((i) => i.mealType));
            if (typesPlanned.size >= 3) {
                map.set(date, "complete");
            } else if (typesPlanned.size > 0) {
                map.set(date, "partial");
            }
        }

        return map;
    }, [items]);

    // Get items for the selected day
    const selectedDateStr = toDateStr(selectedDate);
    const selectedDayItems = useMemo(
        () => items.filter((item) => item.mealDate === selectedDateStr),
        [items, selectedDateStr],
    );

    const previewLabel = selectedDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    // Check status
    const dayStatus = mealStatusByDate.get(selectedDateStr);
    const statusBadge =
        dayStatus === "complete"
            ? { label: "Completed", bg: "bg-[rgba(153,204,51,0.1)]", text: "text-[#538100]" }
            : dayStatus === "partial"
                ? { label: "Partial", bg: "bg-amber-50", text: "text-amber-600" }
                : null;

    return (
        <div className="min-h-screen bg-[#f7f8f6]">
            {/* Header — full width, matches weekly exactly */}
            <div className="flex items-center justify-between px-4 py-2">
                <button onClick={() => router.push("/meal-plan")} className="p-2 rounded-full">
                    <ArrowLeft className="w-4 h-4 text-slate-700" />
                </button>
                <h1 className="flex-1 text-center text-xl font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>Meal Planning</h1>
                <Link href="/meal-plan" className="flex items-center justify-center w-12 h-12">
                    <Calendar className="w-[18px] h-5 text-slate-600" />
                </Link>
            </div>

            {/* Sub-header + Toggle — full width, matches weekly exactly */}
            <div className="backdrop-blur-md bg-[rgba(247,248,246,0.8)] border-b border-[rgba(153,204,51,0.1)] pb-px">
                <div className="max-w-[576px] md:max-w-[640px] mx-auto p-4">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-[22px] h-[22px] text-[#538100]" />
                        <h2 className="text-xl font-bold text-[#0F172A] tracking-[-0.5px]" style={{ fontFamily: "Inter, sans-serif" }}>Monthly Plan</h2>
                    </div>
                </div>

                {/* Toggle: Weekly / Monthly */}
                <div className="max-w-[576px] md:max-w-[640px] mx-auto px-4 py-3">
                    <div className="flex h-11 bg-[#e2e8f0] rounded-full p-1">
                        <Link
                            href="/meal-plan/weekly"
                            className="flex-1 flex items-center justify-center rounded-full"
                        >
                            <span className="text-sm font-semibold text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Weekly</span>
                        </Link>
                        <div className="flex-1 flex items-center justify-center bg-white rounded-full shadow-sm">
                            <span className="text-sm font-semibold text-[#538100]" style={{ fontFamily: "Inter, sans-serif" }}>Monthly</span>
                        </div>
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
                        <button
                            type="button"
                            onClick={() => setSelectedMemberId(undefined)}
                            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
                                selectedMemberId === undefined
                                    ? "bg-[#99CC33] text-[#0F172A] shadow-sm"
                                    : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                            }`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Everyone
                        </button>
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

            {/* Calendar + Day Preview — content area */}
            <div className="max-w-[576px] md:max-w-[640px] mx-auto px-4 pb-32">
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
                    <>
                        {/* Calendar */}
                        <div className="pt-4 max-w-[576px]">
                            <MonthlyCalendar
                                selectedDate={selectedDate}
                                onSelectDate={setSelectedDate}
                                mealStatusByDate={mealStatusByDate}
                            />
                        </div>

                        {/* Day Preview Section */}
                        <div className="mt-4 pt-4 border-t border-[#f1f5f9] max-w-[576px]">
                            <div className="flex items-center justify-between mb-3">
                                <h3
                                    className="text-lg font-bold text-[#0F172A]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {previewLabel} Preview
                                </h3>
                                {statusBadge && (
                                    <span
                                        className={`px-2 py-1 text-xs font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}
                                        style={{ fontFamily: "Inter, sans-serif" }}
                                    >
                                        {statusBadge.label}
                                    </span>
                                )}
                            </div>

                            <WeeklyDayCard
                                date={selectedDate}
                                isToday={selectedDateStr === toDateStr(new Date())}
                                meals={selectedDayItems}
                                variant="monthly"
                                onAddMeal={() => router.push("/meal-plan/ai-planner")}
                                onViewRecipe={(recipeId, itemId) => { setSelectedRecipeId(recipeId); setSelectedItemId(itemId); }}
                            />
                        </div>
                    </>
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
