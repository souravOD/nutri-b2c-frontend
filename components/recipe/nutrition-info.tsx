"use client"

interface NutritionInfoProps {
    fat?: number
    protein?: number
    carbs?: number
    fiber?: number
}

const MACROS = [
    { key: "fat", label: "Fat", color: "#F59E0B" },
    { key: "protein", label: "Protein", color: "#3B82F6" },
    { key: "carbs", label: "Carbs", color: "#99CC33" },
    { key: "fiber", label: "Fiber", color: "#8B5CF6" },
] as const

export function NutritionInfo({ fat, protein, carbs, fiber }: NutritionInfoProps) {
    const values: Record<string, number | undefined> = { fat, protein, carbs, fiber }
    const maxVal = Math.max(fat ?? 0, protein ?? 0, carbs ?? 0, fiber ?? 0, 1)

    return (
        <div>
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                Nutrition
            </h3>

            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {MACROS.map((m) => {
                    const val = values[m.key] ?? 0
                    const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                    return (
                        <div key={m.key} className="flex items-center gap-3">
                            <span className="text-[14px] font-medium text-[#475569] w-[60px]">{m.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                                />
                            </div>
                            <span className="text-[14px] font-bold text-[#0F172A] tabular-nums w-[40px] text-right">
                                {val}g
                            </span>
                        </div>
                    )
                })}
            </div>

            <p className="text-[11px] text-[#94A3B8] mt-4 leading-4">
                * Percent Daily Values are based on a 2,000 calorie diet.
            </p>
        </div>
    )
}

/* ─── Compact Nutrition Pills (for Cooking Tracker) ─── */

interface NutritionPillsProps {
    calories?: number
    protein?: number
    carbs?: number
}

export function NutritionPills({ calories, protein, carbs }: NutritionPillsProps) {
    const pills = [
        { value: calories ?? 0, unit: "KCAL" },
        { value: `${protein ?? 0}g`, unit: "PROTEIN" },
        { value: `${carbs ?? 0}g`, unit: "CARBS" },
    ]

    return (
        <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">
                NUTRITIONAL HIGHLIGHTS
            </p>
            <div className="flex justify-center gap-2">
                {pills.map((p, i) => (
                    <div
                        key={i}
                        className="bg-[#F0F7E6] rounded-[12px] px-4 py-2 flex flex-col items-center"
                    >
                        <span className="text-[14px] font-bold text-[#0F172A]">{p.value}</span>
                        <span className="text-[9px] font-semibold uppercase text-[#64748B]">{p.unit}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
