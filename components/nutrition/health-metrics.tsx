"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
}

export function HealthMetrics({ metrics }: HealthMetricsProps) {
  const trend = (metrics?.weight.trend ?? []).map((p) => ({
    date: new Date(`${p.date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: p.value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Metrics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!metrics ? (
          <p className="text-sm text-muted-foreground">No health metrics available.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="text-lg font-semibold">{metrics.bmi ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">BMR</p>
                <p className="text-lg font-semibold">{metrics.bmr ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">TDEE</p>
                <p className="text-lg font-semibold">{metrics.tdee ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Goal Progress</p>
                <p className="text-lg font-semibold">
                  {metrics.weight.progressPct == null ? "-" : `${Math.round(metrics.weight.progressPct)}%`}
                </p>
              </div>
            </div>
            <div className="h-56">
              {trend.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weight trend points.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

