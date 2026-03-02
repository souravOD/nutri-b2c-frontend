"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Sparkles, UtensilsCrossed, Target, Wallet, Users, Check, ChevronRight, Salad, Flame, Leaf, Vegan, Heart, Dumbbell, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useGeneratePlan } from "@/hooks/use-meal-plan";
import { useToast } from "@/hooks/use-toast";
import type { MealPlanGenerateParams } from "@/lib/types";

/* ─── Types ────────────────────────────────────────────────────── */
type FamilyScope = "me" | "partner" | "family";
type DietaryPref = "vegan" | "keto" | "paleo" | "vegetarian" | "mediterranean" | "none";
type Goal = "lose_weight" | "gain_muscle" | "stay_healthy";

const TOTAL_STEPS = 5;

/* ─── Step Data ────────────────────────────────────────────────── */
const DIETARY_OPTIONS: { value: DietaryPref; label: string; icon: typeof Vegan }[] = [
    { value: "vegan", label: "Vegan", icon: Vegan },
    { value: "keto", label: "Keto", icon: Flame },
    { value: "paleo", label: "Paleo", icon: Salad },
    { value: "vegetarian", label: "Vegetarian", icon: Leaf },
    { value: "mediterranean", label: "Mediterranean", icon: UtensilsCrossed },
    { value: "none", label: "No Preference", icon: Check },
];

const GOAL_OPTIONS: { value: Goal; label: string; description: string; icon: typeof Scale }[] = [
    { value: "lose_weight", label: "Lose Weight", description: "Focus on calorie deficit", icon: Scale },
    { value: "gain_muscle", label: "Gain Muscle", description: "High protein for hypertrophy", icon: Dumbbell },
    { value: "stay_healthy", label: "Stay Healthy", description: "Balanced nutritional intake", icon: Heart },
];

const SCOPE_OPTIONS: { value: FamilyScope; label: string; description: string }[] = [
    { value: "me", label: "Just Me", description: "Plan for yourself" },
    { value: "partner", label: "Me & Partner", description: "Plan for two" },
    { value: "family", label: "Entire Family", description: "Plan for everyone" },
];

const BUDGET_MARKS = [
    { value: 50, label: "$50" },
    { value: 100, label: "$100" },
    { value: 150, label: "$150" },
    { value: 200, label: "$200" },
    { value: 250, label: "$250" },
    { value: 350, label: "$350" },
    { value: 500, label: "$500+" },
];

const STEP_LABELS = [
    { label: "Who's eating?", icon: Users },
    { label: "Dietary Preferences", icon: UtensilsCrossed },
    { label: "Health Goals", icon: Target },
    { label: "Weekly Budget", icon: Wallet },
    { label: "Review & Generate", icon: Sparkles },
];

