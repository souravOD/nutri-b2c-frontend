"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetTrigger } from "@/components/ui/sheet"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { useFilters } from "@/hooks/use-filters"
import { useSettings } from "@/hooks/use-settings"
import { FilterPanel } from "@/components/filter-panel"
import { RecipeCard } from "@/components/recipe-card"
import { apiSearchRecipes } from "@/lib/api"
import { rank } from "@/lib/recommendation"
import type { ScoredRecipe } from "@/lib/recommendation"
import type { SortOption } from "@/lib/types"
import { useFavorites } from "@/hooks/use-favorites"

const toSortOption = (v: unknown): SortOption =>
  v === "time" || v === "relevance" || v === "popular" ? (v as SortOption) : "time";

const SORT_OPTIONS = [
  { value: "time" as const, label: "Cooking Time" },
  { value: "calories" as const, label: "Calories" },
  { value: "protein" as const, label: "Protein" },
  { value: "rating" as const, label: "Rating" },
  { value: "name" as const, label: "Name" },
]

const POPULAR_SEARCHES = [
  "Chicken breast",
  "Vegetarian pasta",
  "Low carb dinner",
  "Quick breakfast",
  "Healthy snacks",
]

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { filters, setFilters, resetFilters } = useFilters()
  const { settings } = useSettings()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || filters.q || "")
  const [sortBy, setSortBy] = useState<SortOption>(settings.behavior.defaultSort || "time")
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Update search query from URL params
  useEffect(() => {
    const urlQuery = searchParams.get("q")
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery)
      setFilters({ ...filters, q: urlQuery })
    }
  }, [searchParams])

  useEffect(() => {
    setSortBy(settings.behavior.defaultSort || "time")
  }, [settings.behavior.defaultSort])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.dietaryRestrictions.length > 0 ||
      filters.allergens.length > 0 ||
      filters.cuisines.length > 0 ||
      filters.majorConditions.length > 0 ||
      filters.calories[0] > 0 ||
      filters.calories[1] < 1200 ||
      filters.proteinMin > 0 ||
      filters.carbsMin > 0 ||
      filters.fatMin > 0 ||
      filters.fiberMin > 0 ||
      filters.sugarMax < 100 ||
      filters.sodiumMax < 4000 ||
      filters.maxTime < 120 ||
      !!filters.mealType
    )
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.dietaryRestrictions.length > 0) count++
    if (filters.allergens.length > 0) count++
    if (filters.cuisines.length > 0) count++
    if (filters.majorConditions.length > 0) count++
    if (filters.calories[0] > 0 || filters.calories[1] < 1200) count++
    if (filters.proteinMin > 0) count++
    if (filters.carbsMin > 0) count++
    if (filters.fatMin > 0) count++
    if (filters.fiberMin > 0) count++
    if (filters.sugarMax < 100) count++
    if (filters.sodiumMax < 4000) count++
    if (filters.maxTime < 120) count++
    if (filters.mealType) count++
    return count
  }, [filters])

  const {
    data: searchResults = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["search", searchQuery, filters, sortBy, settings],
    queryFn: async (): Promise<ScoredRecipe[]> => {
      if (!searchQuery && !hasActiveFilters) return []

      const rawResults = await apiSearchRecipes({ q: searchQuery, filters, sort: sortBy })

      if (rawResults.length > 0) {
        const rankedResults = rank(rawResults, settings)
        return rankedResults
      }

      return rawResults.map((recipe) => ({ ...recipe, score: 0 }))
    },
    enabled: !!(searchQuery || hasActiveFilters),
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters({ ...filters, q: query })
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const handlePopularSearch = (query: string) => {
    handleSearch(query)
  }

  const clearAllFilters = () => {
    resetFilters()
    setSearchQuery("")
    router.push("/search")
  }

  const removeFilter = (type: string, value?: string) => {
    const newFilters = { ...filters }
    switch (type) {
      case "diet":
        newFilters.dietaryRestrictions = newFilters.dietaryRestrictions.filter((d) => d !== value)
        break
      case "allergen":
        newFilters.allergens = newFilters.allergens.filter((a) => a !== value)
        break
      case "cuisine":
        newFilters.cuisines = newFilters.cuisines.filter((c) => c !== value)
        break
      case "calories":
        newFilters.calories = [0, 1200]
        break
      case "protein":
        newFilters.proteinMin = 0
        break
      case "carbs":
        newFilters.carbsMin = 0
        break
      case "fat":
        newFilters.fatMin = 0
        break
      case "fiber":
        newFilters.fiberMin = 0
        break
      case "sugar":
        newFilters.sugarMax = 100
        break
      case "sodium":
        newFilters.sodiumMax = 4000
        break
      case "time":
        newFilters.maxTime = 120
        break
    }
    setFilters(newFilters)
  }

  const showResults = searchQuery || hasActiveFilters

  return (
    <div className="container px-4 py-6 max-w-6xl">
      <div className="space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Search Recipes</h1>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              role="search"
              placeholder="Search recipes, ingredients, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
              className="pl-10 pr-4 h-12 text-lg"
            />
          </div>

          {/* Search Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={() => handleSearch(searchQuery)} size="sm">
              Search
            </Button>

            {/* Filter Button */}
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="relative bg-transparent">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <FilterPanel
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                initialValues={{
                  ...filters,
                  mealType: (filters.mealType as any) || "",
                }}
                onApply={(values) => setFilters(values)}
                onReset={resetFilters}
              />
            </Sheet>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Popular Searches */}
        {!showResults && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Searches</CardTitle>
              <CardDescription>Try these popular recipe searches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((search) => (
                  <Button
                    key={search}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePopularSearch(search)}
                    className="h-8"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Active Filters</h3>
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2" role="region" aria-live="polite" aria-label="Active filters">
              {filters.dietaryRestrictions.map((diet) => (
                <Badge key={diet} variant="secondary" className="gap-1">
                  {diet}
                  <button
                    onClick={() => removeFilter("diet", diet)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                    aria-label={`Remove ${diet} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.allergens.map((allergen) => (
                <Badge key={allergen} variant="destructive" className="gap-1">
                  No {allergen}
                  <button
                    onClick={() => removeFilter("allergen", allergen)}
                    className="ml-1 hover:bg-destructive-foreground/20 rounded-full p-0.5"
                    aria-label={`Remove ${allergen} allergen filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.cuisines.map((cuisine) => (
                <Badge key={cuisine} variant="outline" className="gap-1">
                  {cuisine}
                  <button
                    onClick={() => removeFilter("cuisine", cuisine)}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label={`Remove ${cuisine} cuisine filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(filters.calories[0] > 0 || filters.calories[1] < 1200) && (
                <Badge variant="outline" className="gap-1">
                  {filters.calories[0]}-{filters.calories[1]} cal
                  <button
                    onClick={() => removeFilter("calories")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label="Remove calories filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.proteinMin > 0 && (
                <Badge variant="outline" className="gap-1">
                  {filters.proteinMin}g+ protein
                  <button
                    onClick={() => removeFilter("protein")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label="Remove protein filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.maxTime < 120 && (
                <Badge variant="outline" className="gap-1">
                  ≤{filters.maxTime}min
                  <button
                    onClick={() => removeFilter("time")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                    aria-label="Remove time filter"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Results Header */}
        {showResults && (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {isLoading ? "Searching..." : `${searchResults.length} recipes found`}
                {searchQuery && <span className="text-muted-foreground font-normal"> for "{searchQuery}"</span>}
              </h2>
            </div>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : error ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">Something went wrong while searching.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : searchResults.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">No recipes found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search terms or filters to find more recipes.
                    </p>
                  </div>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear filters
                    </Button>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Clear search
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    id={recipe.id}
                    title={recipe.title}
                    imageUrl={recipe.imageUrl}
                    prepTime={recipe.prepTime}
                    cookTime={recipe.cookTime}
                    servings={recipe.servings}
                    difficulty={recipe.difficulty}
                    isSaved={isFavorite(recipe.id)}
                    tags={recipe.tags}
                    score={settings.behavior.showScoreBadge ? recipe.score : undefined}
                    onSave={(id) => {
                      void toggleFavorite(id)
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
