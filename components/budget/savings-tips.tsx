"use client";

import { AlertCircle, Info, Lightbulb } from "lucide-react";
import type { BudgetRecommendation } from "@/lib/types";

interface SavingsTipsProps {
  tips: BudgetRecommendation[];
  source: "rules" | "hybrid" | null;
}

const SEVERITY_CONFIG: Record<string, { icon: React.ReactNode; bg: string; border: string; text: string }> = {
  critical: {
    icon: <AlertCircle className="h-4 w-4 text-[#EF4444]" />,
    bg: "bg-[#FEF2F2]",
    border: "border-[#FECACA]",
    text: "text-[#EF4444]",
  },
  warning: {
    icon: <Lightbulb className="h-4 w-4 text-[#F59E0B]" />,
    bg: "bg-[#FFFBEB]",
    border: "border-[#FDE68A]",
    text: "text-[#D97706]",
  },
  info: {
    icon: <Info className="h-4 w-4 text-[#0EA5E9]" />,
    bg: "bg-[#F0F9FF]",
    border: "border-[#BAE6FD]",
    text: "text-[#0284C7]",
  },
};

export function SavingsTips({ tips, source }: SavingsTipsProps) {
  if (tips.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3
          className="text-[16px] lg:text-[18px] font-semibold text-[#0F172A]"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          AI Savings Tips
        </h3>
        {source && (
          <span
            className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] rounded-full px-2 py-0.5"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {source === "hybrid" ? "Rules + AI" : "Rules"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {tips.slice(0, 4).map((tip) => {
          const config = SEVERITY_CONFIG[tip.severity] ?? SEVERITY_CONFIG.info;
          return (
            <div
              key={tip.id}
              className={`${config.bg} ${config.border} border rounded-[14px] p-3.5`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                    {tip.title}
                  </p>
                  <p className="text-[12px] text-[#64748B] mt-0.5 leading-4" style={{ fontFamily: "Inter, sans-serif" }}>
                    {tip.description}
                  </p>
                  {tip.potentialSavings != null && (
                    <p className="text-[11px] font-medium text-[#538100] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                      Save ${tip.potentialSavings.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
