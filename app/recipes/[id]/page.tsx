"use client"

import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiGetRecipe, apiToggleSave, apiAddMealItem } from "@/lib/api"
import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/hooks/use-favorites"
import { useHistory } from "@/hooks/use-history"
import { UtensilsCrossed, BookOpen } from "lucide-react"
import type { Recipe, MealType } from "@/lib/types"

import { RecipeDetailHero } from "@/components/recipe/recipe-hero"
import { AtAGlance } from "@/components/recipe/at-a-glance"
import { IngredientList, type IngredientItem } from "@/components/recipe/ingredient-list"
import { StepCard } from "@/components/recipe/step-card"
import { NutritionInfo } from "@/components/recipe/nutrition-info"
import { StartCookingOverlay } from "@/components/start-cooking-overlay"
import { LogMealModal } from "@/components/meal/log-meal-modal"

/* ── Helpers ── */

type ApiRecipe = Awaited<ReturnType<typeof apiGetRecipe>>

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {}

const firstImage = (images: unknown): string | undefined => {
  if (!Array.isArray(images)) return undefined
  return images.find((item): item is string => typeof item === "string" && item.length > 0)
}

function normalizeSteps(recipe: { instructions?: unknown; steps?: unknown }): string[] {
  const fromInstructions = Array.isArray(recipe.instructions) ? recipe.instructions : []
  if (fromInstructions.length > 0) {
    return fromInstructions
      .map((entry) => {
        if (typeof entry === "string") return entry
        if (entry && typeof entry === "object") {
          const source = entry as Record<string, unknown>
          const text = source.text ?? source.step
          if (typeof text === "string") return text
        }
        return ""
      })
      .filter((step) => step.trim().length > 0)
  }
  const fromSteps = Array.isArray(recipe.steps) ? recipe.steps : []
  return fromSteps.filter((step): step is string => typeof step === "string" && step.trim().length > 0)
}

function normalizeIngredients(recipe: { ingredients?: unknown }): IngredientItem[] {
  const raw = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
  return raw.map((ing) => {
    if (typeof ing === "string") {
      // Try to split "200g Pasta" into quantity + name
      const match = ing.match(/^([\d.,/]+\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|units?|pieces?|slices?)?)\s+(.+)$/i)
      if (match) return { quantity: match[1].trim(), name: match[2].trim() }
      return { name: ing }
    }
    if (ing && typeof ing === "object") {
      const obj = ing as Record<string, unknown>
      const name = (obj.name ?? obj.ingredient ?? obj.text ?? "") as string
      const qty = (obj.quantity ?? obj.amount ?? obj.measure ?? "") as string
      const unit = (obj.unit ?? "") as string
      const quantityStr = unit ? `${qty} ${unit}`.trim() : String(qty).trim()
      return { name, quantity: quantityStr || undefined }
    }
    return { name: String(ing) }
  })
}

