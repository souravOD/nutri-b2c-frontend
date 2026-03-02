"use client"

import { useState } from "react"
import { Check } from "lucide-react"

export interface IngredientItem {
    name: string
    quantity?: string
}

interface IngredientListProps {
    ingredients: IngredientItem[]
}

export function IngredientList({ ingredients }: IngredientListProps) {
    const [checked, setChecked] = useState<Set<number>>(new Set())

    const toggle = (index: number) => {
        setChecked((prev) => {
            const next = new Set(prev)
            if (next.has(index)) next.delete(index)
            else next.add(index)
            return next
        })
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                    Ingredients
                </h3>
                <span className="text-[13px] font-semibold text-[#99CC33]">
                    {ingredients.length} items
                </span>
            </div>

            {/* List */}
            <div className="space-y-1">
                {ingredients.map((ing, i) => {
                    const isChecked = checked.has(i)
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => toggle(i)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-[12px] hover:bg-[#F8FAFC] transition-colors text-left"
                        >
                            {/* Checkbox */}
                            <span
                                className={`
                  w-[22px] h-[22px] rounded-full border-2 flex-shrink-0
                  flex items-center justify-center transition-colors
                  ${isChecked
                                        ? "bg-[#99CC33] border-[#99CC33]"
                                        : "bg-white border-[#CBD5E1]"
                                    }
                `}
                            >
                                {isChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </span>

                            {/* Name */}
                            <span
                                className={`flex-1 text-[14px] transition-colors ${isChecked ? "line-through text-[#94A3B8]" : "text-[#0F172A] font-medium"
                                    }`}
                            >
                                {ing.name}
                            </span>

                            {/* Quantity */}
                            {ing.quantity && (
                                <span
                                    className={`text-[13px] flex-shrink-0 transition-colors ${isChecked ? "line-through text-[#CBD5E1]" : "text-[#64748B]"
                                        }`}
                                >
                                    {ing.quantity}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
