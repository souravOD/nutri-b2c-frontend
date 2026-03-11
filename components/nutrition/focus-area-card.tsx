"use client";

import type { NutrientGap, ConditionAlert } from "@/lib/types";
import { Droplets, Sun, AlertTriangle, TrendingDown, Flame } from "lucide-react";

// ── Icon Mapping ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, { icon: typeof Sun; color: string; bg: string }> = {
    vitaminD: { icon: Sun, color: "#F59E0B", bg: "#FFFBEB" },
    water: { icon: Droplets, color: "#3B82F6", bg: "#EFF6FF" },
    calcium: { icon: TrendingDown, color: "#8B5CF6", bg: "#F5F3FF" },
    iron: { icon: Flame, color: "#EF4444", bg: "#FEF2F2" },
    fiber: { icon: TrendingDown, color: "#10B981", bg: "#ECFDF5" },
    default: { icon: AlertTriangle, color: "#F59E0B", bg: "#FFFBEB" },
};

function getIconConfig(key: string) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
    for (const [mapKey, config] of Object.entries(ICON_MAP)) {
        if (normalized.includes(mapKey)) return config;
    }
    return ICON_MAP.default;
}

// ── Focus Area Card from NutrientGap ──────────────────────────────────────────

export function FocusAreaCardFromGap({ gap }: { gap: NutrientGap }) {
    const { icon: Icon, color, bg } = getIconConfig(gap.nutrient);
    const pct = Math.round(gap.percentOfTarget);

    return (
        <div
            className="flex items-start gap-3 rounded-2xl border border-[#F1F5F9] bg-white p-4"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
        >
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: bg }}
            >
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p
                    className="text-[14px] font-semibold text-[#0F172A] leading-5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    Low {gap.nutrient}
                </p>
                <p
                    className="text-[13px] font-normal text-[#64748B] leading-5 mt-0.5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    You&apos;re at {pct}% of your daily {gap.nutrient.toLowerCase()} goal.
                    Consider adding {gap.nutrient.toLowerCase()}-rich foods.
                </p>
            </div>
        </div>
    );
}

// ── Focus Area Card from ConditionAlert ───────────────────────────────────────

export function FocusAreaCardFromAlert({ alert }: { alert: ConditionAlert }) {
    const { icon: Icon, color, bg } = getIconConfig(alert.nutrient);

    return (
        <div
            className="flex items-start gap-3 rounded-2xl border border-[#F1F5F9] bg-white p-4"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
        >
            <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: bg }}
            >
                <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
                <p
                    className="text-[14px] font-semibold text-[#0F172A] leading-5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {alert.conditionName} — {alert.nutrient}
                </p>
                <p
                    className="text-[13px] font-normal text-[#64748B] leading-5 mt-0.5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {alert.message}
                </p>
            </div>
        </div>
    );
}
