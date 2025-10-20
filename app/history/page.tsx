"use client"

import { useEffect } from "react"
import { RecipeCard } from "@/components/recipe-card"
import { Button } from "@/components/ui/button"
import { useHistory } from "@/hooks/use-history"
import { useFavorites } from "@/hooks/use-favorites"
import { Clock, Trash2, BookOpen } from "lucide-react"
import Link from "next/link"

export default function HistoryPage() {
  const { recentRecipes, clearHistory, loadRecentRecipes } = useHistory()
  const { toggleFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    loadRecentRecipes()
  }, [])

  if (recentRecipes.length === 0) {
    return (
      <div className="container px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Recently Viewed</h1>
          <p className="text-muted-foreground">Recipes you've looked at recently</p>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Clock className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No recent activity</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Start exploring recipes and they'll appear here for easy access later.
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recently Viewed</h1>
          <p className="text-muted-foreground">
            {recentRecipes.length} recipe{recentRecipes.length !== 1 ? "s" : ""} in your history
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            void clearHistory()
          }}
          className="text-destructive hover:text-destructive bg-transparent"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear History
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recentRecipes.map((recipe) => (
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
