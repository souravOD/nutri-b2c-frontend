"use client";

import { useState } from "react";
import { CheckCircle2, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import type { MealPlan } from "@/lib/types";

interface PlanRecommendationCardProps {
    plan: MealPlan;
    imageUrl?: string;
    totalMeals?: number;
    totalDays?: number;
    memberNames?: string[];
    onSelect: (planId: string) => void;
    onDelete?: (planId: string) => void;
    isLoading?: boolean;
    isDeleting?: boolean;
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
    memberNames,
    onSelect,
    onDelete,
    isLoading,
    isDeleting,
}: PlanRecommendationCardProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    const days = totalDays ?? (() => {
        const start = new Date(plan.startDate);
        const end = new Date(plan.endDate);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    })();

    const meals = totalMeals ?? (days * (plan.mealsPerDay?.length ?? 3));
    const cost = plan.totalEstimatedCost
        ? `$${Number(plan.totalEstimatedCost).toFixed(0)} Total`
        : null;

    const isDraft = plan.status === "draft";
    const isActive = plan.status === "active";
    const statusCfg = STATUS_CONFIG[plan.status] ?? STATUS_CONFIG.draft;

    return (
        <div
            className={`bg-white rounded-2xl overflow-hidden border shadow-sm transition-all ${isActive ? "border-[#99CC33]/40 ring-1 ring-[#99CC33]/20" : "border-slate-100"
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
                        {plan.planName || `Meal Plan ${plan.startDate} to ${plan.endDate}`}
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

                    {/* Delete Button */}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50"
                            aria-label="Delete plan"
                            title="Delete plan"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <p className="text-sm text-slate-500 mb-2">
                    {days} Days · {meals} Meals{cost ? ` · ${cost}` : ""}
                </p>

                {/* Member Badges */}
                {memberNames && memberNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {memberNames.map((name) => (
                            <span
                                key={name}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(153,204,51,0.1)] text-[11px] font-semibold text-[#538100]"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                <span className="w-4 h-4 rounded-full bg-[#99CC33] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                    {name[0]?.toUpperCase()}
                                </span>
                                {name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Delete Confirmation */}
                {confirmDelete && (
                    <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200">
                        <p className="text-sm text-red-700 font-medium mb-2">
                            Delete this plan? This cannot be undone.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    onDelete?.(plan.id);
                                    setConfirmDelete(false);
                                }}
                                disabled={isDeleting}
                                className="flex-1 py-2 text-sm font-bold text-white bg-red-500 rounded-full hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                {isDeleting ? "Deleting…" : "Yes, Delete"}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="flex-1 py-2 text-sm font-bold text-slate-600 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* CTAs — two buttons: View Plan + Select This Plan (draft only) */}
                <div className="flex gap-2">
                    {/* View Plan — always visible */}
                    <Link
                        href={`/meal-plan/weekly`}
                        className={`flex-1 py-3 flex items-center justify-center gap-2 font-bold text-[14px] rounded-full border-2 transition-colors ${isDraft
                            ? "border-[#99CC33] text-[#538100] hover:bg-[#f0f7e6]"
                            : "border-[#99CC33] bg-[#99CC33] text-[#0F172A] hover:bg-[#6B8F24]"
                            }`}
                    >
                        <Eye className="w-4 h-4" />
                        View Plan
                    </Link>

                    {/* Select This Plan — draft only */}
                    {isDraft && (
                        <button
                            onClick={() => onSelect(plan.id)}
                            disabled={isLoading}
                            className="flex-1 py-3 bg-[#99CC33] text-[#0F172A] font-bold text-[14px] rounded-full hover:bg-[#6B8F24] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? "Activating..." : "Select This Plan"}
                        </button>
                    )}

                    {/* Delete Plan — show when plan is active/completed (not draft) */}
                    {!isDraft && onDelete && (
                        <button
                            onClick={() => setConfirmDelete(true)}
                            disabled={isDeleting}
                            className="flex-1 py-3 flex items-center justify-center gap-2 text-red-500 font-bold text-[14px] rounded-full border-2 border-red-200 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Plan
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
