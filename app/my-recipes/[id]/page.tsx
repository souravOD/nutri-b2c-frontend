// app/my-recipes/[id]/page.tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { ArrowLeft } from "lucide-react"

import { useUser } from "@/hooks/use-user"
import { apiGetUserRecipe, type UserRecipe } from "@/lib/api"
import type { Difficulty, Recipe } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { RecipeHero } from "@/components/recipe-hero"
import { RecipeTabs } from "@/components/recipe-tabs"
import { StartCookingOverlay } from "@/components/start-cooking-overlay"

type JsonRecord = Record<string, unknown>

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {}

const toDifficulty = (value: unknown): Difficulty =>
  value === "easy" || value === "medium" || value === "hard" ? value : "easy"

export default function MyRecipeDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id?: string }
  const { user } = useUser()
  const uid = user?.$id

  const { data: recipe, isLoading, error } = useQuery<UserRecipe>({
    queryKey: ["my-recipe", id, uid],
    enabled: Boolean(id && uid),
    queryFn: () => apiGetUserRecipe(uid!, id!),
  })

  const [cookingOpen, setCookingOpen] = useState(false)

  // Normalize only what RecipeHero needs (rest can stay snake_case for RecipeTabs)
  const heroRecipe: Recipe = useMemo(() => {
    const r = asRecord(recipe)
    const cuisines = Array.isArray(r.cuisines)
      ? r.cuisines.filter((item): item is string => typeof item === "string")
      : typeof r.cuisine === "string"
        ? [r.cuisine]
        : []

    return {
      id: typeof r.id === "string" ? r.id : "",
      title: typeof r.title === "string" ? r.title : "Untitled",
      description: typeof r.description === "string" ? r.description : undefined,
      imageUrl: typeof r.image_url === "string" ? r.image_url : undefined,
      prepTime: Number(r.prep_time_minutes ?? 0),
      cookTime: Number(r.cook_time_minutes ?? 0),
      servings: Number(r.servings ?? 1),
      difficulty: toDifficulty(r.difficulty),
      tags: [
        ...(Array.isArray(r.tags) ? r.tags.filter((item): item is string => typeof item === "string") : []),
        ...cuisines,
      ],
    }
  }, [recipe])

  const tabsRecipe: Recipe = useMemo(() => {
    const r = asRecord(recipe)
    return {
      id: typeof r.id === "string" ? r.id : "",
      title: typeof r.title === "string" ? r.title : "Untitled",
      description: typeof r.description === "string" ? r.description : undefined,
      image_url: typeof r.image_url === "string" ? r.image_url : undefined,
      imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : undefined,
      servings: typeof r.servings === "number" ? r.servings : undefined,
      total_time_minutes: typeof r.total_time_minutes === "number" ? r.total_time_minutes : undefined,
      prep_time_minutes: typeof r.prep_time_minutes === "number" ? r.prep_time_minutes : undefined,
      cook_time_minutes: typeof r.cook_time_minutes === "number" ? r.cook_time_minutes : undefined,
      difficulty: toDifficulty(r.difficulty),
      cuisines: Array.isArray(r.cuisines)
        ? r.cuisines.filter((item): item is string => typeof item === "string")
        : undefined,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : undefined,
      instructions: Array.isArray(r.instructions) ? r.instructions : undefined,
      nutrition: r.nutrition && typeof r.nutrition === "object" ? (r.nutrition as Recipe["nutrition"]) : undefined,
    }
  }, [recipe])

  // Same steps logic the public page uses, but user_recipes.instructions can be objects -> map to text
  const steps: string[] = Array.isArray(recipe?.instructions)
    ? recipe.instructions
        .map((item) => {
          if (typeof item === "string") return item
          const source = asRecord(item)
          const text = source.text ?? source.step ?? ""
          return typeof text === "string" ? text : String(text)
        })
        .filter((step) => step.length > 0)
    : []

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: heroRecipe.title,
        text: heroRecipe.description ?? "",
        url: location.href,
      })
    } catch {
      // ignore
    }
  }

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading...</div>
  if (error) return <div className="p-6 text-destructive">Failed to load recipe.</div>
  if (!recipe) return <div className="p-6">Recipe not found.</div>

  return (
    <div className="mx-auto w-full max-w-6xl lg:max-w-7xl px-4 py-8 space-y-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to recipes
        </Button>
      </div>

      <div className="space-y-10">
        <RecipeHero recipe={heroRecipe} onToggleSave={() => {}} onShare={handleShare} />

        <RecipeTabs recipe={tabsRecipe} />

        <div className="flex justify-center pt-6">
          <Button size="lg" onClick={() => setCookingOpen(true)}>
            Start Cooking
          </Button>
        </div>
      </div>

      <StartCookingOverlay
        open={cookingOpen}
        onOpenChange={setCookingOpen}
        steps={steps}
        recipeTitle={heroRecipe.title}
        recipeId={id}
        servings={heroRecipe.servings ?? 1}
      />
    </div>
  )
}
