"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMealHistory } from "@/hooks/use-meal-history";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface HistoryViewProps {
  open: boolean;
  onClose: () => void;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

export function HistoryView({ open, onClose }: HistoryViewProps) {
  const [range, setRange] = useState<"7" | "30">("7");

  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (range === "7" ? 7 : 30));
    return d.toISOString().slice(0, 10);
  }, [range]);

  const { days, averages, isLoading } = useMealHistory(startDate, endDate);

  const chartData = days.map((d) => ({
    date: formatShortDate(d.date),
    calories: n(d.total_calories),
    protein: Math.round(n(d.total_protein_g)),
    carbs: Math.round(n(d.total_carbs_g)),
    fat: Math.round(n(d.total_fat_g)),
  }));

  if (!open) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-base">Nutrition Trends</CardTitle>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:underline">
          Close
        </button>
      </CardHeader>
      <CardContent>
        <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30")}>
          <TabsList className="mb-4">
            <TabsTrigger value="7">7 Days</TabsTrigger>
            <TabsTrigger value="30">30 Days</TabsTrigger>
          </TabsList>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No data for this period
            </p>
          ) : (
            <>
              <TabsContent value={range}>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="calories" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>

              {averages && (
                <div className="grid grid-cols-4 gap-2 mt-4 text-center text-sm">
                  <div>
                    <p className="font-semibold tabular-nums">{Math.round(n(averages.avg_calories))}</p>
                    <p className="text-xs text-muted-foreground">Avg Cal</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums">{Math.round(n(averages.avg_protein_g))}g</p>
                    <p className="text-xs text-muted-foreground">Avg Protein</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums">{Math.round(n(averages.avg_carbs_g))}g</p>
                    <p className="text-xs text-muted-foreground">Avg Carbs</p>
                  </div>
                  <div>
                    <p className="font-semibold tabular-nums">{Math.round(n(averages.avg_fat_g))}g</p>
                    <p className="text-xs text-muted-foreground">Avg Fat</p>
                  </div>
                </div>
              )}
            </>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
