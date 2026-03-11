"use client";

import { CheckCircle2 } from "lucide-react";
import type { MealPlan } from "@/lib/types";

interface PlanRecommendationCardProps {
    plan: MealPlan;
    imageUrl?: string;
    totalMeals?: number;
    totalDays?: number;
    onSelect: (planId: string) => void;
    isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    active: { label: "Active", bg: "bg-[#f0f7e6]", text: "text-[#538100]", border: "border-[#538100]/30" },
    draft: { label: "Draft", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    completed: { label: "Completed", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    archived: { label: "Archived", bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" },
};

export function PlanRecommendationCard({
    plan,
    imageUrl,
    totalMeals,
    totalDays,
    onSelect,
    isLoading,
}: PlanRecommendationCardProps) {
    const days = totalDays ?? (() => {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    })();

    const meals = totalMeals ?? (days * (plan.mealsPerDay?.length ?? 3));
    const cost = plan.totalEstimatedCost
        ? `$${Number(plan.totalEstimatedCost).toFixed(0)} Total`
        : null;

    const isActive = plan.status === "active";
    const statusCfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft;

    return (
        <div
            className={`bg-white rounded-2xl overflow-hidden border shadow-sm transition-all ${isActive ? "border-[#538100]/40 ring-1 ring-[#538100]/20" : "border-slate-100"
                }`}
        >
            {/* Hero Image */}
            {imageUrl && (
                <div className="w-full h-48 bg-slate-100">
                    <img
                        src={imageUrl}
                        alt={plan.planName || "Meal Plan"}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="p-4">
                {/* Title + Badges */}
                <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-slate-900 flex-1 truncate">
                        {plan.planName || "AI Meal Plan"}
                    </h4>

                    {/* Status Badge */}
                    <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border} shrink-0 flex items-center gap-1`}
                    >
                        {isActive && <CheckCircle2 className="w-3 h-3" />}
                        {statusCfg.label}
                    </span>

                    {/* AI Pick Badge */}
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[rgba(153,204,51,0.15)] text-[#538100] rounded-full shrink-0">
                        AI Pick
                    </span>
                </div>

                {/* Stats */}
                <p className="text-sm text-slate-500 mb-4">
                    {days} Days · {meals} Meals{cost ? ` · ${cost}` : ""}
                </p>

                {/* CTA — changes based on status */}
                {isActive ? (
                    <div
                        className="w-full py-3 flex items-center justify-center gap-2 bg-[#f0f7e6] text-[#538100] font-bold text-base rounded-full border border-[#538100]/20"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Currently Active
                    </div>
                ) : (
                    <button
                        onClick={() => onSelect(plan.id)}
                        disabled={isLoading}
                        className="w-full py-3 bg-[#538100] text-white font-bold text-base rounded-full hover:bg-[#446d00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? "Activating..." : "Select This Plan"}
                    </button>
                )}
            </div>
        </div>
    );
}
