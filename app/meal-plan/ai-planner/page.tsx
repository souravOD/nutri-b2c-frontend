"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGetProfile, apiGetMyHealth } from "@/lib/api";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useActiveMember } from "@/contexts/member-context";
import { useMealPlans, useActivatePlan, useGeneratePlan, useDeletePlan } from "@/hooks/use-meal-plan";
import { AiPromptInput } from "@/components/meal-plan/ai-prompt-input";
import { PersonalizationCard } from "@/components/meal-plan/personalization-card";
import { PlanRecommendationCard } from "@/components/meal-plan/plan-recommendation-card";
import { useToast } from "@/hooks/use-toast";
import { useBetaFeedback } from "@/hooks/use-beta-feedback";
import type { MealPlanGenerateParams } from "@/lib/types";
import { MealPlanFeedbackSheet } from "@/components/feedback/meal-plan-feedback-sheet";

export default function AiPlannerPage() {
    const router = useRouter();
    const { toast } = useToast();

    // Data hooks
    const { members } = useHouseholdMembers();
    const { activeMemberId } = useActiveMember();
    const { plans } = useMealPlans();
    const activatePlan = useActivatePlan();
    const generatePlan = useGeneratePlan();
    const deletePlan = useDeletePlan();

    // Beta feedback — trigger after plan is generated
    const [planGenerated, setPlanGenerated] = useState(false);
    const mealPlanFeedback = useBetaFeedback("meal_plan", {
        delay: 2000,
        enabled: planGenerated,
    });

    const { data: profile } = useQuery({
        queryKey: ["me-profile"],
        queryFn: () => apiGetProfile(),
        staleTime: 120_000,
    });

    const { data: health } = useQuery({
        queryKey: ["me-health"],
        queryFn: () => apiGetMyHealth(),
        staleTime: 120_000,
    });

    // ── Dynamic member selection ──
    const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());

    // Initialise selection: prefer global active member, fall back to owner
    useEffect(() => {
        if (members.length > 0 && selectedMemberIds.size === 0) {
            const initial = (activeMemberId && members.find((m) => m.id === activeMemberId))
                ? activeMemberId
                : (members.find((m) => m.isProfileOwner) ?? members[0])?.id;
            if (initial) setSelectedMemberIds(new Set([initial]));
        }
    }, [members, activeMemberId]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggleMember = useCallback((id: string) => {
        setSelectedMemberIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                if (next.size > 1) next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const getMemberIdsForScope = useCallback((): string[] => {
        return Array.from(selectedMemberIds);
    }, [selectedMemberIds]);

    // Handle natural-language prompt submission
    const handlePromptSubmit = useCallback(
        async (prompt: string) => {
            const memberIds = getMemberIdsForScope();

            const today = new Date();
            const dayOfWeek = today.getDay();
            const daysToNextMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;
            const monday = new Date(today);
            monday.setDate(today.getDate() + daysToNextMonday);
            const startDate = monday.toISOString().slice(0, 10);
            const endD = new Date(monday);
            endD.setDate(endD.getDate() + 6);
            const endDate = endD.toISOString().slice(0, 10);

            const params: MealPlanGenerateParams = {
                startDate,
                endDate,
                memberIds: memberIds.length > 0 ? memberIds : [],
                mealsPerDay: ["breakfast", "lunch", "dinner"],
                preferences: {
                    prompt,
                },
            };

            try {
                await generatePlan.mutateAsync(params);
                setPlanGenerated(true);
                toast({ title: "Plan generated!", description: "Your AI meal plan is ready." });
                router.push("/meal-plan/weekly");
            } catch {
                toast({ title: "Failed to generate plan", variant: "destructive" });
            }
        },
        [generatePlan, getMemberIdsForScope, toast, router],
    );

    // Handle activate a recommended plan
    const handleActivatePlan = useCallback(
        (planId: string) => {
            activatePlan.mutate(planId, {
                onSuccess: () => {
                    toast({ title: "Plan activated!", description: "Navigate to the weekly view." });
                    router.push("/meal-plan/weekly");
                },
                onError: () => {
                    toast({ title: "Failed to activate plan", variant: "destructive" });
                },
            });
        },
        [activatePlan, toast, router],
    );

    const handleDeletePlan = useCallback(
        (planId: string) => {
            deletePlan.mutate(planId, {
                onSuccess: () => {
                    toast({ title: "Plan deleted", description: "The meal plan has been removed." });
                },
                onError: () => {
                    toast({ title: "Failed to delete plan", variant: "destructive" });
                },
            });
        },
        [deletePlan, toast],
    );

    return (
        <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-8">
            <div className="w-full max-w-[600px] mx-auto px-4 md:px-6">
                {/* ── Header ───────────────────────────────────────────── */}
                <header className="flex items-center justify-between pt-6 pb-2">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.push("/meal-plan")}
                            className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors lg:hidden"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
                        </button>
                        <Sparkles className="w-5 h-5 text-[#538100]" />
                        <h1
                            className="text-[20px] font-bold text-[#0F172A]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            AI Meal Planner
                        </h1>
                    </div>
                </header>

                {/* ── Member Selector (dynamic from DB) ── */}
                {members.length > 1 && (
                <section className="mt-4">
                    <p
                        className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Planning for
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {members.map((member) => {
                            const isSelected = selectedMemberIds.has(member.id);
                            const displayName = member.firstName || member.fullName?.split(" ")[0] || "Member";
                            return (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => toggleMember(member.id)}
                                    className={`px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap ${
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
                </section>
                )}

                {/* ── Prompt Input ──────────────────────────────────────── */}
                <section className="mt-6">
                    <h2
                        className="text-[18px] font-bold text-[#0F172A] mb-3"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        What&apos;s on the menu?
                    </h2>
                    <AiPromptInput
                        onSubmit={handlePromptSubmit}
                        isLoading={generatePlan.isPending}
                    />
                </section>

                {/* ── Personalization Card ──────────────────────────────── */}
                <section className="mt-4">
                    <PersonalizationCard
                        dietaryPreference={
                            (profile as { dietaryPreference?: string })?.dietaryPreference
                        }
                        calorieTarget={
                            (health as { targetCalories?: number })?.targetCalories
                        }
                    />
                </section>

                {/* ── Step-by-Step Wizard CTA ───────────────────────────── */}
                <section className="mt-4">
                    <Link
                        href="/meal-plan/generate"
                        className="w-full py-3 rounded-2xl border-2 border-dashed border-[#99CC33]/50 text-[14px] font-semibold text-[#538100] hover:bg-[#f0f7e6] transition-colors flex items-center justify-center gap-2"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        <Sparkles className="w-4 h-4" />
                        Generate Plan (Step-by-Step Wizard)
                    </Link>
                </section>

                {/* ── Recommended Plans ─────────────────────────────────── */}
                {(() => {
                    // Filter plans by selected members — show plans that include any selected member
                    const filteredPlans = plans.filter((plan) => {
                        if (!plan.memberIds || plan.memberIds.length === 0) return true; // household-wide
                        return plan.memberIds.some((mid) => selectedMemberIds.has(mid));
                    });

                    return filteredPlans.length > 0 ? (
                    <section className="mt-6">
                        <h3
                            className="text-[16px] font-bold text-[#0F172A] mb-3"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Recommended for this week
                        </h3>
                        <div className="flex flex-col gap-4">
                            {filteredPlans.slice(0, 3).map((plan) => {
                                const names = (plan.memberIds ?? [])
                                    .map((mid) => {
                                        const m = members.find((mem) => mem.id === mid);
                                        return m?.firstName || m?.fullName?.split(" ")[0] || null;
                                    })
                                    .filter(Boolean) as string[];

                                return (
                                <PlanRecommendationCard
                                    key={plan.id}
                                    plan={plan}
                                    memberNames={names.length > 0 ? names : undefined}
                                    onSelect={handleActivatePlan}
                                    onDelete={handleDeletePlan}
                                    isLoading={activatePlan.isPending}
                                    isDeleting={deletePlan.isPending}
                                />
                                );
                            })}
                        </div>
                    </section>
                    ) : null;
                })()}

                {/* ── Quick Links ───────────────────────────────────────── */}
                <section className="mt-6 mb-4">
                    <div className="flex gap-2">
                        <Link
                            href="/meal-plan/weekly"
                            className="flex-1 py-3 text-center rounded-xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            View Weekly Plan →
                        </Link>
                        <Link
                            href="/meal-plan/monthly"
                            className="flex-1 py-3 text-center rounded-xl bg-white border border-slate-200 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            View Monthly Plan →
                        </Link>
                    </div>
                </section>
            </div>

            {/* ═══ Beta Feedback ════════════════════════════════════════ */}
            <MealPlanFeedbackSheet
                open={mealPlanFeedback.show}
                onOpenChange={mealPlanFeedback.setShow}
                onSubmit={mealPlanFeedback.submit}
                onDismiss={mealPlanFeedback.dismiss}
            />
        </div>
    );
}
