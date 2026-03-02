"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Lightbulb } from "lucide-react"
import { VarietyScore } from "./variety-score"
import { CuisineChart } from "./cuisine-chart"
import { RepeatedMeals } from "./repeated-meals"
import { NutritionTrend } from "./nutrition-trend"

interface PatternData {
    varietyScore: number | null
    repeatedMeals: { recipeId: string; title?: string; count: number; lastEaten?: string }[]
    cuisineBreakdown: { cuisine: string; percentage: number }[] | null
    nutritionTrends?: { daily: { date: string; calories: number; proteinG: number; carbsG: number; fatG: number }[] }
    suggestions: string[]
    source: string
}

export function PatternDashboard({ days = 14 }: { days?: number }) {
    const [data, setData] = useState<PatternData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/v1/meal-log/patterns?days=${days}`, { credentials: "include" })
            .then(res => res.ok ? res.json() : null)
            .then(d => setData(d))
            .catch(() => setData(null))
            .finally(() => setLoading(false))
    }, [days])

    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (!data) return null

    const hasContent = data.varietyScore != null || data.repeatedMeals.length > 0 ||
        data.cuisineBreakdown != null || (data.nutritionTrends?.daily?.length ?? 0) > 0

    if (!hasContent) return null

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm">Eating Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                    <VarietyScore score={data.varietyScore} />
                    <div className="flex-1 space-y-3">
                        <CuisineChart breakdown={data.cuisineBreakdown} />
                        <RepeatedMeals meals={data.repeatedMeals} />
                    </div>
                </div>

                {data.nutritionTrends?.daily && data.nutritionTrends.daily.length > 0 && (
                    <NutritionTrend daily={data.nutritionTrends.daily} />
                )}

                {data.suggestions.length > 0 && (
                    <div className="space-y-1">
                        {data.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                <Lightbulb className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                                <span>{s}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
