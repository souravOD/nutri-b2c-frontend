"use client"

import { Plus, Coffee, Sun, Cookie, Moon } from "lucide-react"
import { FigmaMealItemRow } from "./meal-item-row"
import type { MealLogItem, MealType } from "@/lib/types"

interface MealSlotCardProps {
    mealType: MealType
    items: MealLogItem[]
    onAdd: () => void
    onOpenOptions: (item: MealLogItem) => void
}

const SLOT_CONFIG: Record<MealType, { label: string; icon: React.ElementType }> = {
    breakfast: { label: "Breakfast", icon: Coffee },
    lunch: { label: "Lunch", icon: Sun },
    snack: { label: "Snacks", icon: Cookie },
    dinner: { label: "Dinner", icon: Moon },
}

function n(v: number | string | null | undefined): number {
    if (v == null) return 0
    return typeof v === "string" ? parseFloat(v) || 0 : v
}

export function MealSlotCard({ mealType, items, onAdd, onOpenOptions }: MealSlotCardProps) {
    const config = SLOT_CONFIG[mealType]
    const Icon = config.icon
    const totalCal = items.reduce((sum, i) => sum + n(i.calories), 0)
    const hasItems = items.length > 0

    return (
        <div className="bg-white rounded-[20px] border border-[#F1F5F9] overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#F0F7E6] flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#538100]" />
                    </div>
                    <div>
                        <span
                            className="text-[14px] font-semibold text-[#0F172A]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {config.label}
                        </span>
                        <span
                            className="block text-[11px] font-medium text-[#94A3B8] uppercase tracking-[0.5px]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {hasItems ? `${Math.round(totalCal)} KCAL LOGGED` : "NOT LOGGED YET"}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onAdd}
                    className="w-8 h-8 rounded-full bg-[#99CC33] flex items-center justify-center hover:bg-[#88BB22] transition-colors"
                    aria-label={`Add to ${config.label}`}
                >
                    <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
            </div>

            {/* Item list */}
            {hasItems && (
                <div className="px-3 pb-2 divide-y divide-[#F1F5F9]">
                    {items.map((item) => (
                        <FigmaMealItemRow
                            key={item.id}
                            item={item}
                            onOpenOptions={onOpenOptions}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
