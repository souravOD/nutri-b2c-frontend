"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetCategorySpend } from "@/lib/types";

interface CategoryChartProps {
  breakdown: BudgetCategorySpend[];
}

const COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#f97316",
  "#64748b",
];

export function CategoryChart({ breakdown }: CategoryChartProps) {
  const chartData = breakdown.slice(0, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Category Spend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No purchased spend data yet.</p>
        ) : (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {chartData.map((item, index) => (
                      <Cell key={item.category} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-1">
              {chartData.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.category}</span>
                  </div>
                  <span className="font-medium">
                    ${item.amount.toFixed(2)} ({item.pct.toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
