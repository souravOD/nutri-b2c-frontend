"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Search, X, SlidersHorizontal, ChevronDown, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { apiSearchRecipes, apiRejectRecipe, apiGetPopularRecipes, apiGetRecentlyViewed } from "@/lib/api"
import { useFilters } from "@/hooks/use-filters"
import { useSettings } from "@/hooks/use-settings"
import { useToast } from "@/hooks/use-toast"
import { rank } from "@/lib/recommendation"
import type { ScoredRecipe } from "@/lib/recommendation"
import type { Recipe } from "@/lib/types"

import { FilterChip } from "@/components/search/filter-chip"
import { SortSheet, type SortValue } from "@/components/search/sort-sheet"
import { FiltersPanel, type SearchFilterState, EMPTY_FILTERS } from "@/components/search/filters-panel"
import { SearchSuggestions } from "@/components/search/search-suggestions"
import { RecipeCardSearch } from "@/components/search/recipe-card-search"
import { LogMealModal } from "@/components/meal/log-meal-modal"
import type { MealType } from "@/lib/types"
import { apiAddMealItem } from "@/lib/api"

/* ── Constants ── */

const POPULAR_RECIPES_FALLBACK = [
  "Low Carb",
  "High Protein",
  "Vegetarian",
  "15-Min Meals",
  "Gluten Free",
  "Breakfast Ideas",
]

const POPULAR_CATEGORIES = ["Keto", "High Protein", "Under 30 mins"]

const RECENT_SEARCHES_KEY = "nutri-recent-searches"

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]")
  } catch {
    return []
  }
}

function saveRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  const recent = getRecentSearches().filter((s: string) => s !== query)
  recent.unshift(query)
  try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 10))) } catch { }
}

function clearRecentSearches() {
  if (typeof window === "undefined") return;
  try { localStorage.removeItem(RECENT_SEARCHES_KEY) } catch { }
}

/* ── Map FilterState → API SearchFilters ── */

function mapFiltersToApi(f: SearchFilterState) {
  const mapped: Record<string, any> = {
    dietaryRestrictions: f.diets,
    allergens: f.allergens,
    cuisines: f.cuisines,
    majorConditions: f.healthConditions,
    maxTime: f.cookingTime ?? undefined,
    mealType: f.mealType.length === 1 ? f.mealType[0].toLowerCase() : undefined,
    calories: [0, 1200] as [number, number],
    proteinMin: 0,
    carbsMin: 0,
    fatMin: 0,
    fiberMin: 0,
    sugarMax: 100,
    sodiumMax: 4000,
    satfatMax: undefined,
    q: undefined,
    difficulty: undefined,
  }

  // Nutrition goals
  if (f.nutritionGoal === "high_protein") mapped.proteinMin = 25
  if (f.nutritionGoal === "low_carb") mapped.calories = [0, 1200]  // kept default, carbs not filterable directly
  if (f.nutritionGoal === "low_calorie") mapped.calories = [0, 400]

  return mapped
}

/* ── Active filter chips ── */

function getActiveChips(f: SearchFilterState): Array<{ label: string; remove: () => SearchFilterState }> {
  const chips: Array<{ label: string; remove: () => SearchFilterState }> = []
  f.mealType.forEach((m) =>
    chips.push({ label: m, remove: () => ({ ...f, mealType: f.mealType.filter((x) => x !== m) }) })
  )
  f.diets.forEach((d) =>
    chips.push({ label: d, remove: () => ({ ...f, diets: f.diets.filter((x) => x !== d) }) })
  )
  f.allergens.forEach((a) =>
    chips.push({ label: `No ${a}`, remove: () => ({ ...f, allergens: f.allergens.filter((x) => x !== a) }) })
  )
  f.healthConditions.forEach((h) =>
    chips.push({ label: h, remove: () => ({ ...f, healthConditions: f.healthConditions.filter((x) => x !== h) }) })
  )
  if (f.nutritionGoal) {
    const labels: Record<string, string> = { high_protein: "High Protein", low_carb: "Low Carb", low_calorie: "Low Calorie" }
    chips.push({ label: labels[f.nutritionGoal] ?? f.nutritionGoal, remove: () => ({ ...f, nutritionGoal: null }) })
  }
  if (f.cookingTime != null) {
    chips.push({ label: `Under ${f.cookingTime}m`, remove: () => ({ ...f, cookingTime: null }) })
  }
  f.cuisines.forEach((c) =>
    chips.push({ label: c, remove: () => ({ ...f, cuisines: f.cuisines.filter((x) => x !== c) }) })
  )
  return chips
}

