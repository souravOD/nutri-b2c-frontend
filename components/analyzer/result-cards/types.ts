import type { AnalyzeResult, NutritionPerServing } from "@/lib/types"

export type AnalyzerCardResult = AnalyzeResult & {
  nutrition?: NutritionPerServing
  allergens?: string[]
  diets?: string[]
  cuisines?: string[]
  tasteList?: string[]
}
