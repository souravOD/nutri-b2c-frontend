"use client"

import { useEffect } from "react"
import { RecipeCard } from "@/components/recipe-card"
import { Button } from "@/components/ui/button"
import { useFavorites } from "@/hooks/use-favorites"
import { Heart, BookOpen } from "lucide-react"
import Link from "next/link"

export default function FavoritesPage() {
  const { savedRecipes, toggleFavorite, isFavorite, loadSavedRecipes } = useFavorites()

  useEffect(() => {
    loadSavedRecipes()
  }, [])

  if (savedRecipes.length === 0) {
    return (
      <div className="container px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Saved Recipes</h1>
          <p className="text-muted-foreground">Your favorite recipes in one place</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No saved recipes yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start exploring recipes and save your favorites by clicking the heart icon on any recipe card.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/">
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Recipes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/search">Search Recipes</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Saved Recipes</h1>
          <p className="text-muted-foreground">
            {savedRecipes.length} recipe{savedRecipes.length !== 1 ? "s" : ""} saved
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Recipes
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/search">Search Recipes</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedRecipes.map((recipe) => (
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
            onSave={toggleFavorite}
          />
        ))}
      </div>
    </div>
  )
}
