"use client"

import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiGetRecipe, apiToggleSave } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { StartCookingOverlay } from "@/components/start-cooking-overlay"
import { RecipeHero } from "@/components/recipe-hero"
import { RecipeTabs } from "@/components/recipe-tabs"
import { RecipeRating } from "@/components/recipe-rating"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/hooks/use-favorites"
import { useHistory } from "@/hooks/use-history"
import type { Recipe } from "@/lib/types"

type ApiRecipe = Awaited<ReturnType<typeof apiGetRecipe>>

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {}

const firstImage = (images: unknown): string | undefined => {
  if (!Array.isArray(images)) return undefined
  return images.find((item): item is string => typeof item === "string" && item.length > 0)
}

const normalizeSteps = (recipe: { instructions?: unknown; steps?: unknown }): string[] => {
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

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const id = params?.id ?? ""
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [cookingOpen, setCookingOpen] = useState(false)
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
    if (recipe?.id) {
      addToHistory(recipe.id)
    }
  }, [recipe?.id, addToHistory])

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!recipe?.id) return
      const rid = recipe.id
      const currentlyFav = isFavorite(rid)

      await apiToggleSave(rid)

      if (currentlyFav) {
        removeFavorite(rid)
      } else {
        addFavorite(rid)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipe", id] })
      toast({ title: "Saved", description: "Recipe save state updated." })
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update saved state.", variant: "destructive" })
    },
  })

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    const nav = typeof window !== "undefined" ? window.navigator : null
    if (nav && "share" in nav) {
      try {
        await nav.share({ title: recipe?.title ?? "Recipe", url: shareUrl })
        toast({ title: "Shared", description: "Link copied to your share sheet." })
      } catch {
        // user cancelled share
      }
    } else {
      try {
        const clipboard = typeof window !== "undefined" ? window.navigator.clipboard : undefined
        await clipboard?.writeText(shareUrl)
        toast({ title: "Copied", description: "Link copied to clipboard." })
      } catch {
        toast({ title: "Error", description: "Failed to copy link to clipboard.", variant: "destructive" })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl lg:max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div className="h-8 w-40 bg-muted rounded" />
          <div className="h-64 md:h-80 lg:h-96 w-full bg-muted rounded" />
          <div className="h-10 w-56 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="mx-auto w-full max-w-6xl lg:max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
        <p className="text-destructive">Could not load the recipe.</p>
      </div>
    )
  }

  const recipeImages = asRecord(recipe).images

  const heroRecipe: Recipe = {
    id: recipe.id,
    title: recipe.title ?? "Untitled",
    description: recipe.description ?? undefined,
    imageUrl: recipe.image_url ?? firstImage(recipeImages),
    image_url: recipe.image_url ?? firstImage(recipeImages),
    imageAlt: recipe.title ?? "Recipe image",
    prepTime: Number(recipe.prep_time_minutes ?? 0),
    cookTime: Number(recipe.cook_time_minutes ?? 0),
    servings: recipe.servings ?? undefined,
    difficulty:
      recipe.difficulty === "easy" || recipe.difficulty === "medium" || recipe.difficulty === "hard"
        ? recipe.difficulty
        : "easy",
    tags: Array.isArray(recipe.diet_tags)
      ? recipe.diet_tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    isSaved: isFavorite(recipe.id),
  }

  const steps = normalizeSteps(recipe)

  return (
    <div className="mx-auto w-full max-w-6xl lg:max-w-7xl px-4 py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to recipes
        </Button>
      </div>

      <div className="space-y-10">
        <RecipeHero recipe={heroRecipe} onToggleSave={() => toggleSave.mutate()} onShare={handleShare} />

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Rate this recipe:</span>
          <RecipeRating recipeId={id} />
        </div>

        <RecipeTabs recipe={recipe as unknown as Recipe} />

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
        recipeTitle={recipe.title ?? "Untitled"}
        recipeId={id}
        servings={typeof recipe.servings === "number" ? recipe.servings : 1}
      />
    </div>
  )
}
