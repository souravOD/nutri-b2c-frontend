"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Nutrition } from "@/lib/types"

/** Extend Nutrition with optional fields some data sources include */
type ExtendedNutrition = Nutrition & {
  totalSugars?: number
  allergens?: string[]
  transFat?: number
}

interface NutritionFactsPanelProps {
  nutrition: ExtendedNutrition
  servings: number
  className?: string
}

// Daily values based on 2000 calorie diet (FDA guidelines)
const DAILY_VALUES = {
  calories: 2000,
  fat: 65, // g
  saturatedFat: 20, // g
  cholesterol: 300, // mg
  sodium: 2300, // mg
  carbs: 300, // g
  fiber: 25, // g
  totalSugars: 50, // g (no official DV; WHO recommendation)
  addedSugars: 50, // g
  protein: 50, // g
  vitaminD: 20, // mcg
  calcium: 1300, // mg
  iron: 18, // mg
  potassium: 4700, // mg
}

// Coerce possibly-undefined numbers to a safe number for math/display
const n = (v?: number) => (typeof v === "number" ? v : 0)

// Allow undefined amount -> 0% DV
function calculateDailyValue(
  nutrient: keyof typeof DAILY_VALUES,
  amount?: number
): number {
  const dv = DAILY_VALUES[nutrient]
  const amt = n(amount)
  return dv > 0 ? Math.round((amt / dv) * 100) : 0
}

export function NutritionFactsPanel({
  nutrition,
  servings,
  className,
}: NutritionFactsPanelProps) {
  // Some APIs use `sugar` for total sugars; prefer explicit `totalSugars` if present
  const totalSugars = nutrition.totalSugars ?? nutrition.sugar ?? 0
  const allergens = nutrition.allergens ?? []

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold">Nutrition Facts</CardTitle>
        <p className="text-sm text-muted-foreground">Per serving • Serves {servings}</p>
      </CardHeader>

      <CardContent className="space-y-1 text-sm">
        {/* Calories */}
        <div className="flex justify-between items-end border-b-8 border-black pb-1 mb-2">
          <span className="text-2xl font-bold">Calories</span>
          <span className="text-2xl font-bold">{n(nutrition.calories)}</span>
        </div>

        <div className="text-xs text-right font-medium mb-2">% Daily Value*</div>

        {/* Total Fat */}
        <div className="flex justify-between border-b border-gray-300 pb-1">
          <span className="font-bold">Total Fat {n(nutrition.fat)}g</span>
          <span className="font-bold">{calculateDailyValue("fat", nutrition.fat)}%</span>
        </div>

        {/* Saturated Fat */}
        <div className="flex justify-between pl-4">
          <span>Saturated Fat {n(nutrition.saturatedFat)}g</span>
          <span className="font-bold">
            {calculateDailyValue("saturatedFat", nutrition.saturatedFat)}%
          </span>
        </div>

        {/* Trans Fat */}
        <div className="pl-4 border-b border-gray-300 pb-1">
          <span>Trans Fat {n(nutrition.transFat)}g</span>
        </div>

        {/* Cholesterol */}
        <div className="flex justify-between border-b border-gray-300 pb-1">
          <span className="font-bold">Cholesterol {n(nutrition.cholesterol)}mg</span>
          <span className="font-bold">
            {calculateDailyValue("cholesterol", nutrition.cholesterol)}%
          </span>
        </div>

        {/* Sodium */}
        <div className="flex justify-between border-b border-gray-300 pb-1">
          <span className="font-bold">Sodium {n(nutrition.sodium)}mg</span>
          <span className="font-bold">{calculateDailyValue("sodium", nutrition.sodium)}%</span>
        </div>

        {/* Total Carbs */}
        <div className="flex justify-between border-b border-gray-300 pb-1">
          <span className="font-bold">Total Carbohydrate {n(nutrition.carbs)}g</span>
          <span className="font-bold">{calculateDailyValue("carbs", nutrition.carbs)}%</span>
        </div>

        {/* Dietary Fiber */}
        <div className="flex justify-between pl-4">
          <span>Dietary Fiber {n(nutrition.fiber)}g</span>
          <span className="font-bold">{calculateDailyValue("fiber", nutrition.fiber)}%</span>
        </div>

        {/* Total Sugars */}
        <div className="pl-4">
          <span>Total Sugars {n(totalSugars)}g</span>
        </div>

        {/* Added Sugars */}
        <div className="flex justify-between pl-8 border-b border-gray-300 pb-1">
          <span>Added Sugars {n(nutrition.addedSugars)}g</span>
          <span className="font-bold">
            {calculateDailyValue("addedSugars", nutrition.addedSugars)}%
          </span>
        </div>

        {/* Protein */}
        <div className="flex justify-between border-b-4 border-black pb-2 mb-2">
          <span className="font-bold">Protein {n(nutrition.protein)}g</span>
          <span className="font-bold">{calculateDailyValue("protein", nutrition.protein)}%</span>
        </div>

        {/* Vitamins and Minerals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Vitamin D {n(nutrition.vitaminD)}mcg</span>
            <span>{calculateDailyValue("vitaminD", nutrition.vitaminD)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Calcium {n(nutrition.calcium)}mg</span>
            <span>{calculateDailyValue("calcium", nutrition.calcium)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Iron {n(nutrition.iron)}mg</span>
            <span>{calculateDailyValue("iron", nutrition.iron)}%</span>
          </div>
          <div className="flex justify-between border-b-4 border-black pb-2">
            <span>Potassium {n(nutrition.potassium)}mg</span>
            <span>{calculateDailyValue("potassium", nutrition.potassium)}%</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000
          calories a day is used for general nutrition advice.
        </div>

        {/* Allergens (optional) */}
        {allergens.length > 0 && (
          <div className="pt-2 border-t">
            <span className="font-bold text-xs">Contains: </span>
            <span className="text-xs">{allergens.join(", ")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
