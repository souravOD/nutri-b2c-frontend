"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Flame, Dumbbell, Plus, ThumbsDown } from "lucide-react"
import type { Recipe } from "@/lib/types"

interface RecipeCardSearchProps {
    recipe: Recipe
    onAddToLog: (recipe: Recipe) => void
    onNotForMe: (recipeId: string) => void
}

export function RecipeCardSearch({ recipe, onAddToLog, onNotForMe }: RecipeCardSearchProps) {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    const imgSrc =
        typeof recipe.imageUrl === "string" && recipe.imageUrl.length > 0
            ? recipe.imageUrl
            : "/placeholder-recipe.jpg"

    return (
        <div className="bg-white rounded-[16px] overflow-hidden border border-[#F1F5F9] shadow-sm">
            {/* Image */}
            <Link href={`/recipes/${recipe.id}`}>
                <div className="relative w-full aspect-[16/10] bg-[#F1F5F9]">
                    <Image
                        src={imgSrc}
                        alt={recipe.title || "Recipe"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
            </Link>

            {/* Content */}
            <div className="px-4 pt-3 pb-4">
                <Link href={`/recipes/${recipe.id}`}>
                    <h4 className="text-[15px] font-bold text-[#0F172A] leading-snug line-clamp-2 mb-2">
                        {recipe.title}
                    </h4>
                </Link>

                {/* Badges */}
                <div className="flex items-center gap-3 mb-3">
                    {(recipe.calories != null && recipe.calories > 0) && (
                        <span className="flex items-center gap-1 text-[12px] text-[#64748B]">
                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                            {Math.round(recipe.calories)} kcal
                        </span>
                    )}
                    {(recipe.protein_g != null && recipe.protein_g > 0) && (
                        <span className="flex items-center gap-1 text-[12px] text-[#64748B]">
                            <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                            {Math.round(recipe.protein_g)}g Protein
                        </span>
                    )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => onAddToLog(recipe)}
                        className="flex-1 py-2.5 rounded-full bg-[#99CC33] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#8ABB2A] transition-colors"
                    >
                        Add to Log
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onNotForMe(recipe.id)
                            setDismissed(true)
                        }}
                        className="flex-1 py-2.5 rounded-full border-2 border-[#E2E8F0] text-[#64748B] text-[13px] font-bold flex items-center justify-center gap-1.5 hover:bg-[#F8FAFC] transition-colors"
                    >
                        Not for me
                    </button>
                </div>
            </div>
        </div>
    )
}
