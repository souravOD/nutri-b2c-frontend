"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroceryListSummary } from "@/lib/types";

interface CostSummaryProps {
  estimatedTotal: number;
  summary: GroceryListSummary | null;
}

function pct(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

export function CostSummary({ estimatedTotal, summary }: CostSummaryProps) {
  const totalItems = summary?.totalItems ?? 0;
  const purchasedItems = summary?.purchasedItems ?? 0;
  const purchasedActualTotal = summary?.purchasedActualTotal ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Cost Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Estimated Total</p>
          <p className="text-lg font-semibold">${estimatedTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Actual Purchased</p>
          <p className="text-lg font-semibold">${purchasedActualTotal.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Purchased</p>
          <p className="text-lg font-semibold">
            {purchasedItems}/{totalItems}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Completion</p>
          <p className="text-lg font-semibold">{pct(purchasedItems, totalItems)}%</p>
        </div>
      </CardContent>
    </Card>
  );
}

