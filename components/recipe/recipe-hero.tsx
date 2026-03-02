"use client"

import { ArrowLeft, Heart } from "lucide-react"
import { useRouter } from "next/navigation"

interface RecipeHeroProps {
    imageUrl?: string
    title: string
    isSaved?: boolean
    onToggleSave: () => void
}

export function RecipeDetailHero({ imageUrl, title, isSaved, onToggleSave }: RecipeHeroProps) {
    const router = useRouter()

    return (
        <div className="relative w-full h-[280px] rounded-b-[24px] overflow-hidden bg-[#F1F5F9]">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-6xl">
                    🍽️
                </div>
            )}

            {/* Top gradient for overlay button visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent pointer-events-none" />

            {/* Back button */}
            <button
                type="button"
                onClick={() => router.back()}
                className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
                aria-label="Go back"
            >
                <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
            </button>

            {/* Favorite button */}
            <button
                type="button"
                onClick={onToggleSave}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-[#F8FAFC] transition-colors"
                aria-label={isSaved ? "Unsave recipe" : "Save recipe"}
            >
                <Heart
                    className={`w-5 h-5 transition-colors ${isSaved ? "fill-red-500 text-red-500" : "text-[#64748B]"}`}
                />
            </button>
        </div>
    )
}
