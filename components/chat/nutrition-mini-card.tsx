"use client"

interface NutritionMiniCardProps {
    data: {
        name?: string
        calories?: number
        proteinG?: number
        carbsG?: number
        fatG?: number
    }
}

export function NutritionMiniCard({ data }: NutritionMiniCardProps) {
    return (
        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            {data.name && <p className="text-sm font-medium">{data.name}</p>}
            <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div>
                    <p className="font-bold text-sm">{data.calories ?? "—"}</p>
                    <p className="text-muted-foreground">kcal</p>
                </div>
                <div>
                    <p className="font-bold text-sm">{data.proteinG ?? "—"}g</p>
                    <p className="text-muted-foreground">Protein</p>
                </div>
                <div>
                    <p className="font-bold text-sm">{data.carbsG ?? "—"}g</p>
                    <p className="text-muted-foreground">Carbs</p>
                </div>
                <div>
                    <p className="font-bold text-sm">{data.fatG ?? "—"}g</p>
                    <p className="text-muted-foreground">Fat</p>
                </div>
            </div>
        </div>
    )
}
