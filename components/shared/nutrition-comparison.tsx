"use client"

interface NutritionComparisonProps {
    original: { calories_per_100g: number; protein_g: number }
    substitute: { calories_per_100g: number; protein_g: number }
}

export function NutritionComparison({ original, substitute }: NutritionComparisonProps) {
    return (
        <div className="grid grid-cols-3 text-xs gap-1 mt-1">
            <div />
            <div className="text-center font-medium text-muted-foreground">Original</div>
            <div className="text-center font-medium text-muted-foreground">Substitute</div>

            <div>Calories</div>
            <div className="text-center">{original.calories_per_100g}</div>
            <div className="text-center">{substitute.calories_per_100g}</div>

            <div>Protein</div>
            <div className="text-center">{original.protein_g}g</div>
            <div className="text-center">{substitute.protein_g}g</div>
        </div>
    )
}
