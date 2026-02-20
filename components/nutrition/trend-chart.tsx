"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { NutritionDashboardWeeklyResponse } from "@/lib/types";

interface TrendChartProps {
  weekly: NutritionDashboardWeeklyResponse | null;
}

function shortDate(value: string): string {
  const d = new Date(`${value}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendChart({ weekly }: TrendChartProps) {
  const data = (weekly?.days ?? []).map((d) => ({
    date: shortDate(d.date),
    calories: d.calories,
    protein: d.proteinG,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Trends</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trend data for this week.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="calories" stroke="#2563eb" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="protein" stroke="#0f766e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

