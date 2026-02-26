"use client"

import { Badge } from "@/components/ui/badge"
import { Repeat } from "lucide-react"

interface RepeatedMeal {
    recipeId: string
    title?: string
    count: number
    lastEaten?: string
}

export function RepeatedMeals({ meals }: { meals: RepeatedMeal[] }) {
    if (meals.length === 0) return null

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Repeat className="w-3 h-3" />
                Repeated Meals
            </h4>
            <div className="space-y-1">
                {meals.map((m) => (
                    <div key={m.recipeId} className="flex items-center justify-between text-sm">
                        <span className="truncate">{m.title ?? m.recipeId.slice(0, 8)}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                            {m.count}×
                        </Badge>
                    </div>
                ))}
            </div>
        </div>
    )
}
