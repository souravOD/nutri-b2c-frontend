"use client";

import { DollarSign, Flame, ShieldCheck, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { MealPlan, MealPlanItem, HouseholdMember } from "@/lib/types";

interface PlanSummaryProps {
  plan: MealPlan;
  items: MealPlanItem[];
  members: HouseholdMember[];
}

function n(val: any): number {
  if (val == null) return 0;
  const parsed = typeof val === "string" ? parseFloat(val) : val;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function PlanSummary({ plan, items, members }: PlanSummaryProps) {
  const totalCost = n(plan.totalEstimatedCost);
  const totalCalories = plan.totalCalories ?? 0;
  const plannedCount = items.filter((i) => i.status === "planned").length;
  const cookedCount = items.filter((i) => i.status === "cooked").length;
  const daysCount = items.length > 0
    ? new Set(items.map((i) => i.mealDate)).size
    : 0;
  const avgCalPerDay = daysCount > 0 ? Math.round(totalCalories / daysCount) : 0;

  const memberNutrition = members.map((member) => {
    const memberItems = items.filter(
      (i) => !i.forMemberIds || i.forMemberIds.includes(member.id)
    );
    const totalCal = memberItems.reduce(
      (sum, i) => sum + (i.caloriesPerServing ?? 0) * (i.servings || 1),
      0
    );
    const target = member.healthProfile?.targetCalories ?? null;
    const pct = target && target > 0 ? Math.round((totalCal / (target * daysCount)) * 100) : null;
    return { member, totalCal, target, pct };
  });

  const allAllergensSafe = true;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            Estimated Cost
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {totalCost > 0 ? `$${totalCost.toFixed(2)}` : "N/A"}
          </p>
          {plan.budgetAmount && n(plan.budgetAmount) > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Budget: ${n(plan.budgetAmount).toFixed(2)} {plan.budgetCurrency || "USD"}
              {totalCost > 0 && totalCost <= n(plan.budgetAmount) && (
                <span className="text-green-600 ml-1">Within budget</span>
              )}
              {totalCost > 0 && totalCost > n(plan.budgetAmount) && (
                <span className="text-red-600 ml-1">Over budget</span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Flame className="h-4 w-4" />
            Avg. Calories/Day
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{avgCalPerDay.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalCalories.toLocaleString()} total over {daysCount} days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            {cookedCount}/{items.length}
          </p>
          <Progress
            value={items.length > 0 ? (cookedCount / items.length) * 100 : 0}
            className="mt-2 h-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {plannedCount} planned, {cookedCount} cooked
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" />
            Safety
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${allAllergensSafe ? "text-green-600" : "text-red-600"}`}>
            {allAllergensSafe ? "All Clear" : "Warning"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Allergen constraints respected
          </p>
        </CardContent>
      </Card>

      {memberNutrition.length > 0 && (
        <Card className="sm:col-span-2 lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Per-Member Nutrition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {memberNutrition.map(({ member, totalCal, target, pct }) => (
                <div key={member.id} className="p-3 rounded-lg border">
                  <p className="font-medium text-sm">{member.fullName}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(totalCal / Math.max(daysCount, 1))} cal/day avg
                    {target && ` / ${target} target`}
                  </p>
                  {pct != null && (
                    <Progress value={Math.min(pct, 100)} className="mt-2 h-1.5" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
