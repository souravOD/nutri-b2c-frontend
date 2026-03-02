"use client"

import { Clock, Search, Utensils } from "lucide-react"

interface Suggestion {
    text: string
    type: "recent" | "suggestion" | "recipe"
}

interface SearchSuggestionsProps {
    suggestions: Suggestion[]
    onSelect: (text: string) => void
    popularCategories?: string[]
    onCategorySelect?: (cat: string) => void
}

export function SearchSuggestions({
    suggestions,
    onSelect,
    popularCategories = [],
    onCategorySelect,
}: SearchSuggestionsProps) {
    const iconMap = {
        recent: Clock,
        suggestion: Search,
        recipe: Utensils,
    }

    if (suggestions.length === 0 && popularCategories.length === 0) return null

    return (
        <div className="bg-white">
            {/* Suggestion rows */}
            {suggestions.map((s, i) => {
                const Icon = iconMap[s.type]
                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onSelect(s.text)}
                        className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors text-left"
                    >
                        <Icon className="w-5 h-5 text-[#94A3B8] flex-shrink-0" />
                        <span className="flex-1 text-[15px] text-[#0F172A]">{s.text}</span>
                        <svg className="w-4 h-4 text-[#CBD5E1] flex-shrink-0 rotate-[-45deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path d="M7 17l9.2-9.2M17 17V7.8M17 7.8H7.8" />
                        </svg>
                    </button>
                )
            })}

            {/* Popular categories */}
            {popularCategories.length > 0 && (
                <div className="px-5 py-4 border-t border-[#F1F5F9]">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">
                        Popular Categories
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {popularCategories.map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => onCategorySelect?.(cat)}
                                className="px-3.5 py-1.5 rounded-full border border-[#E2E8F0] text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
