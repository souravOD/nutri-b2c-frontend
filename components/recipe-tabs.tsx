"use client"

import { useMemo, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { NutritionFactsPanel } from "@/components/nutrition-facts-panel"
import type { Recipe, Nutrition } from "@/lib/types"

// ----- local types & helpers -----

type Ingr = { amount: string | number | null; unit: string | null; name: string }
type JsonRecord = Record<string, unknown>

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

function num(x: unknown, fallback = 0): number {
  const n = Number(x)
  return Number.isFinite(n) ? n : fallback
}

// Accept both camelCase and backend snake_case keys and coerce to what NutritionFactsPanel expects
function normalizeNutrition(recipe: Recipe): Nutrition {
  const n = asRecord(recipe.nutrition)
  const r = asRecord(recipe)

  const calories = num(n.calories ?? r.calories)
  const protein = num(n.protein ?? n.protein_g ?? r.protein_g ?? r.proteinG)
  const carbs = num(n.carbs ?? n.carbs_g ?? r.carbs_g ?? r.carbsG)
  const fat = num(n.fat ?? n.fat_g ?? r.fat_g ?? r.fatG)
  const fiber = num(n.fiber ?? n.fiber_g ?? r.fiber_g ?? r.fiberG)
  const sugar = num(n.sugar ?? n.sugar_g ?? r.sugar_g ?? r.sugarG)
  const sodium = num(n.sodium ?? n.sodium_mg ?? r.sodium_mg ?? r.sodiumMg) // mg
  const saturatedFat = num(
    n.saturatedFat ?? n.saturated_fat ?? n.saturated_fat_g ?? r.saturated_fat_g ?? r.saturatedFatG,
  )
  const transFat = num(
    n.transFat ?? n.trans_fat ?? n.trans_fat_g ?? r.trans_fat_g ?? r.transFatG,
  )
  const cholesterol = num(
    n.cholesterol ?? n.cholesterol_mg ?? r.cholesterol_mg ?? r.cholesterolMg,
  ) // mg
  const addedSugars = num(
    n.addedSugars ?? n.added_sugars ?? n.added_sugars_g ?? r.added_sugars_g ?? r.addedSugarsG,
  )
  const calcium = num(n.calcium ?? n.calcium_mg ?? r.calcium_mg ?? r.calciumMg) // mg
  const iron = num(n.iron ?? n.iron_mg ?? r.iron_mg ?? r.ironMg) // mg
  const potassium = num(n.potassium ?? n.potassium_mg ?? r.potassium_mg ?? r.potassiumMg) // mg
  const vitaminD = num(
    n.vitaminD ?? n.vitamin_d ?? n.vitamin_d_mcg ?? r.vitamin_d_mcg ?? r.vitaminDMcg,
  ) // mcg
  const vitaminA = num(
    n.vitaminA ?? n.vitamin_a ?? n.vitamin_a_mcg ?? r.vitamin_a_mcg ?? r.vitaminAMcg,
  ) // mcg
  const vitaminC = num(
    n.vitaminC ?? n.vitamin_c ?? n.vitamin_c_mg ?? r.vitamin_c_mg ?? r.vitaminCMg,
  ) // mg

  return {
    calories,
    fat,
    saturatedFat,
    transFat,
    cholesterol,
    sodium,
    carbs,
    fiber,
    sugar,
    protein,
    addedSugars,
    vitaminD,
    calcium,
    iron,
    potassium,
    vitaminA,
    vitaminC,
  } as Nutrition
}

// ----- components -----

function Ingredients({ ingredients = [] }: { ingredients?: unknown[] }) {
  const toIngr = (i: unknown): Ingr => {
    if (typeof i === "string") return { amount: "", unit: "", name: i }

    const source = asRecord(i)
    // Accept multiple shapes: {qty, unit, item}, {amount, unit, name}, {quantity, measure, ingredient}, {text}
    const amountValue = source.amount ?? source.qty ?? source.quantity ?? source.value ?? null
    const unitValue = source.unit ?? source.measure ?? null
    const nameValue = source.name ?? source.item ?? source.ingredient ?? source.text ?? ""

    let amount: Ingr["amount"] = null
    if (typeof amountValue === "number" || typeof amountValue === "string") {
      amount = amountValue
    } else if (amountValue != null) {
      amount = String(amountValue)
    }

    const unit = unitValue == null ? null : String(unitValue)
    const name = typeof nameValue === "string" ? nameValue : String(nameValue)

    return { amount, unit, name }
  }

  const items = (Array.isArray(ingredients) ? ingredients : []).map(toIngr)

  return (
    <ol className="list-decimal pl-6 space-y-2 text-sm">
      {items.map((ing, i) => (
        <li key={i}>
          {ing.amount ? `${ing.amount} ` : ""}
          {ing.unit ? `${ing.unit} ` : ""}
          {ing.name}
        </li>
      ))}
    </ol>
  )
}

export function RecipeTabs({ recipe }: { recipe: Recipe }) {
  const [showMetric, setShowMetric] = useState(false)
  const recipeRecord = recipe as unknown as JsonRecord

  // Normalize nutrition (root cause of zeros on the details page)
  const canonNutrition = useMemo(() => normalizeNutrition(recipe), [recipe])

  // Ensure a numeric servings value for NutritionFactsPanel prop
  const servings = num(recipe.servings ?? recipeRecord.servings_count ?? 1, 1)

  const instructions: string[] = (Array.isArray(recipeRecord.instructions) ? recipeRecord.instructions : [])
    .slice()
    .sort((a, b) => {
      const aOrder = num(asRecord(a).order)
      const bOrder = num(asRecord(b).order)
      return aOrder - bOrder
    })
    .map((step) => {
      if (typeof step === "string") return step
      const source = asRecord(step)
      const value = source.text ?? source.step ?? ""
      return typeof value === "string" ? value : String(value)
    })
    .filter((step) => step.trim().length > 0)

  const dietTags = asStringArray(recipeRecord.diet_tags ?? recipeRecord.dietTags)
  const totalTimeMin = num(recipeRecord.total_time_minutes ?? recipe.totalTimeMinutes ?? 0)
  const difficulty =
    typeof recipe.difficulty === "string"
      ? recipe.difficulty
      : typeof recipeRecord.difficulty === "string"
        ? recipeRecord.difficulty
        : "-"

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
        <TabsTrigger value="instructions">Instructions</TabsTrigger>
        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
        <TabsTrigger value="tips" className="hidden lg:block">
          Tips
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Servings</div>
              <div className="font-medium">{recipe.servings ?? 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Total time</div>
              <div className="font-medium">{totalTimeMin} min</div>
            </div>
            <div>
              <div className="text-muted-foreground">Difficulty</div>
              <div className="font-medium capitalize">{difficulty}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Calories / serving</div>
              <div className="font-medium">{canonNutrition.calories}</div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="ingredients">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Ingredients</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <Checkbox
                id="metric"
                checked={showMetric}
                onCheckedChange={(v) => setShowMetric(Boolean(v))}
              />
              <label htmlFor="metric" className="text-muted-foreground">
                Show metric
              </label>
            </div>
          </CardHeader>
          <CardContent>
            <Ingredients ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="instructions">
        <Card>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {instructions.length === 0 ? (
              <p className="text-muted-foreground text-sm">No instructions provided.</p>
            ) : (
              <ol className="relative max-w-3xl mx-auto space-y-6">
                {instructions.map((step, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="nutrition">
        <Card>
          <CardHeader>
            <CardTitle>Nutrition facts</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardContent>
            <NutritionFactsPanel nutrition={canonNutrition} servings={servings} />
            <div className="mt-2 flex flex-wrap gap-2">
              {dietTags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tips">
        <Card>
          <CardHeader>
            <CardTitle>Chef tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Try swapping or adding your favorite herbs and spices. Adjust seasoning to taste.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
