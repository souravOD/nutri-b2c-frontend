"use client"

import { MoreVertical } from "lucide-react"
import Image from "next/image"
import type { MealLogItem } from "@/lib/types"

interface MealItemRowProps {
    item: MealLogItem
    onOpenOptions: (item: MealLogItem) => void
}

function n(v: number | string | null | undefined): number {
    if (v == null) return 0
    return typeof v === "string" ? parseFloat(v) || 0 : v
}

function displayName(item: MealLogItem): string {
    if (item.recipeName) return item.recipeName
    if (item.productName) {
        return item.productBrand ? `${item.productName} (${item.productBrand})` : item.productName
    }
    return item.customName ?? "Custom item"
}

function isNewToday(item: MealLogItem): boolean {
    if (!item.loggedAt) return false
    const created = new Date(item.loggedAt)
    const now = new Date()
    return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
    )
}

export function FigmaMealItemRow({ item, onOpenOptions }: MealItemRowProps) {
    const name = displayName(item)
    const calories = Math.round(n(item.calories))
    const servings = n(item.servings)
    const isNew = isNewToday(item)
    const imageUrl = item.imageUrl || item.recipeImage

    return (
        <div className="flex items-center gap-3 py-3 px-1">
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-full bg-[#F1F5F9] overflow-hidden flex-shrink-0">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[16px]">
                        🍽️
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span
                        className="text-[14px] font-semibold text-[#0F172A] truncate"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {name}
                    </span>
                    {isNew && (
                        <span
                            className="text-[10px] font-bold text-[#538100] bg-[#F0F7E6] px-1.5 py-0.5 rounded-full uppercase"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            New
                        </span>
                    )}
                </div>
                <span
                    className="text-[12px] text-[#64748B]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {servings} {servings === 1 ? "serving" : "servings"} · {calories} kcal
                </span>
            </div>

            {/* Kebab */}
            <button
                type="button"
                onClick={() => onOpenOptions(item)}
                className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors flex-shrink-0"
                aria-label={`Options for ${name}`}
            >
                <MoreVertical className="w-4 h-4 text-[#94A3B8]" />
            </button>
        </div>
    )
}
