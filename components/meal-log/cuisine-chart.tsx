"use client"

interface CuisineItem {
    cuisine: string
    percentage: number
}

const COLORS = [
    "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500",
    "bg-pink-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500",
]

export function CuisineChart({ breakdown }: { breakdown: CuisineItem[] | null }) {
    if (!breakdown || breakdown.length === 0) return null

    return (
        <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Cuisine Diversity</h4>
            <div className="flex h-3 rounded-full overflow-hidden">
                {breakdown.map((item, i) => (
                    <div
                        key={item.cuisine}
                        className={`${COLORS[i % COLORS.length]} transition-all`}
                        style={{ width: `${item.percentage}%` }}
                        title={`${item.cuisine}: ${item.percentage}%`}
                    />
                ))}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
                {breakdown.map((item, i) => (
                    <div key={item.cuisine} className="flex items-center gap-1 text-[10px]">
                        <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                        <span>{item.cuisine} {item.percentage}%</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
