"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, AlertCircle } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useBetaFeedback } from "@/hooks/use-beta-feedback";
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
import { NutritionFeedbackSheet } from "@/components/feedback/nutrition-feedback-sheet";

import { useHouseholdMembers } from "@/hooks/use-household";
import { useSelectedMember } from "@/hooks/use-selected-member";
import {
  useNutritionDaily,
  useNutritionHealthMetrics,
  useNutritionMemberSummary,
  useNutritionMonthly,
  useNutritionRange,
  useNutritionWeekly,
} from "@/hooks/use-nutrition-dashboard";
import { useUser } from "@/hooks/use-user";

// ── Types ────────────────────────────────────────────────────────────────────

type NutritionViewMode = "daily" | "weekly" | "monthly" | "custom";

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

function getShortDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return `${d.getDate()}`;
}

function getWeekLabel(weekIndex: number): string {
  return `W${weekIndex + 1}`;
}

/** Compute days between two YYYY-MM-DD strings (inclusive). */
function daysBetween(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00.000Z`).getTime() - new Date(`${start}T00:00:00.000Z`).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** Group daily data into weekly averages for monthly toggle. */
function groupByWeek(days: Array<{ date: string; calories: number }>) {
  const weeks: Array<{ label: string; calories: number }> = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const avg = chunk.reduce((sum, d) => sum + d.calories, 0) / chunk.length;
    weeks.push({ label: getWeekLabel(weeks.length), calories: Math.round(avg) });
  }
  return weeks;
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [mode, setMode] = useState<NutritionViewMode>("daily");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [monthlyChartView, setMonthlyChartView] = useState<"days" | "weeks">("days");

  const { user } = useUser();
  const { data: unreadCount = 0 } = useUnreadCount();
  const firstName = user?.name?.split(" ")[0] ?? "there";

  // Beta feedback — trigger after 3s on daily mode
  const nutritionFeedback = useBetaFeedback("nutrition", {
    delay: 3000,
    enabled: mode === "daily",
  });

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
  const currentMonth = useMemo(() => date.slice(0, 7), [date]);

  // ── Range validation (6-month max) ──
  const rangeError = useMemo(() => {
    if (!customStartDate || !customEndDate) return "";
    if (customStartDate > customEndDate) return "Start date must be before end date";
    const days = daysBetween(customStartDate, customEndDate);
    if (days > 180) return "Range cannot exceed 6 months (180 days)";
    return "";
  }, [customStartDate, customEndDate]);

  // ── Data hooks (only fetch for active mode) ──
  const { daily, isLoading: dailyLoading } = useNutritionDaily({ date, memberId });
  const { weekly, isLoading: weeklyLoading } = useNutritionWeekly({
    weekStart: mode === "weekly" ? weekStart : undefined,
    memberId,
  });
  const { monthly, isLoading: monthlyLoading } = useNutritionMonthly({
    month: mode === "monthly" ? currentMonth : undefined,
    memberId,
  });
  const { rangeData, isLoading: rangeLoading } = useNutritionRange({
    startDate: mode === "custom" && !rangeError ? customStartDate : undefined,
    endDate: mode === "custom" && !rangeError ? customEndDate : undefined,
    memberId,
  });
  const { summary } = useNutritionMemberSummary({ date });
  const { healthMetrics, isLoading: healthLoading } = useNutritionHealthMetrics({ memberId });

  // ── Chart data ──
  const weeklyBarData = useMemo(() => {
    if (!weekly?.days) return DAYS.map((d) => ({ day: d, calories: 0 }));
    return weekly.days.map((d) => ({
      day: getDayLabel(d.date),
      calories: d.calories,
    }));
  }, [weekly]);

  const monthlyChartData = useMemo(() => {
    if (!monthly?.days) return [];
    if (monthlyChartView === "weeks") {
      return groupByWeek(monthly.days);
    }
    return monthly.days.map((d) => ({
      label: getShortDateLabel(d.date),
      calories: d.calories,
    }));
  }, [monthly, monthlyChartView]);

  const customChartData = useMemo(() => {
    if (!rangeData?.days) return [];
    // For ranges > 60 days, group by week for readability
    if (rangeData.days.length > 60) {
      return groupByWeek(rangeData.days);
    }
    return rangeData.days.map((d) => ({
      label: getShortDateLabel(d.date),
      calories: d.calories,
    }));
  }, [rangeData]);

  // ── Focus areas ──
  const focusGaps = useMemo(
    () => (daily?.nutrientGaps ?? []).filter((g) => g.status === "low").slice(0, 3),
    [daily]
  );
  const conditionAlerts = daily?.conditionAlerts ?? [];

  // ── Active nutrient gaps (per mode) ──
  const activeNutrientGaps = useMemo(() => {
    switch (mode) {
      case "daily": return daily?.nutrientGaps ?? [];
      case "weekly": return weekly?.nutrientGaps ?? [];
      case "monthly": return monthly?.nutrientGaps ?? [];
      case "custom": return rangeData?.nutrientGaps ?? [];
      default: return [];
    }
  }, [mode, daily, weekly, monthly, rangeData]);

  // ── Active compliance ──
  const activeCompliance = useMemo(() => {
    switch (mode) {
      case "weekly": return weekly?.compliance ?? null;
      case "monthly": return monthly?.compliance ?? null;
      case "custom": return rangeData?.compliance ?? null;
      default: return null;
    }
  }, [mode, weekly, monthly, rangeData]);

  // ── Active averages ──
  const activeAverages = useMemo(() => {
    switch (mode) {
      case "weekly": return weekly?.averages ?? null;
      case "monthly": return monthly?.averages ?? null;
      case "custom": return rangeData?.averages ?? null;
      default: return null;
    }
  }, [mode, weekly, monthly, rangeData]);

  // ── Check if a multi-day view is loading ──
  const chartLoading = mode === "weekly" ? weeklyLoading : mode === "monthly" ? monthlyLoading : mode === "custom" ? rangeLoading : false;

  // ── Chart section title ──
  const chartTitle = useMemo(() => {
    switch (mode) {
      case "weekly": return "Weekly Performance";
      case "monthly": return "Monthly Performance";
      case "custom": return "Custom Range Performance";
      default: return "Weekly Performance";
    }
  }, [mode]);

  const chartSubtitle = useMemo(() => {
    switch (mode) {
      case "weekly": return "Last 7 days";
      case "monthly": {
        const d = new Date(`${currentMonth}-01T00:00:00`);
        return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      }
      case "custom":
        return customStartDate && customEndDate
          ? `${customStartDate} → ${customEndDate}`
          : "Select dates";
      default: return "Last 7 days";
    }
  }, [mode, currentMonth, customStartDate, customEndDate]);

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
              {/* Date input — show based on mode */}
              {mode === "daily" && (
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
              )}
              {mode === "weekly" && (
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
              )}
              {mode === "monthly" && (
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                  <input
                    type="month"
                    value={currentMonth}
                    onChange={(e) => setDate(`${e.target.value}-01`)}
                    className="h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>
              )}
              {mode === "custom" && (
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      placeholder="Start"
                    />
                  </div>
                  <span className="text-[12px] text-[#94A3B8]">→</span>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                      style={{ fontFamily: "Inter, sans-serif" }}
                      placeholder="End"
                    />
                  </div>
                </div>
              )}
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
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#EF4444] border-2 border-[#F7F8F6]" />
              )}
            </Link>
          </div>

          {/* Row 2 (mobile only): date picker + member selector */}
          <div className="flex items-center gap-2 mt-3 lg:hidden">
            {(mode === "daily" || mode === "weekly") && (
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
            )}
            {mode === "monthly" && (
              <div className="relative flex-1">
                <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] pointer-events-none" />
                <input
                  type="month"
                  value={currentMonth}
                  onChange={(e) => setDate(`${e.target.value}-01`)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
            )}
            {mode === "custom" && (
              <div className="flex items-center gap-1.5 flex-1">
                <div className="relative flex-1">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full h-9 pl-8 pr-2 rounded-xl border border-[#E2E8F0] bg-white text-[12px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>
                <span className="text-[11px] text-[#94A3B8]">→</span>
                <div className="relative flex-1">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full h-9 pl-8 pr-2 rounded-xl border border-[#E2E8F0] bg-white text-[12px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  />
                </div>
              </div>
            )}
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

          {/* Inline range error */}
          {mode === "custom" && rangeError && (
            <div className="flex items-center gap-1.5 mt-2 px-1">
              <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] flex-shrink-0" />
              <span
                className="text-[12px] text-[#EF4444] font-medium"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {rangeError}
              </span>
            </div>
          )}

          {/* ═══ Mode Selector Tabs ═══════════════════════════════════════ */}
          <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl mt-3">
            {(["daily", "weekly", "monthly", "custom"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2 px-2 lg:px-3 rounded-lg text-[12px] lg:text-[13px] font-medium transition-all ${mode === m
                  ? "bg-[#538100] text-white shadow-sm"
                  : "text-[#64748B] hover:bg-white/50"
                  }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {m === "custom" ? "Custom" : m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
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
            {mode === "daily"
              ? `Based on your activity and logs today, ${firstName}`
              : mode === "weekly"
                ? `Your weekly nutrition summary, ${firstName}`
                : mode === "monthly"
                  ? `Your monthly nutrition overview, ${firstName}`
                  : `Custom range analysis, ${firstName}`}
          </p>
        </section>

        {/* ═══ Section 3 + 4: Daily Progress + Macro Split (daily mode) ═══ */}
        {mode === "daily" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DailySummary daily={daily} isLoading={dailyLoading} />
            <MacroChart daily={daily} />
          </div>
        )}

        {/* ═══ Averages Summary (non-daily modes) ════════════════════════ */}
        {mode !== "daily" && activeAverages && (
          <section
            className="bg-white rounded-[24px] border border-[#F1F5F9] p-5 mb-4"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
          >
            <h3
              className="text-[14px] font-bold text-[#0F172A] mb-3"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Daily Averages
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: "Calories", value: `${Math.round(activeAverages.calories)}`, unit: "kcal" },
                { label: "Protein", value: `${Math.round(activeAverages.proteinG)}`, unit: "g" },
                { label: "Carbs", value: `${Math.round(activeAverages.carbsG)}`, unit: "g" },
                { label: "Fat", value: `${Math.round(activeAverages.fatG)}`, unit: "g" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#F7F8F6] rounded-2xl px-4 py-3 text-center"
                >
                  <p
                    className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wide"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-[22px] lg:text-[26px] font-bold text-[#0F172A] mt-0.5"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {item.value}
                    <span className="text-[12px] font-normal text-[#94A3B8] ml-0.5">
                      {item.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>
            {/* Compliance row */}
            {activeCompliance && (
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#99CC33]" />
                  <span
                    className="text-[12px] text-[#64748B]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {activeCompliance.loggedDays} day{activeCompliance.loggedDays !== 1 ? "s" : ""} logged
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#538100]" />
                  <span
                    className="text-[12px] text-[#64748B]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {activeCompliance.calorieGoalDays} day{activeCompliance.calorieGoalDays !== 1 ? "s" : ""} on target ({activeCompliance.calorieGoalPct}%)
                  </span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══ Section 5: Focus Areas Today (daily mode only) ══════════ */}
        {mode === "daily" && (focusGaps.length > 0 || conditionAlerts.length > 0) && (
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

        {/* ═══ Section 6 + 7: Nutrient Gaps + Performance Chart ════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          {/* Nutrient Gaps */}
          <NutrientGaps gaps={activeNutrientGaps} />

          {/* Performance Chart */}
          <section
            className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-[14px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                {chartTitle}
              </h3>
              <div className="flex items-center gap-2">
                {/* Monthly toggle: Daily Bars ↔ Weekly Groups */}
                {mode === "monthly" && (
                  <div className="flex bg-[#F1F5F9] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setMonthlyChartView("days")}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${monthlyChartView === "days"
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#94A3B8]"
                        }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setMonthlyChartView("weeks")}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${monthlyChartView === "weeks"
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-[#94A3B8]"
                        }`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Weeks
                    </button>
                  </div>
                )}
                <span
                  className="text-[12px] font-normal text-[#94A3B8]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {chartSubtitle}
                </span>
              </div>
            </div>

            {chartLoading ? (
              <div className="h-40 animate-pulse rounded-xl bg-[#F1F5F9]" />
            ) : mode === "daily" ? (
              /* Daily mode: show the weekly chart for context */
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
            ) : mode === "weekly" ? (
              /* Weekly mode: 7-day bar chart */
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
            ) : mode === "monthly" ? (
              /* Monthly mode: daily bars or weekly groups */
              <div className={monthlyChartView === "days" && monthlyChartData.length > 20 ? "overflow-x-auto -mx-2 px-2" : ""}>
                <div style={{ minWidth: monthlyChartView === "days" && monthlyChartData.length > 20 ? monthlyChartData.length * 20 : "100%" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={monthlyChartData} barSize={monthlyChartView === "weeks" ? 40 : 12}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: monthlyChartView === "days" ? 9 : 11, fill: "#94A3B8", fontFamily: "Inter, sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        interval={monthlyChartView === "days" ? 3 : 0}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(value: number) => [`${value} kcal`, monthlyChartView === "days" ? "Calories" : "Avg Calories"]}
                        contentStyle={{
                          borderRadius: 12,
                          fontSize: 12,
                          fontFamily: "Inter, sans-serif",
                          border: "1px solid #F1F5F9",
                        }}
                      />
                      <Bar dataKey="calories" radius={[6, 6, 0, 0]} fill="#99CC33">
                        {monthlyChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#538100" : "#99CC33"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : mode === "custom" && customChartData.length > 0 ? (
              /* Custom range mode */
              <div className={customChartData.length > 20 ? "overflow-x-auto -mx-2 px-2" : ""}>
                <div style={{ minWidth: customChartData.length > 20 ? customChartData.length * 20 : "100%" }}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={customChartData} barSize={customChartData.length > 30 ? 10 : 16}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 9, fill: "#94A3B8", fontFamily: "Inter, sans-serif" }}
                        axisLine={false}
                        tickLine={false}
                        interval={customChartData.length > 30 ? 6 : 2}
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
                      <Bar dataKey="calories" radius={[6, 6, 0, 0]} fill="#99CC33">
                        {customChartData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#538100" : "#D4E8A8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : mode === "custom" ? (
              /* Custom mode: no dates selected yet */
              <div className="h-40 flex items-center justify-center text-[13px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                Select start and end dates to view chart
              </div>
            ) : null}
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

      {/* ═══ Beta Feedback ════════════════════════════════════════════════ */}
      <NutritionFeedbackSheet
        open={nutritionFeedback.show}
        onOpenChange={nutritionFeedback.setShow}
        onSubmit={nutritionFeedback.submit}
        onDismiss={nutritionFeedback.dismiss}
      />
    </div>
  );
}