/* ─── Component ────────────────────────────────────────────────── */
export default function AiPlannerPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { members } = useHouseholdMembers();
    const generatePlan = useGeneratePlan();

    // Wizard state
    const [step, setStep] = useState(1);
    const [familyScope, setFamilyScope] = useState<FamilyScope>("me");
    const [dietaryPref, setDietaryPref] = useState<DietaryPref>("none");
    const [goal, setGoal] = useState<Goal>("stay_healthy");
    const [budget, setBudget] = useState(120);

    const progress = Math.round((step / TOTAL_STEPS) * 100);

    // Member IDs for scope
    const getMemberIds = useCallback((): string[] => {
        if (!members.length) return [];
        const owner = members.find((m) => m.isProfileOwner);
        const ownerId = owner?.id ?? members[0]?.id;
        switch (familyScope) {
            case "me":
                return ownerId ? [ownerId] : [];
            case "partner": {
                const partner = members.find(
                    (m) => !m.isProfileOwner && (m.householdRole === "partner" || m.householdRole === "spouse"),
                );
                return [ownerId, partner?.id].filter(Boolean) as string[];
            }
            case "family":
                return members.map((m) => m.id);
            default:
                return ownerId ? [ownerId] : [];
        }
    }, [members, familyScope]);

    // Navigation
    const goBack = () => {
        if (step === 1) {
            router.push("/meal-plan");
        } else {
            setStep((s) => s - 1);
        }
    };

    const goNext = () => {
        if (step < TOTAL_STEPS) {
            setStep((s) => s + 1);
        }
    };

    // Generate plan
    const handleGenerate = useCallback(async () => {
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
            memberIds: getMemberIds(),
            mealsPerDay: ["breakfast", "lunch", "dinner"],
            preferences: {
                prompt: [
                    "Generate a",
                    dietaryPref !== "none" ? dietaryPref : "",
                    "meal plan focused on",
                    goal.replace(/_/g, " "),
                    "with a weekly budget of $" + budget
                ].filter(Boolean).join(" "),
            },
        };

        try {
            await generatePlan.mutateAsync(params);
            toast({ title: "Plan generated!", description: "Your AI meal plan is ready." });
            router.push("/meal-plan/weekly");
        } catch {
            toast({ title: "Failed to generate plan", variant: "destructive" });
        }
    }, [generatePlan, getMemberIds, dietaryPref, goal, budget, toast, router]);

    /* ─── Step Title Map ──────────────────────────────────────────── */
    const stepTitles: Record<number, { hero: string; sub: string }> = {
        1: { hero: "Who's eating?", sub: "Select who this meal plan is for." },
        2: { hero: "Tell us about your taste", sub: "Customize your AI-powered meal plan based on your diet and fitness goals." },
        3: { hero: "What is your main goal?", sub: "We'll tailor your plan to help you reach your target." },
        4: { hero: "Set your weekly budget", sub: "We'll find meals that fit your budget." },
        5: { hero: "Review your preferences", sub: "Make sure everything looks right before generating." },
    };

    const current = stepTitles[step];

    /* ─── CTA Button (shared between mobile footer and desktop card) */
    const ctaButton = (
        <>
            {step < TOTAL_STEPS ? (
                <button
                    onClick={goNext}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#9C3] text-[#0F172A] font-bold text-base rounded-full shadow-[0px_10px_15px_-3px_rgba(153,204,51,0.2),0px_4px_6px_-4px_rgba(153,204,51,0.2)] hover:brightness-105 transition-all"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    Next
                    <ChevronRight className="w-5 h-5" />
                </button>
            ) : (
                <button
                    onClick={handleGenerate}
                    disabled={generatePlan.isPending}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-[#9C3] text-[#0F172A] font-bold text-base rounded-full shadow-[0px_10px_15px_-3px_rgba(153,204,51,0.2),0px_4px_6px_-4px_rgba(153,204,51,0.2)] hover:brightness-105 transition-all disabled:opacity-50"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    <Sparkles className="w-[22px] h-[22px]" />
                    {generatePlan.isPending ? "Generating..." : "Generate My Plan"}
                </button>
            )}
        </>
    );

    /* ─── Step Content (shared between mobile and desktop) ──────── */
    const stepContent = (
        <>
            {/* ── Step 1: Family Scope ──────────────────────────────── */}
            {step === 1 && (
                <div className="flex flex-col gap-3">
                    {SCOPE_OPTIONS.map((opt) => {
                        const isActive = familyScope === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setFamilyScope(opt.value)}
                                className={`flex items-center p-[18px] rounded-[48px] border-2 transition-all ${isActive
                                    ? "bg-[rgba(153,204,51,0.1)] border-[#9C3]"
                                    : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 shrink-0 ${isActive ? "bg-[#9C3] text-white" : "bg-[rgba(153,204,51,0.1)] text-[#538100]"
                                    }`}>
                                    <Users className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                        {opt.label}
                                    </p>
                                    <p className="text-xs text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
                                        {opt.description}
                                    </p>
                                </div>
                                {isActive && (
                                    <div className="w-[22px] h-[22px] rounded-full bg-[#9C3] flex items-center justify-center shrink-0">
                                        <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}
                                {!isActive && (
                                    <div className="w-5 h-5 rounded-full border border-[#CBD5E1] shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* ── Step 2: Dietary Preferences ──────────────────────── */}
            {step === 2 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <UtensilsCrossed className="w-[18px] h-[18px] text-[#538100]" />
                        <h3 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                            Dietary Preferences
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {DIETARY_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = dietaryPref === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setDietaryPref(opt.value)}
                                    className={`flex flex-col items-center justify-center p-[18px] rounded-[24px] border-2 transition-all ${isActive
                                        ? "bg-[rgba(153,204,51,0.1)] border-[#9C3] shadow-sm"
                                        : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                                        }`}
                                >
                                    <Icon className={`w-7 h-7 mb-1 ${isActive ? "text-[#538100]" : "text-[#64748B]"}`} />
                                    <span
                                        className="text-sm font-bold text-[#0F172A]"
                                        style={{ fontFamily: "Inter, sans-serif" }}
                                    >
                                        {opt.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Step 3: Goals ─────────────────────────────────────── */}
            {step === 3 && (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5 text-[#538100]" />
                        <h3 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                            What is your main goal?
                        </h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {GOAL_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const isActive = goal === opt.value;
                            return (
                                <button
                                    key={opt.value}
                                    onClick={() => setGoal(opt.value)}
                                    className={`flex items-center p-[18px] rounded-[48px] border-2 transition-all ${isActive
                                        ? "bg-[rgba(153,204,51,0.1)] border-[#9C3]"
                                        : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-[rgba(153,204,51,0.1)] flex items-center justify-center mr-4 shrink-0">
                                        <Icon className="w-5 h-5 text-[#538100]" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {opt.label}
                                        </p>
                                        <p className="text-xs text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
                                            {opt.description}
                                        </p>
                                    </div>
                                    {isActive ? (
                                        <div className="w-[22px] h-[22px] rounded-full bg-[#9C3] flex items-center justify-center shrink-0">
                                            <Check className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full border border-[#CBD5E1] shrink-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Step 4: Budget ────────────────────────────────────── */}
            {step === 4 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-[22px] h-4 text-[#538100]" />
                            <h3 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                Weekly Budget
                            </h3>
                        </div>
                        <span className="text-xl font-bold text-[#9C3]" style={{ fontFamily: "Inter, sans-serif" }}>
                            ${budget}
                        </span>
                    </div>
                    <div className="pt-6">
                        <input
                            type="range"
                            min={50}
                            max={500}
                            step={10}
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="w-full h-2 bg-[rgba(153,204,51,0.2)] rounded-full appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none
                                    [&::-webkit-slider-thumb]:w-6
                                    [&::-webkit-slider-thumb]:h-6
                                    [&::-webkit-slider-thumb]:bg-[#9C3]
                                    [&::-webkit-slider-thumb]:border-4
                                    [&::-webkit-slider-thumb]:border-white
                                    [&::-webkit-slider-thumb]:rounded-full
                                    [&::-webkit-slider-thumb]:shadow-md
                                    [&::-webkit-slider-thumb]:cursor-pointer
                                    [&::-moz-range-thumb]:w-6
                                    [&::-moz-range-thumb]:h-6
                                    [&::-moz-range-thumb]:bg-[#9C3]
                                    [&::-moz-range-thumb]:border-4
                                    [&::-moz-range-thumb]:border-white
                                    [&::-moz-range-thumb]:rounded-full
                                    [&::-moz-range-thumb]:shadow-md
                                    [&::-moz-range-thumb]:cursor-pointer"
                        />
                        <div className="flex justify-between mt-2">
                            {BUDGET_MARKS.map((mark) => (
                                <span
                                    key={mark.value}
                                    className="text-xs text-[#64748B]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {mark.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Step 5: Review ───────────────────────────────────── */}
            {step === 5 && (
                <div className="flex flex-col gap-4">
                    {/* Family */}
                    <div className="bg-white lg:bg-[#f8fafc] rounded-3xl p-5 border border-[#e2e8f0]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                    Planning for
                                </p>
                                <p className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {SCOPE_OPTIONS.find((o) => o.value === familyScope)?.label}
                                </p>
                            </div>
                            <button onClick={() => setStep(1)} className="text-xs font-semibold text-[#538100] hover:underline">
                                Edit
                            </button>
                        </div>
                    </div>

                    {/* Diet */}
                    <div className="bg-white lg:bg-[#f8fafc] rounded-3xl p-5 border border-[#e2e8f0]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                    Dietary Preference
                                </p>
                                <p className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {DIETARY_OPTIONS.find((o) => o.value === dietaryPref)?.label}
                                </p>
                            </div>
                            <button onClick={() => setStep(2)} className="text-xs font-semibold text-[#538100] hover:underline">
                                Edit
                            </button>
                        </div>
                    </div>

                    {/* Goal */}
                    <div className="bg-white lg:bg-[#f8fafc] rounded-3xl p-5 border border-[#e2e8f0]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                    Main Goal
                                </p>
                                <p className="text-base font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                    {GOAL_OPTIONS.find((o) => o.value === goal)?.label}
                                </p>
                            </div>
                            <button onClick={() => setStep(3)} className="text-xs font-semibold text-[#538100] hover:underline">
                                Edit
                            </button>
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-white lg:bg-[#f8fafc] rounded-3xl p-5 border border-[#e2e8f0]">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                    Weekly Budget
                                </p>
                                <p className="text-base font-bold text-[#9C3]" style={{ fontFamily: "Inter, sans-serif" }}>
                                    ${budget}
                                </p>
                            </div>
                            <button onClick={() => setStep(4)} className="text-xs font-semibold text-[#538100] hover:underline">
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-[#f7f8f6] flex flex-col">
            {/* ══════════════════════════════════════════════════════════
                MOBILE LAYOUT (< lg)
               ══════════════════════════════════════════════════════════ */}
            <div className="lg:hidden flex flex-col min-h-screen">
                {/* ── Mobile Header ──────────────────────────────────── */}
                <div className="backdrop-blur-md bg-[rgba(247,248,246,0.8)] shrink-0 w-full z-10">
                    <div className="flex items-center justify-between p-4 max-w-[500px] mx-auto w-full">
                        <button
                            onClick={goBack}
                            className="flex items-center justify-center w-12 h-12 rounded-full"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-[17px] h-[17px] text-[#0F172A]" />
                        </button>
                        <h1
                            className="flex-1 text-center text-lg font-bold text-[#0F172A] tracking-[-0.27px]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Meal Preferences
                        </h1>
                        <div className="w-12" />
                    </div>

                    {/* Mobile Progress Bar */}
                    <div className="flex flex-col gap-2 px-6 pb-4 max-w-[500px] mx-auto w-full">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                Step {step} of {TOTAL_STEPS}
                            </span>
                            <span className="text-sm font-bold text-[#9C3]" style={{ fontFamily: "Inter, sans-serif" }}>
                                {progress}%
                            </span>
                        </div>
                        <div className="h-2 bg-[rgba(153,204,51,0.2)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[#9C3] rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Mobile Content ─────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-6 pb-[200px] max-w-[500px] mx-auto w-full">
                    <div className="pt-4 pb-6">
                        <h2
                            className="text-[30px] font-bold text-[#0F172A] tracking-[-0.75px] leading-[36px]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {current.hero}
                        </h2>
                        <p
                            className="mt-2 text-base text-[#475569] leading-[26px]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {current.sub}
                        </p>
                    </div>
                    {stepContent}
                </div>

                {/* ── Mobile Fixed Footer CTA ──────────────────────────── */}
                <div className="fixed bottom-[80px] left-0 right-0 z-20 pointer-events-none">
                    <div className="bg-gradient-to-t from-[#f7f8f6] via-[#f7f8f6] to-transparent px-6 pt-4 pb-4 max-w-[500px] mx-auto pointer-events-auto">
                        {ctaButton}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                DESKTOP LAYOUT (≥ lg)
               ══════════════════════════════════════════════════════════ */}
            <div className="hidden lg:flex flex-1 items-start justify-center py-10 px-8">
                <div className="flex w-full max-w-[960px] gap-8">

                    {/* ── Left Panel: Step Indicator ─────────────────────── */}
                    <div className="w-[300px] shrink-0">
                        <div className="bg-[#1e293b] rounded-3xl p-8 sticky top-10">
                            {/* Title */}
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-full bg-[#9C3] flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                                        Meal Preferences
                                    </h2>
                                    <p className="text-xs text-slate-400" style={{ fontFamily: "Inter, sans-serif" }}>
                                        Step {step} of {TOTAL_STEPS}
                                    </p>
                                </div>
                            </div>

                            {/* Steps */}
                            <div className="flex flex-col">
                                {STEP_LABELS.map((s, idx) => {
                                    const stepNum = idx + 1;
                                    const isCompleted = step > stepNum;
                                    const isActive = step === stepNum;
                                    const isUpcoming = step < stepNum;
                                    const StepIcon = s.icon;

                                    return (
                                        <div key={stepNum} className="flex items-start gap-4">
                                            {/* Dot + Line */}
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => isCompleted && setStep(stepNum)}
                                                    disabled={!isCompleted}
                                                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${isCompleted
                                                            ? "bg-[#9C3] cursor-pointer hover:brightness-110"
                                                            : isActive
                                                                ? "bg-[#9C3] ring-4 ring-[rgba(153,204,51,0.3)]"
                                                                : "bg-slate-600"
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <Check className="w-5 h-5 text-white" />
                                                    ) : (
                                                        <StepIcon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                                                    )}
                                                </button>
                                                {stepNum < TOTAL_STEPS && (
                                                    <div className={`w-0.5 h-8 my-1 rounded-full ${isCompleted ? "bg-[#9C3]" : "bg-slate-600"
                                                        }`} />
                                                )}
                                            </div>

                                            {/* Label */}
                                            <div className="pt-2.5">
                                                <p className={`text-sm font-semibold leading-tight ${isActive
                                                        ? "text-white"
                                                        : isCompleted
                                                            ? "text-slate-300"
                                                            : "text-slate-500"
                                                    }`} style={{ fontFamily: "Inter, sans-serif" }}>
                                                    {s.label}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Decorative bottom area */}
                            <div className="mt-10 pt-6 border-t border-slate-700">
                                <p className="text-xs text-slate-500 leading-relaxed" style={{ fontFamily: "Inter, sans-serif" }}>
                                    Your preferences help our AI create a personalized meal plan tailored to your lifestyle.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Panel: Content Card ──────────────────────── */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-3xl shadow-[0_4px_40px_rgba(0,0,0,0.06)] border border-[#f1f5f9] p-10">
                            {/* Back button row */}
                            <button
                                onClick={goBack}
                                className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors mb-6"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {step === 1 ? "Back to Meal Plan" : "Previous Step"}
                            </button>

                            {/* Hero Title */}
                            <div className="pb-8 border-b border-[#f1f5f9]">
                                <h2
                                    className="text-[28px] font-bold text-[#0F172A] tracking-[-0.5px] leading-[34px]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {current.hero}
                                </h2>
                                <p
                                    className="mt-2 text-base text-[#475569] leading-[26px]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {current.sub}
                                </p>
                            </div>

                            {/* Step Content */}
                            <div className="pt-8 pb-8">
                                {stepContent}
                            </div>

                            {/* Desktop CTA (inside card) */}
                            <div className="pt-6 border-t border-[#f1f5f9]">
                                <div className="max-w-[400px] ml-auto">
                                    {ctaButton}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
