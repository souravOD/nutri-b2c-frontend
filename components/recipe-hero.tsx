"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, ChefHat, Heart, Share2, Star } from "lucide-react"
import type { Recipe } from "@/lib/types"

interface RecipeHeroProps {
  recipe: Recipe
  onToggleSave: () => void
  onShare: () => void
}


export function RecipeHero({ recipe, onToggleSave, onShare }: RecipeHeroProps) {
  const recipeRecord = recipe as unknown as Record<string, unknown>
  const getNumber = (...values: unknown[]): number => {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value)) return value
      if (typeof value === "string") {
        const parsed = Number(value)
        if (Number.isFinite(parsed)) return parsed
      }
    }
    return 0
  }
  const title = recipe.title ?? "Untitled"
  const src = recipe.imageUrl ?? recipe.image_url ?? null
  const hasImage = typeof src === "string" && src.trim().length > 0
  const imageAlt = recipe.imageAlt ?? recipe.title ?? "Recipe image"
  const rating = getNumber(recipe.rating, recipeRecord["rating"])
  const reviewCount = getNumber(recipe.reviewCount, recipeRecord["reviewCount"])
  const tags = recipe.tags ?? []
  const cuisines = recipe.cuisines ?? []

  const prepMinutes = getNumber(
    recipe.prepTimeMinutes,
    recipeRecord["prep_time_minutes"],
    recipeRecord["prep_minutes"],
  )

  const cookMinutes = getNumber(
    recipe.cookTimeMinutes,
    recipeRecord["cook_time_minutes"],
    recipeRecord["cook_minutes"],
  )

  // Unified display values (fallback to legacy props if minutes missing)
  const prepDisplayMin = prepMinutes || getNumber(recipe.prepTime, recipeRecord["prepTime"])
  const cookDisplayMin = cookMinutes || getNumber(recipe.cookTime, recipeRecord["cookTime"])
  const servings = getNumber(recipe.servings, recipeRecord["servings"]) || 1
  const difficulty = String(recipe.difficulty ?? recipeRecord["difficulty"] ?? "easy")

  return (
    <div className="space-y-4">
      {/* Hero Image */}
      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-muted">
        {hasImage ? (
          <Image
            src={src as string}
            alt={imageAlt ?? title}
            fill
            unoptimized
            sizes="100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
            No image available
          </div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur"
            onClick={onToggleSave}
            aria-label={recipe.isSaved ? "Unsave recipe" : "Save recipe"}
          >
            <Heart className={`h-5 w-5 ${recipe.isSaved ? "fill-rose-600 text-rose-600" : ""}`} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="bg-background/80 backdrop-blur"
            onClick={onShare}
            aria-label="Share recipe"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Recipe Title and Description */}
      <div className="space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">{title}</h1>
        {recipe.description && (
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-3xl">
            {recipe.description}
          </p>
        )}
      </div>

      {/* Rating and Reviews */}
      {rating && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.floor(rating!) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="font-medium">{rating.toFixed(1)}</span>
          {reviewCount && <span className="text-muted-foreground">({reviewCount} reviews)</span>}
        </div>
      )}

      {/* Recipe Metadata (aligned label/value) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Prep Time</div>
            <div className="font-medium leading-tight">{prepDisplayMin} m</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Cook Time</div>
            <div className="font-medium leading-tight">{cookDisplayMin} m</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Servings</div>
            <div className="font-medium leading-tight">{servings}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ChefHat className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
            <div className="font-medium leading-tight capitalize">{difficulty}</div>
          </div>
        </div>
      </div>

      {/* Tags and Cuisines */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
        {cuisines.map((cuisine) => (
          <Badge key={cuisine} variant="outline">
            {cuisine}
          </Badge>
        ))}
      </div>
    </div>
  )
}
