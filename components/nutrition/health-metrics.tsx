"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NutritionHealthMetricsResponse } from "@/lib/types";

interface HealthMetricsProps {
  metrics: NutritionHealthMetricsResponse | null;
  isLoading?: boolean;
}

export function HealthMetrics({ metrics, isLoading }: HealthMetricsProps) {
  const trend = (metrics?.weight.trend ?? []).map((p) => ({
    date: new Date(`${p.date}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    value: p.value,
  }));

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

  return (
    <section
      className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
    >
      <h3
        className="text-[14px] font-bold text-[#0F172A] mb-4"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Health Metrics
      </h3>

      {!metrics ? (
        <p className="text-[14px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
          No health metrics available.
        </p>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "BMI", value: metrics.bmi != null ? metrics.bmi.toFixed(1) : "–" },
              { label: "BMR", value: metrics.bmr != null ? Math.round(metrics.bmr).toLocaleString() : "–" },
              { label: "TDEE", value: metrics.tdee != null ? Math.round(metrics.tdee).toLocaleString() : "–" },
              {
                label: "Goal Progress",
                value: metrics.weight.progressPct != null ? `${Math.round(metrics.weight.progressPct)}%` : "–",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-2xl bg-[#F8FAFC] p-3 flex flex-col items-center"
              >
                <span
                  className="text-[11px] font-medium text-[#64748B] uppercase tracking-[0.5px]"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {m.label}
                </span>
                <span
                  className="text-[20px] font-bold text-[#0F172A] mt-0.5"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>

          {/* Weight trend */}
          {trend.length > 0 && (
            <div className="mt-4 pt-3 border-t border-[#F1F5F9]">
              <h4
                className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[1px] mb-2"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Weight Trend
              </h4>
              <div className="h-[180px] lg:h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "Inter, sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8", fontFamily: "Inter, sans-serif" }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} kg`, "Weight"]}
                      contentStyle={{
                        borderRadius: 12,
                        fontSize: 12,
                        fontFamily: "Inter, sans-serif",
                        border: "1px solid #F1F5F9",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#99CC33"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "#99CC33", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#538100" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
