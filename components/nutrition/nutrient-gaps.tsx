"use client";

import type { NutrientGap } from "@/lib/types";

interface NutrientGapsProps {
  gaps: NutrientGap[];
}

function statusColor(status: "ok" | "low" | "high") {
  if (status === "low") return { bg: "#FEF2F2", text: "#DC2626" };
  if (status === "high") return { bg: "#FFFBEB", text: "#D97706" };
  return { bg: "#F0FDF4", text: "#16A34A" };
}

export function NutrientGaps({ gaps }: NutrientGapsProps) {
  const top = gaps.slice(0, 8);

  return (
    <section
      className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
    >
      <h3
        className="text-[14px] font-bold text-[#0F172A] mb-3"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Nutrient Gaps
      </h3>

      {top.length === 0 ? (
        <p className="text-[14px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
          No nutrient gap data available.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {top.map((gap) => {
            const color = statusColor(gap.status);
            const pct = Math.round(gap.percentOfTarget);
            return (
              <div
                key={gap.key}
                className="flex items-center justify-between rounded-2xl border border-[#F1F5F9] p-3"
              >
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-[14px] font-semibold text-[#0F172A]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {gap.nutrient}
                  </span>
                  <span
                    className="text-[12px] text-[#94A3B8]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {Math.round(gap.intake)} / {Math.round(gap.target)} {gap.unit}
                  </span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[12px] font-bold shrink-0"
                  style={{ background: color.bg, color: color.text }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
