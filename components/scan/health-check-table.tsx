"use client";

import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

interface HealthCheckTableProps {
    warnings: {
        conditionName: string;
        nutrient: string;
        value: number;
        message: string;
    }[];
    /** All active health conditions for the member, used to show "Safe" for conditions with no warnings */
    memberConditions?: string[];
}

type StatusLevel = "safe" | "moderate" | "warning";

function getStatus(warning: HealthCheckTableProps["warnings"][0] | null): StatusLevel {
    if (!warning) return "safe";
    // Simple heuristic: if the nutrient value is exceptionally high, mark as warning
    // Otherwise moderate
    const { nutrient, value } = warning;
    const n = nutrient.toLowerCase();
    if (n.includes("sodium") && value > 900) return "warning";
    if (n.includes("sugar") && value > 25) return "warning";
    if (n.includes("saturated") && value > 8) return "warning";
    if (n.includes("cholesterol") && value > 100) return "warning";
    return "moderate";
}

const STATUS_CONFIG: Record<StatusLevel, { icon: typeof ShieldCheck; color: string; bg: string; label: string }> = {
    safe: { icon: ShieldCheck, color: "#059669", bg: "bg-[#ECFDF5]", label: "Safe" },
    moderate: { icon: AlertTriangle, color: "#D97706", bg: "bg-[#FFFBEB]", label: "Moderate" },
    warning: { icon: XCircle, color: "#DC2626", bg: "bg-[#FEF2F2]", label: "Warning" },
};

/**
 * Health condition check table for scan result page.
 * Rows show each condition with Safe/Moderate/Warning status.
 */
export function HealthCheckTable({ warnings, memberConditions = [] }: HealthCheckTableProps) {
    // Build rows: one per unique condition
    const conditionSet = new Set<string>();
    const warningByCondition = new Map<string, HealthCheckTableProps["warnings"][0]>();

    for (const w of warnings) {
        conditionSet.add(w.conditionName);
        warningByCondition.set(w.conditionName, w);
    }

    // Add member conditions with no warnings as "safe"
    for (const cond of memberConditions) {
        conditionSet.add(cond);
    }

    const conditions = Array.from(conditionSet);
    if (!conditions.length) return null;

    return (
        <section>
            <h3
                className="text-[14px] font-bold text-[#0F172A] mb-2.5"
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                Health Condition Check
            </h3>
            <div className="divide-y divide-[#F1F5F9] rounded-2xl border border-[#F1F5F9] bg-white overflow-hidden">
                {conditions.map((condition) => {
                    const warning = warningByCondition.get(condition) ?? null;
                    const status = getStatus(warning);
                    const config = STATUS_CONFIG[status];
                    const Icon = config.icon;

                    return (
                        <div key={condition} className="flex items-center justify-between px-4 py-3">
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-[14px] font-medium text-[#0F172A] leading-5"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {condition}
                                </p>
                                {warning && (
                                    <p
                                        className="text-[12px] font-normal text-[#64748B] leading-4 mt-0.5"
                                        style={{ fontFamily: "Inter, sans-serif" }}
                                    >
                                        {warning.nutrient}: {warning.value}
                                        {warning.nutrient.toLowerCase().includes("mg") ? "" : warning.nutrient.toLowerCase().includes("sodium") ? "mg" : "g"}
                                    </p>
                                )}
                            </div>
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold ${config.bg}`}
                                style={{ color: config.color, fontFamily: "Inter, sans-serif" }}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {config.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
