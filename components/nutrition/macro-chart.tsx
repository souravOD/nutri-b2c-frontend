"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { NutritionDashboardDailyResponse } from "@/lib/types";

interface MacroChartProps {
  daily: NutritionDashboardDailyResponse | null;
}

const COLORS = ["#99CC33", "#60A5FA", "#FB923C"];

export function MacroChart({ daily }: MacroChartProps) {
  const data = daily
    ? [
      { name: "Protein", value: Number(daily.totals.proteinG) || 0 },
      { name: "Carbs", value: Number(daily.totals.carbsG) || 0 },
      { name: "Fat", value: Number(daily.totals.fatG) || 0 },
    ]
    : [];
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <section
      className="bg-white rounded-[24px] border border-[#F1F5F9] p-5"
      style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
    >
      <h3
        className="text-[14px] font-bold text-[#0F172A] mb-3"
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        Macro Split
      </h3>

      {total === 0 ? (
        <p className="text-[14px] text-[#94A3B8]" style={{ fontFamily: "Inter, sans-serif" }}>
          No macro data available.
        </p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-[140px] h-[140px] lg:w-[160px] lg:h-[160px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  outerRadius="95%"
                  innerRadius="55%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry, idx) => (
                    <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${Math.round(value)}g`, name]}
                  contentStyle={{
                    borderRadius: 12,
                    fontSize: 12,
                    fontFamily: "Inter, sans-serif",
                    border: "1px solid #F1F5F9",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-2.5">
            {data.map((d, idx) => (
              <div key={d.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[idx] }}
                />
                <div className="flex flex-col">
                  <span
                    className="text-[13px] font-medium text-[#0F172A]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {d.name}
                  </span>
                  <span
                    className="text-[12px] text-[#94A3B8]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    {Math.round(d.value)}g · {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
