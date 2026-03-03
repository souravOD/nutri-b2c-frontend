"use client"

import { Clock, Users, Flame, BarChart3, Timer, ChefHat } from "lucide-react"

interface AtAGlanceProps {
    servings?: number
    prepTimeMinutes?: number
    cookTimeMinutes?: number
    totalTimeMinutes?: number
    difficulty?: string
    caloriesPerServing?: number
}

function formatTime(mins: number | undefined): string {
    if (!mins) return "—"
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function capitalize(s: string | undefined): string {
    if (!s) return "—"
    return s.charAt(0).toUpperCase() + s.slice(1)
}

export function AtAGlance({ servings, prepTimeMinutes, cookTimeMinutes, totalTimeMinutes, difficulty, caloriesPerServing }: AtAGlanceProps) {
    type Cell = { key: string; label: string; icon: React.ComponentType<{ className?: string }>; value: string }

    const cells: Cell[] = [
        { key: "servings", label: "SERVINGS", icon: Users, value: servings != null ? String(servings) : "—" },
        { key: "prep", label: "PREP TIME", icon: Timer, value: formatTime(prepTimeMinutes) },
        { key: "cook", label: "COOK TIME", icon: ChefHat, value: formatTime(cookTimeMinutes) },
        { key: "difficulty", label: "DIFFICULTY", icon: BarChart3, value: capitalize(difficulty) },
        { key: "calories", label: "CALORIES / SERVING", icon: Flame, value: caloriesPerServing != null ? `${caloriesPerServing} kcal` : "—" },
    ]

    // If we also have a total time, show it too
    if (totalTimeMinutes != null && totalTimeMinutes > 0) {
        cells.splice(3, 0, { key: "total", label: "TOTAL TIME", icon: Clock, value: formatTime(totalTimeMinutes) })
    }

    // Use 3 cols for 5+ cells, else 2 cols
    const gridCols = cells.length > 4 ? "grid-cols-3" : "grid-cols-2"

    return (
        <div>
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                At a glance
            </h3>
            <div className={`grid ${gridCols} gap-px rounded-[16px] border border-[#E2E8F0] overflow-hidden bg-[#E2E8E0]`}>
                {cells.map((cell) => {
                    const Icon = cell.icon
                    return (
                        <div key={cell.key} className="bg-white p-4 flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                                <Icon className="w-3.5 h-3.5 text-[#94A3B8]" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                                    {cell.label}
                                </span>
                            </div>
                            <span className="text-[16px] font-bold text-[#0F172A]">
                                {cell.value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
