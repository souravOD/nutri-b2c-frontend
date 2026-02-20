"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BudgetRingProps {
  spent: number;
  budgetAmount: number | null;
  remaining: number | null;
  utilizationPct: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function BudgetRing({ spent, budgetAmount, remaining, utilizationPct }: BudgetRingProps) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const pct = clamp(utilizationPct ?? 0, 0, 100);
  const offset = circumference - (pct / 100) * circumference;
  const overBudget = budgetAmount != null && spent > budgetAmount;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Budget Utilization</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="12"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={overBudget ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-bold">{Math.round(utilizationPct ?? 0)}%</p>
            <p className="text-xs text-muted-foreground">used</p>
          </div>
        </div>

        <div className="w-full space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Spent</span>
            <span className="font-medium">${spent.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Budget</span>
            <span className="font-medium">{budgetAmount == null ? "-" : `$${budgetAmount.toFixed(2)}`}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{overBudget ? "Over" : "Remaining"}</span>
            <span className={overBudget ? "font-semibold text-destructive" : "font-medium"}>
              {remaining == null ? "-" : `$${Math.abs(remaining).toFixed(2)}`}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
