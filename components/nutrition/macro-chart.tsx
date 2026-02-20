"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { NutritionDashboardDailyResponse } from "@/lib/types";

interface MacroChartProps {
  daily: NutritionDashboardDailyResponse | null;
}

const COLORS = ["#0f766e", "#2563eb", "#d97706"];

export function MacroChart({ daily }: MacroChartProps) {
  const data = daily
    ? [
        { name: "Protein", value: Number(daily.totals.proteinG) || 0 },
        { name: "Carbs", value: Number(daily.totals.carbsG) || 0 },
        { name: "Fat", value: Number(daily.totals.fatG) || 0 },
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Macro Split</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No macro data available.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={45}>
                {data.map((entry, idx) => (
                  <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

