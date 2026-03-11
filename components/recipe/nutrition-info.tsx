"use client"

interface NutritionInfoProps {
    calories?: number
    fat?: number
    protein?: number
    carbs?: number
    fiber?: number
    sugar?: number
    sodium?: number
    saturatedFat?: number
}

const MACROS = [
    { key: "protein", label: "Protein", unit: "g", color: "#3B82F6" },
    { key: "carbs", label: "Carbs", unit: "g", color: "#99CC33" },
    { key: "fat", label: "Fat", unit: "g", color: "#F59E0B" },
    { key: "fiber", label: "Fiber", unit: "g", color: "#8B5CF6" },
    { key: "sugar", label: "Sugar", unit: "g", color: "#EC4899" },
    { key: "saturatedFat", label: "Sat. Fat", unit: "g", color: "#F97316" },
    { key: "sodium", label: "Sodium", unit: "mg", color: "#6366F1" },
] as const

export function NutritionInfo({ calories, fat, protein, carbs, fiber, sugar, sodium, saturatedFat }: NutritionInfoProps) {
    const raw: Record<string, number | undefined> = { fat, protein, carbs, fiber, sugar, saturatedFat, sodium }

    const maxVal = Math.max(
        ...MACROS.map((m) => {
            const val = raw[m.key] ?? 0
            return m.unit === "mg" ? val / 100 : val
        }),
        1
    )

    const hasAnyData = calories != null || MACROS.some((m) => (raw[m.key] ?? 0) > 0)

    return (
        <div>
            <h3 className="text-[18px] font-bold text-[#0F172A] mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
                Nutrition
            </h3>

            {/* Calories highlight */}
            <div className="mb-4 p-4 rounded-[12px] bg-gradient-to-r from-[#F0F7E6] to-[#E8F5E9] flex items-center justify-between">
                <span className="text-[14px] font-semibold text-[#475569]">Calories per serving</span>
                <span className="text-[20px] font-bold text-[#0F172A]">
                    {calories != null ? <>{calories} <span className="text-[14px] font-medium text-[#64748B]">kcal</span></> : "—"}
                </span>
            </div>

            {/* Macro bars — always show all, use "—" for missing values */}
            <div className="space-y-3">
                {MACROS.map((m) => {
                    const val = raw[m.key]
                    const numVal = val ?? 0
                    const normalizedVal = m.unit === "mg" ? numVal / 100 : numVal
                    const pct = maxVal > 0 && numVal > 0 ? Math.min((normalizedVal / maxVal) * 100, 100) : 0
                    return (
                        <div key={m.key} className="flex items-center gap-3">
                            <span className="text-[13px] font-medium text-[#475569] w-[70px] shrink-0">{m.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: m.color }}
                                />
                            </div>
                            <span className="text-[13px] font-bold text-[#0F172A] tabular-nums w-[55px] text-right shrink-0">
                                {val != null && val > 0
                                    ? m.unit === "mg" ? `${Math.round(val)}${m.unit}` : `${Number(val.toFixed(1))}${m.unit}`
                                    : "—"
                                }
                            </span>
                        </div>
                    )
                })}
            </div>

            {!hasAnyData && (
                <p className="text-[13px] text-[#94A3B8] mt-3 text-center italic">
                    Nutrition data not available for this recipe.
                </p>
            )}

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
