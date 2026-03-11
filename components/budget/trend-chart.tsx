"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetTrendPoint } from "@/lib/types";

interface TrendChartProps {
  points: BudgetTrendPoint[];
}

function shortDateLabel(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ points }: TrendChartProps) {
  const chartData = points.map((point) => ({
    label: shortDateLabel(point.startDate),
    spent: point.spent,
    budget: point.budgetAmount ?? null,
  }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Spend Trend</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No trend data available yet.</p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `$${Number(value).toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line type="monotone" dataKey="budget" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
