"use client"

import { useState, useMemo } from "react"
import { X, Search, Sparkles, Heart, ScanBarcode, BookOpen, RotateCcw, Plus } from "lucide-react"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import { apiGetFeed, apiSearchRecipes } from "@/lib/api"
import type { Recipe, MealType } from "@/lib/types"

interface QuickAddSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    mealType: MealType
    date: string
    memberId?: string
    onSelectRecipe: (recipe: Recipe) => void
    onScanProduct: () => void
    onFromMyRecipes: () => void
    onCopyYesterday: () => void
}

const ACTIONS = [
    { key: "favorites", label: "Favorites Collection", icon: Heart },
    { key: "scan", label: "Scan Product", icon: ScanBarcode },
    { key: "my-recipes", label: "From My Recipes", icon: BookOpen },
    { key: "copy", label: "Copy Yesterday", icon: RotateCcw },
] as const

export function QuickAddSheet({
    open,
    onOpenChange,
    mealType,
    date,
    memberId,
    onSelectRecipe,
    onScanProduct,
    onFromMyRecipes,
    onCopyYesterday,
}: QuickAddSheetProps) {
    const [searchQuery, setSearchQuery] = useState("")

    // Feed-based suggestions (when no search query)
    const { data: suggestions = [] } = useQuery({
        queryKey: ["home-feed"],
        queryFn: () => apiGetFeed(),
        staleTime: 120_000,
        enabled: open,
    })

    // Debounced search query for the API call
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const debounceRef = useMemo(() => ({ timer: null as ReturnType<typeof setTimeout> | null }), [])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        if (debounceRef.timer) clearTimeout(debounceRef.timer)
        debounceRef.timer = setTimeout(() => {
            setDebouncedQuery(value.trim())
        }, 350)
    }

    // Real search API call when user types a query (debounced)
    const { data: searchResults = [], isFetching: isSearching } = useQuery({
        queryKey: ["quick-add-search", debouncedQuery],
        queryFn: () => apiSearchRecipes({ q: debouncedQuery, filters: {}, sort: "relevance" }),
        staleTime: 60_000,
        enabled: open && debouncedQuery.length >= 2,
    })

    // Show search results when searching, otherwise show feed suggestions
    const hasSearch = debouncedQuery.length >= 2
    const filtered = hasSearch ? searchResults.slice(0, 10) : suggestions.slice(0, 6)

    const handleAction = (key: string) => {
        switch (key) {
            case "favorites":
                break
            case "scan":
                onScanProduct()
                onOpenChange(false)
                break
            case "my-recipes":
                onFromMyRecipes()
                onOpenChange(false)
                break
            case "copy":
                onCopyYesterday()
                onOpenChange(false)
                break
        }
    }

    if (!open) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] animate-in fade-in-0"
                onClick={() => onOpenChange(false)}
            />

            {/* Panel: bottom-sheet on mobile, centered dialog on desktop */}
            <div
                className="
          fixed z-50 bg-white
          flex flex-col overflow-hidden
          
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-[20px]
          animate-in slide-in-from-bottom
          
          lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
          lg:w-[480px] lg:max-h-[75vh] lg:rounded-[20px]
          lg:shadow-2xl
        "
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {/* Handle bar (mobile only) */}
                <div className="flex justify-center pt-3 pb-1 lg:hidden">
                    <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                    <h2 className="text-[18px] font-bold text-[#0F172A]">
                        Quick Add Meal
                    </h2>
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-8 h-8 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] transition-colors flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4 text-[#64748B]" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 px-5 pb-8">
                    {/* Search bar */}
                    <div className="relative mb-5">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                            type="text"
                            placeholder="Search foods, recipes.."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full pl-10 pr-12 py-3 rounded-full border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]"
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#538100] flex items-center justify-center"
                            aria-label="AI search"
                        >
                            <Sparkles className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* 2×2 Action Grid — hide when actively searching */}
                    {!hasSearch && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {ACTIONS.map((action) => {
                                const Icon = action.icon
                                return (
                                    <button
                                        key={action.key}
                                        type="button"
                                        onClick={() => handleAction(action.key)}
                                        className="flex flex-col items-center justify-center gap-2 py-5 rounded-[14px] bg-[#F8FBF0] hover:bg-[#F0F7E6] transition-colors border border-[#E8F0D6]"
                                    >
                                        <Icon className="w-6 h-6 text-[#538100]" strokeWidth={1.5} />
                                        <span className="text-[12px] font-semibold text-[#0F172A]">
                                            {action.label}
                                        </span>
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Results heading */}
                    <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">
                        {hasSearch ? `Results for "${debouncedQuery}"` : "Suggested Items"}
                    </h3>

                    {/* Loading indicator */}
                    {isSearching && (
                        <div className="flex items-center justify-center py-6">
                            <div className="w-5 h-5 border-2 border-[#99CC33] border-t-transparent rounded-full animate-spin" />
                            <span className="ml-2 text-[13px] text-[#64748B]">Searching…</span>
                        </div>
                    )}

                    {/* No results message */}
                    {hasSearch && !isSearching && filtered.length === 0 && (
                        <div className="text-center py-6">
                            <p className="text-[14px] text-[#64748B]">No recipes found for &quot;{debouncedQuery}&quot;</p>
                            <p className="text-[12px] text-[#94A3B8] mt-1">Try a different search term</p>
                        </div>
                    )}

                    {/* Recipe list */}
                    <div className="flex flex-col divide-y divide-[#F1F5F9]">
                        {filtered.map((recipe) => (
                            <div key={recipe.id} className="flex items-center gap-3 py-3">
                                <div className="w-10 h-10 rounded-full bg-[#F1F5F9] overflow-hidden flex-shrink-0">
                                    {recipe.imageUrl ? (
                                        <Image
                                            src={recipe.imageUrl}
                                            alt={recipe.title || "Recipe"}
                                            width={40}
                                            height={40}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[16px]">🍽️</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-semibold text-[#0F172A] truncate">
                                        {recipe.title}
                                    </p>
                                    <p className="text-[12px] text-[#64748B]">
                                        1 serving · {Math.round(recipe.nutrition?.calories ?? recipe.calories ?? 0)} kcal
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectRecipe(recipe)}
                                    className="w-8 h-8 rounded-full bg-[#99CC33] flex items-center justify-center hover:bg-[#88BB22] transition-colors flex-shrink-0"
                                    aria-label={`Add ${recipe.title}`}
                                >
                                    <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
