"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { NutrientGap } from "@/lib/types";

interface NutrientGapsProps {
  gaps: NutrientGap[];
}

export function NutrientGaps({ gaps }: NutrientGapsProps) {
  const top = gaps.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrient Gaps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">No nutrient gap data available.</p>
        ) : (
          top.map((gap) => (
            <div key={gap.key} className="flex items-center justify-between rounded-md border p-2">
              <div>
                <p className="text-sm font-medium">{gap.nutrient}</p>
                <p className="text-xs text-muted-foreground">
                  {gap.intake} / {gap.target} {gap.unit}
                </p>
              </div>
              <Badge variant={gap.status === "low" ? "destructive" : gap.status === "high" ? "secondary" : "outline"}>
                {Math.round(gap.percentOfTarget)}%
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