/* ── Page ── */

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const id = params?.id ?? ""
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [cookingOpen, setCookingOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const { addToHistory } = useHistory()

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery<ApiRecipe>({
    queryKey: ["recipe", id],
    queryFn: () => apiGetRecipe(id),
    retry: 2,
  })

  useEffect(() => {
    if (recipe?.id) addToHistory(recipe.id)
  }, [recipe?.id, addToHistory])

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!recipe?.id) return
      const rid = recipe.id
      await apiToggleSave(rid)
      if (isFavorite(rid)) removeFavorite(rid)
      else addFavorite(rid)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] })
      toast({ title: "Saved", description: "Recipe save state updated." })
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update saved state.", variant: "destructive" })
    },
  })

  const handleLogConfirm = useCallback(
    async (recipeId: string, mealType: MealType, servings: number, memberIds?: string[]) => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        if (memberIds?.length) {
          await Promise.all(memberIds.map(mid =>
            apiAddMealItem({ date: today, mealType, recipeId, servings, memberId: mid })
          ))
        } else {
          await apiAddMealItem({ date: today, mealType, recipeId, servings })
        }
        toast({ title: "Meal logged!", description: "Added to your meal log for today." })
        setLogOpen(false)
      } catch {
        toast({ title: "Failed to log meal", variant: "destructive" })
      }
    },
    [toast]
  )

  /* ── Loading / Error ── */

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[480px] lg:max-w-5xl px-0 lg:px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-[280px] bg-[#F1F5F9] rounded-b-[24px]" />
          <div className="px-5 space-y-4">
            <div className="h-8 w-3/4 bg-[#F1F5F9] rounded" />
            <div className="h-4 w-full bg-[#F1F5F9] rounded" />
            <div className="h-4 w-2/3 bg-[#F1F5F9] rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="mx-auto w-full max-w-[480px] lg:max-w-5xl px-5 py-8 text-center">
        <p className="text-red-500 mb-4">Could not load the recipe.</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#99CC33] font-semibold underline"
        >
          Go back
        </button>
      </div>
    )
  }

  /* ── Derived data ── */

  const recipeImages = asRecord(recipe).images
  const imageUrl = recipe.image_url ?? firstImage(recipeImages)
  const recipeTitle = recipe.title ?? "Untitled"
  const steps = normalizeSteps(recipe)
  const ingredients = normalizeIngredients(recipe as { ingredients?: unknown })
  const totalTime = recipe.total_time_minutes ?? (((Number(recipe.prep_time_minutes ?? 0)) + (Number(recipe.cook_time_minutes ?? 0))) || undefined)
  const saved = isFavorite(recipe.id)

  const logRecipe: Recipe = {
    id: recipe.id,
    title: recipeTitle,
    imageUrl: imageUrl ?? undefined,
    image_url: imageUrl ?? undefined,
    calories: recipe.calories ?? undefined,
    prepTime: Number(recipe.prep_time_minutes ?? 0),
    totalTimeMinutes: totalTime,
    servings: recipe.servings ?? undefined,
  }

  return (
    <div
      className="mx-auto w-full max-w-[480px] lg:max-w-3xl lg:px-4 pb-56 lg:pb-24 bg-white min-h-screen"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {/* ── Hero ── */}
      <RecipeDetailHero
        imageUrl={imageUrl}
        title={recipeTitle}
        isSaved={saved}
        onToggleSave={() => toggleSave.mutate()}
      />

      {/* ── Content ── */}
      <div className="px-5 lg:px-0 mt-5 space-y-8">
        {/* Title + Description */}
        <div>
          <h1 className="text-[24px] font-bold text-[#0F172A] leading-8 mb-2">
            {recipeTitle}
          </h1>
          {recipe.description && (
            <p className="text-[14px] text-[#64748B] leading-6">
              {recipe.description}
            </p>
          )}
        </div>

        {/* At a Glance */}
        <AtAGlance
          servings={recipe.servings ?? undefined}
          prepTimeMinutes={recipe.prep_time_minutes != null ? Number(recipe.prep_time_minutes) : undefined}
          cookTimeMinutes={recipe.cook_time_minutes != null ? Number(recipe.cook_time_minutes) : undefined}
          totalTimeMinutes={totalTime}
          difficulty={recipe.difficulty ?? undefined}
          caloriesPerServing={recipe.calories ?? undefined}
        />

        {/* Nutrition — right below At a Glance */}
        <NutritionInfo
          calories={recipe.calories ?? undefined}
          fat={recipe.fat_g ?? undefined}
          protein={recipe.protein_g ?? undefined}
          carbs={recipe.carbs_g ?? undefined}
          fiber={recipe.fiber_g ?? undefined}
          sugar={recipe.sugar_g ?? undefined}
          sodium={recipe.sodium_mg ?? undefined}
          saturatedFat={recipe.saturated_fat_g ?? undefined}
        />

        {/* Ingredients */}
        <IngredientList ingredients={ingredients} />

        {/* Preparation Steps */}
        <div>
          <h3 className="text-[18px] font-bold text-[#0F172A] mb-4">
            Preparation
          </h3>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <StepCard
                key={i}
                stepNumber={i + 1}
                description={step}
                showKeepScreenOn={i === 0}
              />
            ))}
          </div>
        </div>


      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-[72px] lg:bottom-0 left-0 lg:left-[256px] right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-[#F1F5F9] px-5 py-3">
        <div className="mx-auto max-w-[480px] lg:max-w-3xl flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setCookingOpen(true)}
            className="flex-1 py-4 rounded-[48px] bg-[#99CC33] text-white text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#8ABB2A] transition-colors"
            style={{
              boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
            }}
          >
            <UtensilsCrossed className="w-5 h-5" />
            Start Cooking
          </button>
          <button
            type="button"
            onClick={() => setLogOpen(true)}
            className="flex-1 sm:flex-none sm:px-8 py-4 rounded-[48px] border-2 border-[#99CC33] text-[#538100] text-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#F0F7E6] transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            Log Meal
          </button>
        </div>
      </div>

      {/* ── Cooking Overlay ── */}
      <StartCookingOverlay
        open={cookingOpen}
        onOpenChange={setCookingOpen}
        steps={steps}
        recipeTitle={recipeTitle}
        recipeId={id}
        servings={typeof recipe.servings === "number" ? recipe.servings : 1}
        calories={recipe.calories ?? undefined}
        protein={recipe.protein_g ?? undefined}
        carbs={recipe.carbs_g ?? undefined}
      />

      {/* ── Log Meal Modal ── */}
      <LogMealModal
        recipe={logRecipe}
        open={logOpen}
        onOpenChange={setLogOpen}
        onConfirm={handleLogConfirm}
      />
    </div>
  )
}
