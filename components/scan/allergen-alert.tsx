"use client";

import { AlertTriangle, ShieldAlert } from "lucide-react";

interface AllergenAlertProps {
    warnings: {
        allergenName: string;
        severity: string | null;
        memberName: string;
        message: string;
    }[];
}

/**
 * Allergen warning banner for scan result page.
 * Shows a warning for each family member affected.
 */
export function AllergenAlert({ warnings }: AllergenAlertProps) {
    if (!warnings.length) return null;

    // Group by member
    const memberMap = new Map<string, { allergens: string[]; severity: string | null }>();
    for (const w of warnings) {
        const existing = memberMap.get(w.memberName);
        if (existing) {
            existing.allergens.push(w.allergenName);
        } else {
            memberMap.set(w.memberName, { allergens: [w.allergenName], severity: w.severity });
        }
    }

    const isCritical = warnings.some((w) => w.severity === "severe" || w.severity === "critical");

    return (
        <div
            className={`rounded-2xl p-4 ${isCritical
                    ? "bg-[#FEF2F2] border border-[#FCA5A5]"
                    : "bg-[#FFF7ED] border border-[#FDBA74]"
                }`}
        >
            <div className="flex items-start gap-3">
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCritical ? "bg-[#FCA5A5]/30" : "bg-[#FDBA74]/30"
                        }`}
                >
                    {isCritical ? (
                        <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-[#EA580C]" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p
                        className={`text-[14px] font-bold leading-5 ${isCritical ? "text-[#DC2626]" : "text-[#EA580C]"
                            }`}
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {isCritical ? "⚠️ Allergen Alert" : "⚠️ Allergen Warning"}
                    </p>
                    {Array.from(memberMap.entries()).map(([member, { allergens }]) => (
                        <p
                            key={member}
                            className="text-[13px] font-normal text-[#78350F] leading-5 mt-1"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            <span className="font-semibold">{member}</span>: Contains {allergens.join(", ")}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
}
