"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { NutritionDashboardDailyResponse } from "@/lib/types";

interface DailySummaryProps {
  daily: NutritionDashboardDailyResponse | null;
  isLoading?: boolean;
}

function pct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(200, value));
}

export function DailySummary({ daily, isLoading }: DailySummaryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading daily nutrition...</CardContent>
      </Card>
    );
  }

  if (!daily) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No data for the selected day.</CardContent>
      </Card>
    );
  }

  const rows = [
    { label: "Calories", value: daily.totals.calories, target: daily.targets.calories, progress: daily.progress.caloriesPct, unit: "" },
    { label: "Protein", value: daily.totals.proteinG, target: daily.targets.proteinG, progress: daily.progress.proteinPct, unit: "g" },
    { label: "Carbs", value: daily.totals.carbsG, target: daily.targets.carbsG, progress: daily.progress.carbsPct, unit: "g" },
    { label: "Fat", value: daily.totals.fatG, target: daily.targets.fatG, progress: daily.progress.fatPct, unit: "g" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{row.label}</span>
              <span className="tabular-nums">
                {Math.round(row.value)}
                {row.unit} / {Math.round(row.target)}
                {row.unit}
              </span>
            </div>
            <Progress value={pct(row.progress)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

