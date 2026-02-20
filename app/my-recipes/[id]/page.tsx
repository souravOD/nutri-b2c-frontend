// app/my-recipes/[id]/page.tsx
"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { useState, useMemo } from "react"
import { ArrowLeft } from "lucide-react"

import { useUser } from "@/hooks/use-user"
import { apiGetUserRecipe } from "@/lib/api"
import type { Recipe } from "@/lib/types"

import { Button } from "@/components/ui/button"
import { RecipeHero } from "@/components/recipe-hero"
import { RecipeTabs } from "@/components/recipe-tabs"
import { StartCookingOverlay } from "@/components/start-cooking-overlay"

export default function MyRecipeDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id?: string }   // ✅ fix: don’t use props.params in client component
  const { user } = useUser()
  const uid = user?.$id

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ["my-recipe", id, uid],
    enabled: Boolean(id && uid),
    queryFn: () => apiGetUserRecipe(uid!, id!)
  })

  const [cookingOpen, setCookingOpen] = useState(false)

  // Normalize only what RecipeHero needs (rest can stay snake_case for RecipeTabs)
  const heroRecipe: Recipe = useMemo(() => {
    const r: any = recipe ?? {}
    return {
      id: r.id,
      title: r.title ?? "Untitled",
      description: r.description ?? null,
      imageUrl: r.image_url ?? null,                     // RecipeHero expects imageUrl
      prepTime: Number(r.prep_time_minutes ?? 0),        // RecipeHero expects prepTime
      cookTime: Number(r.cook_time_minutes ?? 0),        // RecipeHero expects cookTime
      servings: Number(r.servings ?? 1),
      difficulty: (r.difficulty ?? "easy") as any,
      tags: [
        ...(Array.isArray(r.tags) ? r.tags : []),
        ...(Array.isArray(r.cuisines) ? r.cuisines : (r.cuisine ? [r.cuisine] : [])),
      ],
    } as Recipe
  }, [recipe])

  // Same steps logic the public page uses, but user_recipes.instructions are objects -> map to text
  const steps: string[] = Array.isArray((recipe as any)?.instructions)
    ? ((recipe as any).instructions as any[])
        .map((it: any) => it?.text ?? String(it ?? ""))
        .filter(Boolean)
    : []

  const handleShare = async () => {
    try {
      await navigator.share?.({
        title: heroRecipe.title,
        text: heroRecipe.description ?? "",
        url: location.href,
      })
    } catch {
      /* ignore */
    }
  }

  if (isLoading) return <div className="p-6 text-muted-foreground">Loading…</div>
  if (error)     return <div className="p-6 text-destructive">Failed to load recipe.</div>
  if (!recipe)   return <div className="p-6">Recipe not found.</div>

  return (
    <div className="mx-auto w-full max-w-6xl lg:max-w-7xl px-4 py-8 space-y-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to recipes
        </Button>
      </div>

      <div className="space-y-10">
        {/* Same hero as public detail page */}
        <RecipeHero recipe={heroRecipe} onToggleSave={() => {}} onShare={handleShare} />

        {/* Same tabs component; it tolerates snake_case in recipe */}
        <RecipeTabs recipe={recipe as any} />

        {/* Same Start Cooking button */}
        <div className="flex justify-center pt-6">
          <Button size="lg" onClick={() => setCookingOpen(true)}>
            Start Cooking
          </Button>
        </div>
      </div>

      {/* Cooking overlay */}
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
