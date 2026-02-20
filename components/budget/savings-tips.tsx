"use client";

import { AlertCircle, Info, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BudgetRecommendation } from "@/lib/types";

interface SavingsTipsProps {
  tips: BudgetRecommendation[];
  source: "rules" | "hybrid" | null;
}

function iconForSeverity(severity: BudgetRecommendation["severity"]) {
  if (severity === "critical") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (severity === "warning") return <Lightbulb className="h-4 w-4 text-amber-500" />;
  return <Info className="h-4 w-4 text-sky-500" />;
}

function badgeClass(severity: BudgetRecommendation["severity"]): string {
  if (severity === "critical") return "bg-red-100 text-red-800";
  if (severity === "warning") return "bg-amber-100 text-amber-800";
  return "bg-sky-100 text-sky-800";
}

export function SavingsTips({ tips, source }: SavingsTipsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Savings Recommendations
          {source ? <Badge variant="outline">{source === "hybrid" ? "Rules + AI" : "Rules"}</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {tips.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No recommendations available yet.</p>
        ) : (
          tips.map((tip) => (
            <div key={tip.id} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {iconForSeverity(tip.severity)}
                  <p className="text-sm font-semibold">{tip.title}</p>
                </div>
                <Badge className={badgeClass(tip.severity)}>{tip.severity}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{tip.description}</p>
              {tip.potentialSavings != null ? (
                <p className="mt-1 text-xs font-medium text-green-700">
                  Potential savings: ${tip.potentialSavings.toFixed(2)}
                </p>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
