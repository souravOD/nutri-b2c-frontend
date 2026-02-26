"use client"

interface DayData {
    date: string
    calories: number
    proteinG: number
    carbsG: number
    fatG: number
}

export function NutritionTrend({ daily }: { daily: DayData[] }) {
    if (daily.length === 0) return null

    const maxCal = Math.max(...daily.map(d => d.calories), 1)

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Nutrition Trend</h4>
            <div className="flex items-end gap-0.5 h-16">
                {daily.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center" title={`${d.date}: ${d.calories} kcal`}>
                        <div
                            className="w-full bg-blue-400 dark:bg-blue-500 rounded-t-sm min-h-[2px]"
                            style={{ height: `${(d.calories / maxCal) * 100}%` }}
                        />
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>{daily[0]?.date.slice(5)}</span>
                <span>{daily[daily.length - 1]?.date.slice(5)}</span>
            </div>
        </div>
    )
}
