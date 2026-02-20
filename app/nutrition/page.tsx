"use client";

import { useEffect, useMemo, useState } from "react";
import { DailySummary } from "@/components/nutrition/daily-summary";
import { MacroChart } from "@/components/nutrition/macro-chart";
import { NutrientGaps } from "@/components/nutrition/nutrient-gaps";
import { TrendChart } from "@/components/nutrition/trend-chart";
import { MemberCards } from "@/components/nutrition/member-cards";
import { HealthMetrics } from "@/components/nutrition/health-metrics";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useSelectedMember } from "@/hooks/use-selected-member";
import {
  useNutritionDaily,
  useNutritionHealthMetrics,
  useNutritionMemberSummary,
  useNutritionWeekly,
} from "@/hooks/use-nutrition-dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function toWeekStart(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  const diff = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

export default function NutritionPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const { members } = useHouseholdMembers();
  const defaultMember = useMemo(
    () => members.find((m) => m.isProfileOwner) ?? members[0] ?? null,
    [members]
  );
  const { memberId, setMemberId } = useSelectedMember(defaultMember?.id);

  useEffect(() => {
    if (!memberId && defaultMember?.id) setMemberId(defaultMember.id);
  }, [memberId, defaultMember?.id, setMemberId]);

  const weekStart = useMemo(() => toWeekStart(date), [date]);

  const { daily, isLoading: dailyLoading } = useNutritionDaily({ date, memberId });
  const { weekly, isLoading: weeklyLoading } = useNutritionWeekly({ weekStart, memberId });
  const { summary } = useNutritionMemberSummary({ date });
  const { healthMetrics, isLoading: healthLoading } = useNutritionHealthMetrics({ memberId });

  return (
    <main className="container mx-auto max-w-6xl space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Nutrition Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          {members.length > 0 ? (
            <Select value={memberId} onValueChange={(v) => setMemberId(v)}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName || m.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DailySummary daily={daily} isLoading={dailyLoading} />
        <MacroChart daily={daily} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NutrientGaps gaps={daily?.nutrientGaps ?? weekly?.nutrientGaps ?? []} />
        {weeklyLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Weekly Trends</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Loading trends...</CardContent>
          </Card>
        ) : (
          <TrendChart weekly={weekly} />
        )}
      </div>

      {daily?.conditionAlerts?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Condition Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {daily.conditionAlerts.map((alert, idx) => (
              <div key={`${alert.conditionName}-${alert.nutrient}-${idx}`} className="rounded-md border p-2 text-sm">
                <p className="font-medium">
                  {alert.conditionName}: {alert.nutrient}
                </p>
                <p className="text-muted-foreground">
                  {Math.round(alert.intake)} / {Math.round(alert.threshold)} {alert.unit} ({alert.direction})
                </p>
                <p>{alert.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <MemberCards summary={summary} />
      <HealthMetrics metrics={healthMetrics} />
      {healthLoading ? <p className="text-sm text-muted-foreground">Loading health metrics...</p> : null}
    </main>
  );
}
