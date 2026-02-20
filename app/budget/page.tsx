"use client";

import { useState } from "react";
import { Loader2, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBudgetRecommendations, useBudgetSnapshot, useBudgetTrends, useCreateBudget, useUpdateBudget } from "@/hooks/use-budget";
import { BudgetRing } from "@/components/budget/budget-ring";
import { CategoryChart } from "@/components/budget/category-chart";
import { TrendChart } from "@/components/budget/trend-chart";
import { SavingsTips } from "@/components/budget/savings-tips";
import { SetBudgetModal } from "@/components/budget/set-budget-modal";
import type { BudgetPeriod } from "@/lib/types";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function BudgetPage() {
  const { toast } = useToast();
  const [period, setPeriod] = useState<BudgetPeriod>("weekly");
  const [modalOpen, setModalOpen] = useState(false);

  const { snapshot, isLoading: snapshotLoading, error: snapshotError } = useBudgetSnapshot({ period });
  const { trends, isLoading: trendsLoading } = useBudgetTrends({ period, points: 12 });
  const { recommendations, isLoading: tipsLoading } = useBudgetRecommendations({ period });
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();

  const isSaving = createBudget.isPending || updateBudget.isPending;
  const budget = snapshot?.budget ?? null;

  const handleSaveBudget = (payload: { amount: number; period: BudgetPeriod }) => {
    if (budget) {
      updateBudget.mutate(
        { budgetId: budget.id, payload },
        {
          onSuccess: () => {
            setModalOpen(false);
            toast({ title: "Budget updated" });
          },
          onError: (error) =>
            toast({
              title: "Update failed",
              description: getErrorMessage(error, "Unable to update budget."),
              variant: "destructive",
            }),
        }
      );
      return;
    }

    createBudget.mutate(
      {
        ...payload,
        budgetType: "grocery",
        currency: "USD",
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          toast({ title: "Budget created" });
        },
        onError: (error) =>
          toast({
            title: "Create failed",
            description: getErrorMessage(error, "Unable to create budget."),
            variant: "destructive",
          }),
      }
    );
  };

  if (snapshotLoading && !snapshot) {
    return (
      <main className="container mx-auto max-w-6xl px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading budget dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto max-w-6xl space-y-4 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <PiggyBank className="h-6 w-6" />
          Budget Tracker
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setModalOpen(true)}>{budget ? "Edit Budget" : "Set Budget"}</Button>
        </div>
      </div>

      {snapshotError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">
            {getErrorMessage(snapshotError, "Unable to load budget data.")}
          </CardContent>
        </Card>
      ) : null}

      {!budget ? (
        <Card>
          <CardHeader>
            <CardTitle>No Active Budget</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set a grocery budget to start tracking weekly/monthly spend performance.
            </p>
            <Button onClick={() => setModalOpen(true)}>Set Budget</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BudgetRing
          spent={snapshot?.spent ?? 0}
          budgetAmount={snapshot?.budget?.amount ?? null}
          remaining={snapshot?.remaining ?? null}
          utilizationPct={snapshot?.utilizationPct ?? null}
        />

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Window</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{snapshot?.window.timezone ?? "UTC"}</Badge>
              <Badge variant="outline">{period}</Badge>
              <Badge variant="outline">
                {snapshot?.window.startDate} to {snapshot?.window.endDate}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Spent</p>
                <p className="text-lg font-semibold">${(snapshot?.spent ?? 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-lg font-semibold">
                  {snapshot?.budget ? `$${snapshot.budget.amount.toFixed(2)}` : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-semibold">
                  {snapshot?.remaining == null ? "-" : `$${snapshot.remaining.toFixed(2)}`}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unpriced Purchased</p>
                <p className="text-lg font-semibold">{snapshot?.metadata.unpricedPurchasedItems ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {snapshot?.planVsActual ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plan vs Actual (Active Meal Plan)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Plan</p>
              <p className="text-lg font-semibold">${snapshot.planVsActual.estimated.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Actual</p>
              <p className="text-lg font-semibold">${snapshot.planVsActual.actual.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Difference</p>
              <p className={snapshot.planVsActual.difference > 0 ? "text-lg font-semibold text-destructive" : "text-lg font-semibold text-green-700"}>
                ${snapshot.planVsActual.difference.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Variance</p>
              <p className="text-lg font-semibold">
                {snapshot.planVsActual.differencePct == null ? "-" : `${snapshot.planVsActual.differencePct.toFixed(1)}%`}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CategoryChart breakdown={snapshot?.breakdown ?? []} />
        {trendsLoading && !trends ? (
          <Card>
            <CardContent className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">
              Loading trends...
            </CardContent>
          </Card>
        ) : (
          <TrendChart points={trends?.points ?? []} />
        )}
      </div>

      {tipsLoading && !recommendations ? (
        <Card>
          <CardContent className="flex min-h-28 items-center justify-center text-sm text-muted-foreground">
            Loading recommendations...
          </CardContent>
        </Card>
      ) : (
        <SavingsTips tips={recommendations?.tips ?? []} source={recommendations?.source ?? null} />
      )}

      <SetBudgetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        existingBudget={budget}
        isSaving={isSaving}
        onSave={handleSaveBudget}
      />
    </main>
  );
}
