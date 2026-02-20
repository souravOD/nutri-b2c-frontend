
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
import { useState, useEffect, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/hooks/use-favorites"
import { useHistory } from "@/hooks/use-history"

export default function RecipeDetailPage() {
  const router = useRouter()
  const params = useParams() as { id?: string }
  const id = params?.id ?? ""
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [cookingOpen, setCookingOpen] = useState(false)

  // Access favorites/history without assuming exact method names on context types
  const favoritesCtx: any = useFavorites() as any
  const historyCtx: any = useHistory() as any

  const isFavorite: (rid: string) => boolean =
    typeof favoritesCtx?.isFavorite === "function"
      ? favoritesCtx.isFavorite
      : () => false

  const addFavoriteFn: any =
    favoritesCtx?.add ?? favoritesCtx?.addFavorite ?? favoritesCtx?.save ?? null

  const removeFavoriteFn: any =
    favoritesCtx?.remove ?? favoritesCtx?.removeFavorite ?? favoritesCtx?.unsave ?? null

  // Our HistoryProvider exposes addToHistory(id). Keep it single-call to avoid duplicate server logs.
  const addHistoryEntryFn = typeof historyCtx?.addToHistory === "function" ? historyCtx.addToHistory : null

  const {
    data: recipe,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => apiGetRecipe(id),
    retry: 2,
  })

  const addedToHistoryRef = useRef<string | null>(null)

  useEffect(() => {
    if (recipe?.id && typeof addHistoryEntryFn === "function") {
      try { addHistoryEntryFn((recipe as any).id) } catch {}
      addedToHistoryRef.current = (recipe as any).id
    }
    // we deliberately exclude addHistoryEntryFn from deps to avoid re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe])

  const toggleSave = useMutation({
    mutationFn: async () => {
      if (!(recipe as any)?.id) return
      const rid = (recipe as any).id as string
      const currentlyFav = isFavorite(rid)

      // Backend toggle (expects a single id argument)
      await apiToggleSave(rid)

      // Best-effort local update if context provides helpers
      const favPayload = {
        id: rid,
        title: (recipe as any)?.title,
        image:
          (recipe as any)?.image_url ??
          (Array.isArray((recipe as any)?.images) && (recipe as any).images.length
            ? (recipe as any).images[0]
            : null),
      }

      try {
        if (currentlyFav) {
          if (typeof removeFavoriteFn === "function") {
            try { removeFavoriteFn(rid) } catch { removeFavoriteFn(favPayload) }
          }
        } else {
          if (typeof addFavoriteFn === "function") {
            try { addFavoriteFn(favPayload) } catch { addFavoriteFn(rid) }
          }
        }
      } catch {}
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
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: (recipe as any)?.title ?? "Recipe", url: shareUrl })
        toast({ title: "Shared", description: "Link copied to your share sheet." })
      } catch {
        // user cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
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

  const steps: string[] =
    Array.isArray((recipe as any)?.instructions)
      ? (recipe as any).instructions
      : Array.isArray((recipe as any)?.steps)
      ? (recipe as any).steps
      : [];

  // Normalize for RecipeHero
  const heroRecipe = {
    ...(recipe as any),
    imageUrl:
      (recipe as any)?.imageUrl ??
      (recipe as any)?.image_url ??
      (Array.isArray((recipe as any)?.images) && (recipe as any).images.length
        ? (recipe as any).images[0]
        : undefined),
    imageAlt: (recipe as any)?.title ?? "Recipe image",
    // Use Favorites context for current saved state to ensure the heart reflects immediately.
    isSaved: isFavorite((recipe as any).id),
  };

  return (
    <div className="mx-auto w-full max-w-6xl lg:max-w-7xl px-4 py-8">
      {/* Back Button */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="pl-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to recipes
        </Button>
      </div>

      <div className="space-y-10">
        {/* Recipe Hero */}
        <RecipeHero recipe={heroRecipe} onToggleSave={() => toggleSave.mutate()} onShare={handleShare} />

        {/* Recipe Rating */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Rate this recipe:</span>
          <RecipeRating recipeId={id} />
        </div>

        {/* Recipe Tabs */}
        <RecipeTabs recipe={recipe as any} />

        {/* Start Cooking Button */}
        <div className="flex justify-center pt-6">
          <Button size="lg" onClick={() => setCookingOpen(true)}>
            Start Cooking
          </Button>
        </div>
      </div>

      {/* Cooking Overlay */}
      <StartCookingOverlay
        open={cookingOpen}
        onOpenChange={setCookingOpen}
        steps={steps}
        recipeTitle={(recipe as any).title}
        recipeId={id}
        servings={(recipe as any).servings ?? 1}
      />
    </div>
  )
}
