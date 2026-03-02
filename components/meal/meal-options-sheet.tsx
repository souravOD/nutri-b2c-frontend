"use client"

import { X, Pencil, Copy, Heart, Users, Trash2, ChevronRight } from "lucide-react"
import type { MealLogItem } from "@/lib/types"

interface MealOptionsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    item: MealLogItem | null
    onEditPortions: (item: MealLogItem) => void
    onCopyToTomorrow: (item: MealLogItem) => void
    onSaveToFavorites: (item: MealLogItem) => void
    onLogForFamily: (item: MealLogItem) => void
    onRemoveMeal: (item: MealLogItem) => void
}

function displayName(item: MealLogItem): string {
    if (item.recipeName) return item.recipeName
    if (item.productName) {
        return item.productBrand ? `${item.productName} (${item.productBrand})` : item.productName
    }
    return item.customName ?? "Custom item"
}

const OPTIONS = [
    { key: "edit", label: "Edit Portions", desc: "Adjust quantity or unit", icon: Pencil, destructive: false },
    { key: "copy", label: "Copy to Tomorrow", desc: "Add to tomorrow's log", icon: Copy, destructive: false },
    { key: "save", label: "Save to Favorites", desc: "Quick log for future use", icon: Heart, destructive: false },
    { key: "family", label: "Log for Family", desc: "Add for a household member", icon: Users, destructive: false },
    { key: "remove", label: "Remove Meal", desc: "Remove from today's log", icon: Trash2, destructive: true },
] as const

export function MealOptionsSheet({
    open,
    onOpenChange,
    item,
    onEditPortions,
    onCopyToTomorrow,
    onSaveToFavorites,
    onLogForFamily,
    onRemoveMeal,
}: MealOptionsSheetProps) {
    if (!open || !item) return null

    const name = displayName(item)

    const handleAction = (key: string) => {
        switch (key) {
            case "edit":
                onEditPortions(item)
                break
            case "copy":
                onCopyToTomorrow(item)
                break
            case "save":
                onSaveToFavorites(item)
                break
            case "family":
                onLogForFamily(item)
                break
            case "remove":
                onRemoveMeal(item)
                break
        }
        onOpenChange(false)
    }

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
          fixed z-50 bg-white
          flex flex-col overflow-hidden

          inset-x-0 bottom-0 rounded-t-[20px]
          animate-in slide-in-from-bottom

          lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
          lg:w-[420px] lg:rounded-[20px]
          lg:shadow-2xl
        "
                style={{ fontFamily: "Inter, sans-serif" }}
            >
                {/* Handle bar (mobile) */}
                <div className="flex justify-center pt-3 pb-1 lg:hidden">
                    <div className="w-10 h-1 rounded-full bg-[#CBD5E1]" />
                </div>

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#F0F7E6] flex items-center justify-center">
                        <span className="text-[18px]">🍽️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-[16px] font-bold text-[#0F172A]">
                            Meal Options
                        </h2>
                        <p className="text-[13px] text-[#64748B] truncate">
                            {name}
                        </p>
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

                {/* Options list */}
                <div className="px-3 pb-6">
                    {OPTIONS.map((opt) => {
                        const Icon = opt.icon
                        return (
                            <button
                                key={opt.key}
                                type="button"
                                onClick={() => handleAction(opt.key)}
                                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-[12px] hover:bg-[#F8FAFC] transition-colors"
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center ${opt.destructive ? "bg-red-50" : "bg-[#F0F7E6]"
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 ${opt.destructive ? "text-red-500" : "text-[#538100]"}`}
                                        strokeWidth={1.8}
                                    />
                                </div>
                                <div className="flex-1 text-left">
                                    <span
                                        className={`text-[14px] font-semibold block ${opt.destructive ? "text-red-600" : "text-[#0F172A]"
                                            }`}
                                    >
                                        {opt.label}
                                    </span>
                                    <span
                                        className={`text-[12px] ${opt.destructive ? "text-red-400" : "text-[#64748B]"}`}
                                    >
                                        {opt.desc}
                                    </span>
                                </div>
                                {!opt.destructive && (
                                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] flex-shrink-0" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
