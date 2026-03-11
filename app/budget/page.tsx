"use client";

import { useState } from "react";
import { ArrowLeft, Lightbulb, Loader2, PiggyBank, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid,
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { useBudgetRecommendations, useBudgetSnapshot, useBudgetTrends, useCreateBudget, useUpdateBudget } from "@/hooks/use-budget";
import { BudgetRing } from "@/components/budget/budget-ring";
import { SavingsTips } from "@/components/budget/savings-tips";
import type { BudgetPeriod } from "@/lib/types";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function BudgetPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<BudgetPeriod>("weekly");

  const { snapshot, isLoading: snapshotLoading, error: snapshotError } = useBudgetSnapshot({ period });
  const { trends, isLoading: trendsLoading } = useBudgetTrends({ period, points: 12 });
  const { recommendations, isLoading: tipsLoading } = useBudgetRecommendations({ period });

  const budget = snapshot?.budget ?? null;
  const breakdown = snapshot?.breakdown ?? [];

  // Monthly breakdown chart data
  const chartData = (trends?.points ?? []).slice(-6).map((point) => ({
    label: new Date(`${point.startDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    spent: point.spent,
    budget: point.budgetAmount ?? null,
  }));

  if (snapshotLoading && !snapshot) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
        <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6 pt-8">
          <div className="flex items-center gap-2 text-[14px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
            <Loader2 className="h-4 w-4 animate-spin" /> Loading budget dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-[100px] lg:pb-10">
      <div className="w-full max-w-[600px] lg:max-w-[960px] mx-auto px-4 lg:px-6">

        {/* ═══ Header ══════════════════════════════════════════════════════ */}
        <header className="pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/grocery-list" className="lg:hidden">
                <div className="w-8 h-8 rounded-full bg-white border border-[#E2E8F0] flex items-center justify-center">
                  <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
                </div>
              </Link>
              <h1
                className="text-[20px] lg:text-[28px] font-bold text-[#0F172A]"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Budget Dashboard
              </h1>
            </div>

            {/* Period toggle */}
            <div className="flex items-center bg-white rounded-full border border-[#E2E8F0] p-0.5">
              {(["weekly", "monthly"] as BudgetPeriod[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors ${period === p
                      ? "bg-[#99CC33] text-white"
                      : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {p === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Error state */}
        {snapshotError && (
          <div className="bg-[#FEF2F2] rounded-[12px] border border-[#FECACA] p-3 mb-4">
            <p className="text-[13px] text-[#EF4444]" style={{ fontFamily: "Inter, sans-serif" }}>
              {getErrorMessage(snapshotError, "Unable to load budget data.")}
            </p>
          </div>
        )}

        {/* No budget → redirect to setup */}
        {!budget && (
          <section className="pt-4">
            <div
              className="bg-white rounded-[16px] border border-[#F1F5F9] p-8 text-center"
              style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
            >
              <div className="w-16 h-16 rounded-full bg-[#ECFCCB] flex items-center justify-center mx-auto mb-4">
                <PiggyBank className="w-8 h-8 text-[#538100]" />
              </div>
              <h3 className="text-[16px] font-semibold text-[#0F172A] mb-1" style={{ fontFamily: "Inter, sans-serif" }}>
                No Active Budget
              </h3>
              <p className="text-[13px] text-[#64748B] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                Set a grocery budget to start tracking your spending.
              </p>
              <Link
                href="/budget/setup"
                className="inline-flex h-10 px-6 rounded-full bg-[#99CC33] text-white text-[14px] font-medium hover:bg-[#88BB22] transition-colors items-center gap-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Set Budget
              </Link>
            </div>
          </section>
        )}

        {budget && (
          <>
            {/* ═══ AI Savings Tips ═══════════════════════════════════════════ */}
            <section className="pt-4">
              <SavingsTips tips={recommendations?.tips ?? []} source={recommendations?.source ?? null} />
            </section>

            {/* ═══ Ring + Budget Tracker ═════════════════════════════════════ */}
            <section className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Large spending ring */}
                <BudgetRing
                  spent={snapshot?.spent ?? 0}
                  budgetAmount={budget.amount}
                  remaining={snapshot?.remaining ?? null}
                  utilizationPct={snapshot?.utilizationPct ?? null}
                />

                {/* Budget tracker card */}
                <div
                  className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 lg:p-5"
                  style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <h3 className="text-[14px] font-medium text-[#64748B] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                    Spending Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#F7F8F6] rounded-[12px] p-3">
                      <p className="text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Spent</p>
                      <p className="text-[20px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                        ${(snapshot?.spent ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-[#F7F8F6] rounded-[12px] p-3">
                      <p className="text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Budget</p>
                      <p className="text-[20px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                        ${budget.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-[#F7F8F6] rounded-[12px] p-3">
                      <p className="text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Remaining</p>
                      <p className={`text-[20px] font-bold ${(snapshot?.remaining ?? 0) < 0 ? "text-[#EF4444]" : "text-[#538100]"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {snapshot?.remaining == null ? "-" : `$${Math.abs(snapshot.remaining).toFixed(2)}`}
                      </p>
                    </div>
                    <div className="bg-[#F7F8F6] rounded-[12px] p-3">
                      <p className="text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Period</p>
                      <p className="text-[20px] font-bold text-[#0F172A] capitalize" style={{ fontFamily: "Inter, sans-serif" }}>
                        {period}
                      </p>
                    </div>
                  </div>

                  {/* Plan vs actual (existing feature, preserved) */}
                  {snapshot?.planVsActual && (
                    <div className="mt-3 border-t border-[#F1F5F9] pt-3">
                      <p className="text-[12px] text-[#64748B] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>Plan vs Actual</p>
                      <div className="flex items-center gap-3 text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>
                        <span className="text-[#64748B]">Plan: <span className="font-medium text-[#0F172A]">${snapshot.planVsActual.estimated.toFixed(2)}</span></span>
                        <span className="text-[#64748B]">Actual: <span className="font-medium text-[#0F172A]">${snapshot.planVsActual.actual.toFixed(2)}</span></span>
                        <span className={snapshot.planVsActual.difference > 0 ? "text-[#EF4444] font-medium" : "text-[#538100] font-medium"}>
                          {snapshot.planVsActual.difference > 0 ? "+" : ""}${snapshot.planVsActual.difference.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Edit budget link */}
                  <Link
                    href="/budget/setup"
                    className="mt-3 inline-flex h-8 px-4 rounded-full border border-[#99CC33] text-[#538100] text-[13px] font-medium hover:bg-[#ECFCCB] transition-colors items-center"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Edit Budget
                  </Link>
                </div>
              </div>
            </section>

            {/* ═══ Monthly Breakdown + Category Spending ═════════════════════ */}
            <section className="pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Monthly Breakdown Bar Chart */}
                <div
                  className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 lg:p-5"
                  style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <h3 className="text-[14px] font-medium text-[#64748B] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                    Monthly Breakdown
                  </h3>
                  {chartData.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                      No trend data yet.
                    </p>
                  ) : (
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(value: number) => `$${Number(value).toFixed(2)}`} />
                          <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
                            {chartData.map((_, index) => (
                              <Cell key={index} fill={index === chartData.length - 1 ? "#99CC33" : "#CBD5E1"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Category Spending List */}
                <div
                  className="bg-white rounded-[16px] border border-[#F1F5F9] p-4 lg:p-5"
                  style={{ boxShadow: "0px 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <h3 className="text-[14px] font-medium text-[#64748B] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                    Category Spending
                  </h3>
                  {breakdown.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                      No spend data yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {breakdown.slice(0, 6).map((item) => {
                        const ICONS: Record<string, string> = {
                          Produce: "🥬", Dairy: "🧀", Pantry: "🫙", Meat: "🥩",
                          Frozen: "🧊", Bakery: "🍞", Beverages: "🥤", Snacks: "🍿",
                        };
                        return (
                          <div
                            key={item.category}
                            className="flex items-center justify-between py-2 border-b border-[#F7F8F6] last:border-0"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-[18px]">{ICONS[item.category] ?? "📦"}</span>
                              <div>
                                <p className="text-[13px] font-medium text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                                  {item.category}
                                </p>
                                <p className="text-[11px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
                                  {item.pct.toFixed(0)}% of total
                                </p>
                              </div>
                            </div>
                            <p className="text-[14px] font-semibold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                              ${item.amount.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
