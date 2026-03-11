"use client"

import { useState, useMemo, useCallback } from "react"
import { X, Search, Plus, BookOpen } from "lucide-react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { fetchMyRecipes } from "@/lib/api"
import { useUser } from "@/hooks/use-user"
import type { MealType, Recipe } from "@/lib/types"
import type { UserRecipe } from "@/lib/api"

interface MyRecipesPickerSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mealType: MealType
    date: string
    memberId?: string
    onQuickAdd: (recipe: Recipe) => void
    onSelectRecipe: (recipe: Recipe) => void
}

/** Convert a UserRecipe to a Recipe for LogMealModal compatibility. */
function toRecipe(ur: UserRecipe): Recipe {
    return {
        id: ur.id,
        title: ur.title,
        description: ur.description ?? undefined,
        imageUrl: ur.imageUrl ?? ur.image_url ?? undefined,
        calories: ur.calories ?? undefined,
        protein_g: ur.protein_g ?? undefined,
        carbs_g: ur.carbs_g ?? undefined,
        fat_g: ur.fat_g ?? undefined,
        fiber_g: ur.fiber_g ?? undefined,
        servings: ur.servings ?? undefined,
        difficulty: ur.difficulty as Recipe["difficulty"],
        prepTime: ur.prep_time_minutes ?? ur.prepTimeMinutes ?? undefined,
        cookTime: ur.cook_time_minutes ?? ur.cookTimeMinutes ?? undefined,
        cuisine: ur.cuisine ?? undefined,
    }
}

export function MyRecipesPickerSheet({
    open,
    onOpenChange,
    mealType,
    onQuickAdd,
    onSelectRecipe,
}: MyRecipesPickerSheetProps) {
    const { user } = useUser()
    const [searchQuery, setSearchQuery] = useState("")

    const { data, isLoading } = useQuery({
        queryKey: ["my-recipes-picker", user?.$id],
        queryFn: () => fetchMyRecipes(user?.$id ?? "", { limit: 50 }),
        enabled: open && !!user?.$id,
        staleTime: 30_000,
    })

    const recipes = data?.items ?? []

    const filtered = useMemo(() => {
        if (!searchQuery.trim()) return recipes
        const q = searchQuery.toLowerCase()
        return recipes.filter(
            (r) =>
                r.title?.toLowerCase().includes(q) ||
                r.cuisine?.toLowerCase().includes(q),
        )
    }, [recipes, searchQuery])

    const handleQuickAdd = useCallback(
        (ur: UserRecipe) => {
            onQuickAdd(toRecipe(ur))
            onOpenChange(false)
        },
        [onQuickAdd, onOpenChange],
    )

    const handleSelect = useCallback(
        (ur: UserRecipe) => {
            onSelectRecipe(toRecipe(ur))
            onOpenChange(false)
        },
        [onSelectRecipe, onOpenChange],
    )

    if (!open) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-in fade-in-0"
                onClick={() => onOpenChange(false)}
            />

            {/* Panel */}
            <div
                className="
          fixed z-50 bg-white flex flex-col overflow-hidden
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-[20px]
          animate-in slide-in-from-bottom
          lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
          lg:w-[480px] lg:max-h-[75vh] lg:rounded-[20px] lg:shadow-2xl
        "
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {/* Handle bar (mobile) */}
                <div className="flex justify-center pt-3 pb-1 lg:hidden">
                    <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-[#538100]" />
                        <h2 className="text-[18px] font-bold text-[#0F172A]">My Recipes</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 text-[#64748B]" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-5 pb-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Search my recipes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]"
                        />
                    </div>
                </div>

                {/* Meal type chip */}
                <div className="px-5 pb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#F0F7E6] text-[12px] font-semibold text-[#538100] capitalize">
                        Adding to {mealType}
                    </span>
                </div>

                {/* Recipe list */}
                <div className="overflow-y-auto flex-1 px-5 pb-8">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="w-8 h-8 border-3 border-[#E0E0E0] border-t-[#99CC33] rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
                            <p className="text-[15px] font-semibold text-[#0F172A] mb-1">
                                {recipes.length === 0 ? "No recipes yet" : "No matches found"}
                            </p>
                            <p className="text-[13px] text-[#64748B]">
                                {recipes.length === 0
                                    ? "Create your first recipe to see it here."
                                    : "Try a different search term."}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col divide-y divide-[#F1F5F9]">
                            {filtered.map((recipe) => (
                                <div
                                    key={recipe.id}
                                    className="flex items-center gap-3 py-3 cursor-pointer hover:bg-[#F8FBF0] -mx-2 px-2 rounded-xl transition-colors"
                                    onClick={() => handleSelect(recipe)}
                                >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] overflow-hidden flex-shrink-0">
                                        {(recipe.imageUrl || recipe.image_url) ? (
                                            <Image
                                                src={(recipe.imageUrl || recipe.image_url)!}
                                                alt={recipe.title || "Recipe"}
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[18px]">
                                                🍽️
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-[#0F172A] truncate">
                                            {recipe.title}
                                        </p>
                                        <p className="text-[12px] text-[#64748B]">
                                            {recipe.servings ?? 1} serving{(recipe.servings ?? 1) > 1 ? "s" : ""}
                                            {recipe.calories ? ` · ${Math.round(recipe.calories)} kcal` : ""}
                                            {recipe.cuisine ? ` · ${recipe.cuisine}` : ""}
                                        </p>
                                    </div>

                                    {/* Quick add button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleQuickAdd(recipe)
                                        }}
                                        className="w-8 h-8 rounded-full bg-[#99CC33] flex items-center justify-center hover:bg-[#88BB22] transition-colors flex-shrink-0"
                                        aria-label={`Quick add ${recipe.title}`}
                                        title="Add 1 serving"
                                    >
                                        <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
