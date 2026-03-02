"use client"

import { Clock, Users, Flame, BarChart3 } from "lucide-react"

interface AtAGlanceProps {
    servings?: number
    totalTimeMinutes?: number
    difficulty?: string
    caloriesPerServing?: number
}

const CELLS = [
    { key: "servings", label: "SERVINGS", icon: Users },
    { key: "time", label: "TOTAL TIME", icon: Clock },
    { key: "difficulty", label: "DIFFICULTY", icon: BarChart3 },
    { key: "calories", label: "CALORIES / SERVING", icon: Flame },
] as const

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

export function AtAGlance({ servings, totalTimeMinutes, difficulty, caloriesPerServing }: AtAGlanceProps) {
    const values: Record<string, string> = {
        servings: servings != null ? String(servings) : "—",
        time: formatTime(totalTimeMinutes),
        difficulty: capitalize(difficulty),
        calories: caloriesPerServing != null ? `${caloriesPerServing} kcal` : "—",
    }

    return (
        <div>
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                At a glance
            </h3>
            <div className="grid grid-cols-2 gap-px rounded-[16px] border border-[#E2E8F0] overflow-hidden bg-[#E2E8F0]">
                {CELLS.map((cell) => (
                    <div key={cell.key} className="bg-white p-4 flex flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                            {cell.label}
                        </span>
                        <span className="text-[16px] font-bold text-[#0F172A]">
                            {values[cell.key]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