/* ── Page Component ── */

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { filters: legacyFilters, setFilters: setLegacyFilters, resetFilters } = useFilters()
  const { settings } = useSettings()
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  // State
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [committed, setCommitted] = useState(!!searchParams.get("q"))
  const [focused, setFocused] = useState(false)
  const [sortBy, setSortBy] = useState<SortValue>("relevance")
  const [sortOpen, setSortOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterState, setFilterState] = useState<SearchFilterState>(EMPTY_FILTERS)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [logOpen, setLogOpen] = useState(false)
  const [logRecipe, setLogRecipe] = useState<Recipe | null>(null)

  useEffect(() => { setRecentSearches(getRecentSearches()) }, [])

  // Debounced query for suggestions
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  // Active filter chips
  const activeChips = useMemo(() => getActiveChips(filterState), [filterState])
  const hasFilters = activeChips.length > 0

  // Map filter state for the search API
  const apiFilters = useMemo(() => mapFiltersToApi(filterState), [filterState])

  // Search query
  const {
    data: searchResults = [],
    isLoading,
  } = useQuery({
    queryKey: ["search", committed ? query : "", apiFilters, sortBy],
    queryFn: async (): Promise<ScoredRecipe[]> => {
      if (!query && !hasFilters) return []
      const rawResults = await apiSearchRecipes({ q: query, filters: apiFilters as any, sort: sortBy })
      if (rawResults.length > 0) {
        return rank(rawResults, settings)
      }
      return rawResults.map((r) => ({ ...r, score: 0 }))
    },
    enabled: committed || hasFilters,
  })

  // Suggestions from debounced query
  const {
    data: suggestions = [],
  } = useQuery({
    queryKey: ["suggestions", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return []
      const results = await apiSearchRecipes({ q: debouncedQuery, filters: apiFilters as any, sort: "relevance" })
      return results.slice(0, 4).map((r) => ({ text: r.title || "Untitled", type: "recipe" as const }))
    },
    enabled: focused && !!debouncedQuery && debouncedQuery.length >= 2 && !committed,
  })

  const handleSubmit = useCallback((q: string) => {
    if (!q.trim()) return
    setQuery(q.trim())
    setCommitted(true)
    setFocused(false)
    saveRecentSearch(q.trim())
    setRecentSearches(getRecentSearches())
    router.push(`/search?q=${encodeURIComponent(q.trim())}`)
  }, [router])

  // Popular / Trending recipes from API
  const { data: popularRecipes = [] } = useQuery({
    queryKey: ["popular-recipes"],
    queryFn: () => apiGetPopularRecipes(8),
    staleTime: 5 * 60 * 1000,
  })

  // Recently Viewed from API
  const { data: recentlyViewed = [] } = useQuery({
    queryKey: ["recently-viewed"],
    queryFn: () => apiGetRecentlyViewed(6),
    staleTime: 2 * 60 * 1000,
  })

  const clearAll = () => {
    setQuery("")
    setCommitted(false)
    setFilterState(EMPTY_FILTERS)
    resetFilters()
    router.push("/search")
  }

  const handleAddToLog = (recipe: Recipe) => {
    setLogRecipe(recipe)
    setLogOpen(true)
  }

  const handleLogConfirm = async (recipeId: string, mealType: MealType, servings: number) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      await apiAddMealItem({ date: today, mealType, recipeId, servings })
      toast({ title: "Meal logged!", description: "Added to your meal log." })
      setLogOpen(false)
    } catch {
      toast({ title: "Failed to log meal", variant: "destructive" })
    }
  }

  const handleNotForMe = async (recipeId: string) => {
    try {
      await apiRejectRecipe(recipeId)
    } catch {
      // silently fail
    }
  }

  const handleApplyFilters = (f: SearchFilterState) => {
    setFilterState(f)
    if (!committed && query) setCommitted(true)
    // Sync with legacy filters for API compatibility
    setLegacyFilters({
      ...legacyFilters,
      dietaryRestrictions: f.diets,
      allergens: f.allergens,
      cuisines: f.cuisines,
      majorConditions: f.healthConditions,
      maxTime: f.cookingTime ?? 120,
      mealType: f.mealType[0]?.toLowerCase() || "",
    })
  }

  // Determine page state
  const showResults = committed || hasFilters
  const showSuggestions = focused && query.length >= 2 && !committed
  const showEmpty = !showResults && !showSuggestions

  return (
    <div className="min-h-screen bg-[#F8FAFC] lg:bg-gradient-to-b lg:from-white lg:to-[#F1F5F9]" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        {/* ── Header ── */}
        {showResults ? (
          /* Results header: back + query + search */
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9]">
            <button type="button" onClick={clearAll} className="p-1">
              <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
            </button>
            <span className="flex-1 text-[16px] font-semibold text-[#0F172A] truncate">{query || "Filtered results"}</span>
            <button type="button" onClick={() => { setCommitted(false); setFocused(true); inputRef.current?.focus() }} className="p-1">
              <Search className="w-5 h-5 text-[#0F172A]" />
            </button>
          </div>
        ) : (
          /* Search header */
          <div className="px-5 pt-4 pb-2 lg:px-8 lg:pt-8 bg-white">
            <div className="flex items-center gap-3 mb-4">
              <button type="button" onClick={() => router.back()} className="p-1">
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
              </button>
              <h1 className="text-[20px] lg:text-[24px] font-bold text-[#0F172A]">Search Recipes</h1>
            </div>

            {/* Search input */}
            <div className="relative flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for meals, ingredients..."
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setCommitted(false) }}
                  onFocus={() => setFocused(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(query)}
                  className="w-full h-[52px] lg:h-[56px] pl-12 pr-10 rounded-[16px] border-2 border-[#E2E8F0] bg-white text-[15px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#99CC33] focus:ring-4 focus:ring-[#99CC33]/10 transition-all shadow-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setCommitted(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  >
                    <X className="w-4 h-4 text-[#94A3B8]" />
                  </button>
                )}
              </div>
              {focused && (
                <button
                  type="button"
                  onClick={() => { setFocused(false); if (!committed && query) handleSubmit(query) }}
                  className="text-[14px] font-semibold text-[#475569] whitespace-nowrap"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Suggestions dropdown ── */}
        {showSuggestions && (
          <SearchSuggestions
            suggestions={[
              ...recentSearches.filter((s) => s.toLowerCase().includes(query.toLowerCase())).slice(0, 2).map((s) => ({ text: s, type: "recent" as const })),
              ...suggestions,
            ]}
            onSelect={handleSubmit}
            popularCategories={POPULAR_CATEGORIES}
            onCategorySelect={(cat) => handleSubmit(cat)}
          />
        )}

        {/* ── Empty state ── */}
        {showEmpty && !focused && (
          <div className="px-5 py-4 space-y-6 lg:px-8 lg:py-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <section className="lg:bg-white lg:rounded-[20px] lg:p-6 lg:shadow-sm lg:border lg:border-[#F1F5F9]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Recent Searches</h3>
                  <button
                    type="button"
                    onClick={() => { clearRecentSearches(); setRecentSearches([]) }}
                    className="text-[13px] font-semibold text-[#99CC33] hover:text-[#7AA822] transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSubmit(s)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all shadow-sm"
                    >
                      {s}
                      <X
                        className="w-3 h-3 text-[#CBD5E1]"
                        onClick={(e) => {
                          e.stopPropagation()
                          const updated = recentSearches.filter((r) => r !== s)
                          try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)) } catch { }
                          setRecentSearches(updated)
                        }}
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Popular / Trending Recipes from API */}
            <section className="lg:bg-white lg:rounded-[20px] lg:p-6 lg:shadow-sm lg:border lg:border-[#F1F5F9]">
              <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">🔥 Trending Now</h3>
              {popularRecipes.length > 0 ? (
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {popularRecipes.map((r: any) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => handleSubmit(r.title ?? "recipe")}
                      className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-full border-2 border-[#99CC33] text-[13px] lg:text-[14px] font-semibold text-[#538100] hover:bg-[#F0F7E6] hover:shadow-sm transition-all"
                    >
                      {r.title ?? "Untitled"}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {POPULAR_RECIPES_FALLBACK.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSubmit(tag)}
                      className="px-4 py-2 lg:px-5 lg:py-2.5 rounded-full border-2 border-[#99CC33] text-[13px] lg:text-[14px] font-semibold text-[#538100] hover:bg-[#F0F7E6] hover:shadow-sm transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Recently Viewed from API */}
            {recentlyViewed.length > 0 && (
              <section className="lg:bg-white lg:rounded-[20px] lg:p-6 lg:shadow-sm lg:border lg:border-[#F1F5F9]">
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Recently Viewed</h3>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {recentlyViewed.map((item: any) => (
                    <button
                      key={item.recipe?.id ?? item.history?.id}
                      type="button"
                      onClick={() => handleSubmit(item.recipe?.title ?? "")}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-[#E2E8F0] bg-white text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all shadow-sm"
                    >
                      {item.recipe?.imageUrl && (
                        <Image
                          src={item.recipe.imageUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="rounded-full object-cover"
                        />
                      )}
                      {item.recipe?.title ?? "Untitled"}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Daily Suggestion */}
            <section className="lg:bg-white lg:rounded-[20px] lg:p-6 lg:shadow-sm lg:border lg:border-[#F1F5F9]">
              <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Daily Suggestion</h3>
              <div className="rounded-[16px] overflow-hidden border border-[#F1F5F9] bg-white shadow-sm max-w-sm lg:max-w-md">
                <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-[#F8FAFC] to-[#E8F5E9] flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-[#99CC33] mx-auto mb-2" />
                    <p className="text-[#94A3B8] text-[14px] font-medium">Coming Soon</p>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[11px] font-semibold text-[#99CC33] uppercase mb-1">Personalized</p>
                  <p className="text-[15px] font-bold text-[#0F172A]">Your daily recommendation</p>
                  <p className="text-[13px] text-[#64748B] mt-0.5">Sign in to see personalized suggestions</p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── Results view ── */}
        {showResults && (
          <div className="px-4 pb-28 lg:px-8">
            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex overflow-x-auto gap-2 py-3 scrollbar-hide">
                {activeChips.map((chip, i) => (
                  <FilterChip
                    key={`${chip.label}-${i}`}
                    label={chip.label}
                    onRemove={() => setFilterState(chip.remove())}
                  />
                ))}
              </div>
            )}

            {/* Sort + Filter row */}
            <div className="flex items-center justify-between py-3">
              <button
                type="button"
                onClick={() => setSortOpen(true)}
                className="flex items-center gap-1 text-[13px] font-semibold text-[#475569]"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Sort: {sortBy === "relevance" ? "Relevance" : sortBy === "time" ? "Cooking Time" : sortBy === "calories" ? "Calories" : "Protein"}
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#99CC33] text-white text-[13px] font-bold"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeChips.length > 0 && (
                  <span className="ml-0.5 w-5 h-5 rounded-full bg-white/20 text-[11px] flex items-center justify-center">
                    {activeChips.length}
                  </span>
                )}
              </button>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[280px] animate-pulse rounded-[16px] bg-[#F1F5F9]" />
                ))}
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                  <Search className="w-8 h-8 text-[#CBD5E1]" />
                </div>
                <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">No recipes found</h3>
                <p className="text-[14px] text-[#64748B] mb-6">Try different keywords or adjust your filters</p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="px-6 py-2.5 rounded-full border-2 border-[#99CC33] text-[#538100] text-[14px] font-bold hover:bg-[#F0F7E6] transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Result count */}
                <p className="text-[13px] text-[#64748B]">
                  {searchResults.length} results{query ? ` for '${query}'` : ""}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Cards */}
                  {searchResults.map((recipe) => (
                    <RecipeCardSearch
                      key={recipe.id}
                      recipe={recipe}
                      onAddToLog={handleAddToLog}
                      onNotForMe={handleNotForMe}
                    />
                  ))}
                </div>

                {/* Daily Suggestion at bottom */}
                <section className="mt-6 pt-4 border-t border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    <h3 className="text-[16px] font-bold text-[#0F172A]">Daily Suggestion</h3>
                  </div>
                  <div className="rounded-[16px] overflow-hidden border border-[#F1F5F9] bg-white shadow-sm p-4 max-w-md">
                    <p className="text-[14px] text-[#94A3B8] text-center py-4">Coming Soon</p>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* ── Sort Sheet ── */}
        <SortSheet
          open={sortOpen}
          onOpenChange={setSortOpen}
          value={sortBy}
          onSelect={setSortBy}
        />

        {/* ── Filters Panel ── */}
        <FiltersPanel
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          filters={filterState}
          onApply={handleApplyFilters}
        />

        {/* ── Log Meal Modal ── */}
        <LogMealModal
          recipe={logRecipe}
          open={logOpen}
          onOpenChange={setLogOpen}
          onConfirm={handleLogConfirm}
        />
      </div>
    </div>
  )
}
