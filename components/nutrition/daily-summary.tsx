"use client";

import { CalorieRing } from "@/components/home/calorie-ring";
import { MacroBar } from "@/components/home/macro-bar";
import type { NutritionDashboardDailyResponse } from "@/lib/types";

interface DailySummaryProps {
  daily: NutritionDashboardDailyResponse | null;
  isLoading?: boolean;
}

export function DailySummary({ daily, isLoading }: DailySummaryProps) {
  if (isLoading) {
    return (
      <section
        className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
        style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
      >
        <div className="h-40 animate-pulse rounded-2xl bg-[#F1F5F9]" />
      </section>
    );
  }

  if (!daily) {
    return (
      <section
        className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
        style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
      >
        <p className="text-[14px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
          No data for the selected day.
        </p>
      </section>
    );
  }

  const totals = daily.totals;
  const targets = daily.targets;

  return (
    <section
      className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
    >
      {/* Top row: progress label + ring */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span
            className="text-[12px] font-medium text-[#64748B] uppercase tracking-[0.7px] leading-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Daily Progress
          </span>
          <div className="flex items-end">
            <span
              className="text-[26px] font-bold text-[#0F172A] leading-8"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {Math.round(totals.calories).toLocaleString()}{" "}
            </span>
            <span
              className="text-[16px] font-normal text-[#94A3B8] leading-6"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              / {Math.round(targets.calories).toLocaleString()} kcal
            </span>
          </div>
        </div>
        <CalorieRing consumed={totals.calories} target={targets.calories} />
      </div>

      {/* Macro bars */}
      <div className="flex flex-col gap-3 mt-4">
        <MacroBar
          label="Protein"
          value={Number(totals.proteinG)}
          target={Number(targets.proteinG)}
          color="#99CC33"
        />
        <MacroBar
          label="Carbs"
          value={Number(totals.carbsG)}
          target={Number(targets.carbsG)}
          color="#60A5FA"
        />
        <MacroBar
          label="Fats"
          value={Number(totals.fatG)}
          target={Number(targets.fatG)}
          color="#FB923C"
        />
      </div>
    </section>
  );
}
