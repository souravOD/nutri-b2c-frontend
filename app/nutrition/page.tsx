"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";

// Nutrition components (restyled to Figma light theme)
import { DailySummary } from "@/components/nutrition/daily-summary";
import { MacroChart } from "@/components/nutrition/macro-chart";
import { NutrientGaps } from "@/components/nutrition/nutrient-gaps";
import { MemberCards } from "@/components/nutrition/member-cards";
import { HealthMetrics } from "@/components/nutrition/health-metrics";
import { FocusAreaCardFromGap, FocusAreaCardFromAlert } from "@/components/nutrition/focus-area-card";

// Shared components
import { QuickScanFAB } from "@/components/layout/quick-scan-fab";

import { useHouseholdMembers } from "@/hooks/use-household";
import { useSelectedMember } from "@/hooks/use-selected-member";
import {
  useNutritionDaily,
  useNutritionHealthMetrics,
  useNutritionMemberSummary,
  useNutritionWeekly,
} from "@/hooks/use-nutrition-dashboard";
import { useUser } from "@/hooks/use-user";

// ── Helpers ─────────────────────────────────────────────────────────────────

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

function toWeekStart(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  const diff = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function getDayLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return DAYS[((d.getDay() + 6) % 7)] ?? "";
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { user } = useUser();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  const { members } = useHouseholdMembers();
  const defaultMember = useMemo(
    () => members.find((m) => m.isProfileOwner) ?? members[0] ?? null,
    [members]
  );
  const { memberId, setMemberId } = useSelectedMember(defaultMember?.id);

  useEffect(() => {
    if (!memberId && defaultMember?.id) setMemberId(defaultMember.id);
  }, [memberId, defaultMember?.id, setMemberId]);

  const weekStart = useMemo(() => toWeekStart(date), [date]);

  const { daily, isLoading: dailyLoading } = useNutritionDaily({ date, memberId });
  const { weekly, isLoading: weeklyLoading } = useNutritionWeekly({ weekStart, memberId });
  const { summary } = useNutritionMemberSummary({ date });
  const { healthMetrics, isLoading: healthLoading } = useNutritionHealthMetrics({ memberId });

  // Weekly bar chart data
  const weeklyBarData = useMemo(() => {
    if (!weekly?.days) return DAYS.map((d) => ({ day: d, calories: 0 }));
    return weekly.days.map((d) => ({
      day: getDayLabel(d.date),
      calories: d.calories,
    }));
  }, [weekly]);

  // Focus areas: combination of nutrient gaps (low status) + condition alerts
  const focusGaps = useMemo(
    () => (daily?.nutrientGaps ?? []).filter((g) => g.status === "low").slice(0, 3),
    [daily]
  );
  const conditionAlerts = daily?.conditionAlerts ?? [];

  // Selected member name for header
  const selectedMemberName = useMemo(() => {
    if (!memberId) return "";
    const m = members.find((m) => m.id === memberId);
    return m?.firstName || m?.fullName || "";
  }, [memberId, members]);

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
      <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6">

        {/* ═══ Section 1: Header ═══════════════════════════════════════════ */}
        <header className="pt-6 pb-2">
          {/* Row 1: Title + controls (desktop: all inline, mobile: title + bell only) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#99CC33] flex items-center justify-center lg:hidden">
                <span className="text-white font-bold text-[16px]" style={{ fontFamily: "Inter, sans-serif" }}>N</span>
              </div>
              <h1
                className="text-[20px] lg:text-[28px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Nutrition
              </h1>
            </div>

            {/* Desktop: date + member inline with title */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              {members.length > 0 && (
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20 max-w-[180px] truncate"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName || m.fullName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Mobile: notification bell */}
            <Link href="/notifications" className="relative p-2 rounded-full lg:hidden" aria-label="Notifications">
              <Bell className="w-5 h-5 text-[#0F172A]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444]" />
            </Link>
          </div>

          {/* Row 2 (mobile only): date picker + member selector */}
          <div className="flex items-center gap-2 mt-3 lg:hidden">
            <div className="relative flex-1">
              <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {members.length > 0 && (
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="h-9 px-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20 flex-1 truncate"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName || m.fullName}
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* ═══ Section 2: Greeting ═════════════════════════════════════════ */}
        <section className="pt-1 pb-4">
          <h2
            className="text-[20px] lg:text-[24px] font-bold text-[#0F172A] leading-7"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            How is my nutrition looking?
          </h2>
          <p
            className="text-[14px] font-normal text-[#64748B] leading-5 mt-1"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Based on your activity and logs today, {firstName}
          </p>
        </section>

        {/* ═══ Section 3 + 4: Daily Progress + Macro Split ════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailySummary daily={daily} isLoading={dailyLoading} />
          <MacroChart daily={daily} />
        </div>

        {/* ═══ Section 5: Focus Areas Today ═══════════════════════════════ */}
        {(focusGaps.length > 0 || conditionAlerts.length > 0) && (
          <section className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-[16px] font-bold text-[#0F172A] leading-6"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Focus Areas Today
              </h3>
              <button
                type="button"
                className="text-[13px] font-semibold text-[#538100] leading-5"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                View All
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {focusGaps.map((gap) => (
                <FocusAreaCardFromGap key={gap.key} gap={gap} />
              ))}
              {conditionAlerts.slice(0, 2).map((alert, idx) => (
                <FocusAreaCardFromAlert key={`${alert.conditionName}-${idx}`} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* ═══ Section 6 + 7: Nutrient Gaps + Weekly Performance ═════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Nutrient Gaps */}
          <NutrientGaps gaps={daily?.nutrientGaps ?? weekly?.nutrientGaps ?? []} />

          {/* Weekly Performance */}
          <section
            className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-[14px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Weekly Performance
              </h3>
              <span
                className="text-[12px] font-normal text-[#94A3B8]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Last 7 days
              </span>
            </div>
            {weeklyLoading ? (
              <div className="h-40 animate-pulse rounded-xl bg-[#F1F5F9]" />
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyBarData} barSize={28}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "Inter, sans-serif" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => [`${value} kcal`, "Calories"]}
                    contentStyle={{
                      borderRadius: 12,
                      fontSize: 12,
                      fontFamily: "Inter, sans-serif",
                      border: "1px solid #F1F5F9",
                    }}
                  />
                  <Bar dataKey="calories" radius={[8, 8, 0, 0]}>
                    {weeklyBarData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.day === getDayLabel(today) ? "#538100" : "#D4E8A8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </section>
        </div>

        {/* ═══ Section 8: Household Summary ══════════════════════════════ */}
        <div className="mt-6">
          <MemberCards summary={summary} />
        </div>

        {/* ═══ Section 9: Health Metrics ═════════════════════════════════ */}
        <div className="mt-6">
          <HealthMetrics metrics={healthMetrics} isLoading={healthLoading} />
        </div>

      </div>

      {/* Floating scan FAB (mobile only) */}
      <div className="lg:hidden">
        <QuickScanFAB />
      </div>
    </div>
  );
}
