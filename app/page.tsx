"use client"

import { useMemo, useState, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RecipeCard } from "@/components/recipe-card"
import { Button } from "@/components/ui/button"
import { apiGetFeed, apiSearchRecipes } from "@/lib/api"
import { useFilters } from "@/hooks/use-filters"
import { FilterPanel, type FiltersFormValues } from "@/components/filter-panel"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"
import type { Difficulty, Recipe } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"

const QUICK_FILTERS = [
  { label: "Breakfast", mealType: "breakfast" },
  { label: "Lunch", mealType: "lunch" },
  { label: "Dinner", mealType: "dinner" },
] as const

type FeedItemRecord = Record<string, unknown>

const asRecord = (value: unknown): FeedItemRecord =>
  value && typeof value === "object" ? (value as FeedItemRecord) : {}

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []

const toDifficulty = (value: unknown): Difficulty =>
  value === "easy" || value === "medium" || value === "hard" ? value : "easy"

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export default function HomePage() {
  const { user } = useUser()
  const { filters, setFilters, resetFilters } = useFilters()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const qc = useQueryClient()
  const { isFavorite, toggleFavorite } = useFavorites()

  const queryKey = useMemo(() => ["recipes", filters], [filters])

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Recipe[]> => {
      const hasAny =
        !!filters.q ||
        filters.dietaryRestrictions.length > 0 ||
        filters.allergens.length > 0 ||
        filters.cuisines.length > 0 ||
        filters.calories[0] > 0 ||
        filters.calories[1] < 1200 ||
        filters.proteinMin > 0 ||
        filters.carbsMin > 0 ||
        filters.fatMin > 0 ||
        filters.maxTime < 120 ||
        !!filters.mealType
      if (hasAny) {
        return apiSearchRecipes({ q: filters.q, filters })
      }
      return apiGetFeed()
    },
  })

  // Background invalidation helper; do not call apiToggleSave here when using Favorites context,
  // otherwise you'll double-toggle (save then immediately unsave).
  const invalidateSaved = useCallback(() => {
    qc.invalidateQueries({ queryKey })
    qc.invalidateQueries({ queryKey: ["saved"] })
  }, [qc, queryKey])

  function handleApply(values: FiltersFormValues) {
    setFilters(values)
  }

  function handleQuickFilterClick(item: (typeof QUICK_FILTERS)[number]) {
    const next = { ...filters, q: "", dietaryRestrictions: [], mealType: item.mealType }
    setFilters(next)
  }

  return (
    <div className="px-4 py-6 space-y-6">
      <section aria-label="Hero">
        <h1 className="text-2xl sm:text-3xl font-bold">Welcome{user ? `, ${user.name}` : ""}!</h1>
        <p className="text-muted-foreground">Discover recipes tailored to your dietary needs.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.label}
              className={cn(
                "rounded-full border px-3 py-1 text-sm hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filters.mealType === f.mealType ? "bg-accent" : undefined,
              )}
              onClick={() => handleQuickFilterClick(f)}
            >
              {f.label}
            </button>
          ))}
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen(true)}>
            Filters
          </Button>
        </div>
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Recommended for You</h2>
        </div>
      </section>

      <section aria-label="Recipe grid">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border p-6 text-center">
            <p className="mb-2 font-medium">No recipes found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetFilters()
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item, i) => {
              const itemRecord = asRecord(item)
              const recipeRecord = asRecord(itemRecord.recipe ?? itemRecord)
              const recipeId = typeof recipeRecord.id === "string" ? recipeRecord.id : "no-id"
              const title =
                typeof recipeRecord.title === "string"
                  ? recipeRecord.title
                  : typeof recipeRecord.name === "string"
                    ? recipeRecord.name
                    : "Untitled"
              const prepTime = toNumber(
                recipeRecord.prep_time_minutes ?? recipeRecord.time_minutes ?? recipeRecord.total_time_minutes,
              )
              const cookTime = toNumber(recipeRecord.cook_time_minutes, 0)
              const servings = toNumber(recipeRecord.servings, 1)
              const difficulty = toDifficulty(
                typeof recipeRecord.difficulty === "string"
                  ? recipeRecord.difficulty.toLowerCase()
                  : recipeRecord.difficulty,
              )
              const imageUrl =
                typeof recipeRecord.image_url === "string"
                  ? recipeRecord.image_url
                  : typeof recipeRecord.imageUrl === "string"
                    ? recipeRecord.imageUrl
                    : null
              const tags = asStringArray(recipeRecord.diet_tags ?? recipeRecord.tags)
              const isSaved = Boolean(recipeRecord.is_saved ?? recipeRecord.isSaved)

              return (
                <RecipeCard
                  key={`${recipeId}-${i}`}
                  id={recipeId}
                  title={title}
                  imageUrl={imageUrl}
                  prepTime={prepTime}
                  cookTime={cookTime}
                  servings={servings}
                  difficulty={difficulty}
                  isSaved={isFavorite(recipeId) || isSaved}
                  tags={tags}
                  onSave={async (id) => {
                    await toggleFavorite(id)
                    invalidateSaved()
                  }}
                />
              )
            })}
          </div>
        )}
      </section>

      <FilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        initialValues={{
          dietaryRestrictions: filters.dietaryRestrictions,
          allergens: filters.allergens,
          calories: filters.calories,
          proteinMin: filters.proteinMin,
          carbsMin: filters.carbsMin,
          fatMin: filters.fatMin,
          fiberMin: filters.fiberMin,
          sugarMax: filters.sugarMax,
          sodiumMax: filters.sodiumMax,
          maxTime: filters.maxTime,
          cuisines: filters.cuisines,
          majorConditions: filters.majorConditions,
          q: filters.q,
          mealType: typeof filters.mealType === "string" ? filters.mealType : "",
        }}
        onApply={handleApply}
        onReset={() => resetFilters()}
      />
    </div>
  )
}
