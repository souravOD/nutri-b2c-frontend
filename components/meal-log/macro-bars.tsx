"use client";

import { Progress } from "@/components/ui/progress";
import type { NutritionTargets } from "@/lib/types";

interface MacroBarsProps {
  currentProtein: number;
  currentCarbs: number;
  currentFat: number;
  targets: NutritionTargets | null;
}

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

function MacroRow({
  label,
  current,
  target,
  color,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          {Math.round(current)}g / {Math.round(target)}g
        </span>
      </div>
      <Progress value={pct} className={`h-2 ${color}`} />
    </div>
  );
}

export function MacroBars({ currentProtein, currentCarbs, currentFat, targets }: MacroBarsProps) {
  return (
    <div className="space-y-3">
      <MacroRow
        label="Protein"
        current={currentProtein}
        target={n(targets?.targetProteinG) || 120}
        color="[&>div]:bg-blue-500"
      />
      <MacroRow
        label="Carbs"
        current={currentCarbs}
        target={n(targets?.targetCarbsG) || 250}
        color="[&>div]:bg-amber-500"
      />
      <MacroRow
        label="Fat"
        current={currentFat}
        target={n(targets?.targetFatG) || 65}
        color="[&>div]:bg-rose-500"
      />
    </div>
  );
}
