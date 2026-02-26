"use client"

import { Badge } from "@/components/ui/badge"
import { NutritionComparison } from "./nutrition-comparison"
import type { SubstitutionItem } from "@/lib/substitution-api"

export function SubstitutionCard({ sub }: { sub: SubstitutionItem }) {
    return (
        <div className="border rounded-lg p-2 space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{sub.name}</span>
                {sub.confidence != null && (
                    <Badge variant="secondary" className="text-[10px]">
                        {Math.round(sub.confidence * 100)}%
                    </Badge>
                )}
            </div>
            <p className="text-xs text-muted-foreground">{sub.reason}</p>
            {sub.savings != null && sub.savings > 0 && (
                <Badge variant="outline" className="text-[10px] text-green-600">
                    Save ${sub.savings.toFixed(2)}
                </Badge>
            )}
            {sub.nutritionComparison && (
                <NutritionComparison
                    original={sub.nutritionComparison.original}
                    substitute={sub.nutritionComparison.substitute}
                />
            )}
        </div>
    )
}
