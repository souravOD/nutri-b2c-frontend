"use client"

import { useState } from "react"
import { X, Check } from "lucide-react"

/* ── Filter types ── */

export interface SearchFilterState {
    mealType: string[]
    diets: string[]
    allergens: string[]
    healthConditions: string[]
    nutritionGoal: string | null
    cookingTime: number | null       // null = Any
    cuisines: string[]
}

export const EMPTY_FILTERS: SearchFilterState = {
    mealType: [],
    diets: [],
    allergens: [],
    healthConditions: [],
    nutritionGoal: null,
    cookingTime: null,
    cuisines: [],
}

/* ── Options ── */

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner"]
const DIETS = ["Vegan", "Keto", "Paleo", "Vegetarian", "Pescatarian"]
const ALLERGENS = ["Nuts", "Dairy", "Gluten", "Soy"]
const CONDITIONS = ["Diabetes Friendly", "Hypertension", "Low Sodium"]
const NUTRITION_GOALS = [
    { value: "high_protein", label: "High Protein (>25g)" },
    { value: "low_carb", label: "Low Carb (<15g)" },
    { value: "low_calorie", label: "Low Calorie (<400kcal)" },
]
const COOKING_TIMES = [
    { value: 15, label: "15 min", sub: "UNDER" },
    { value: 30, label: "30 min", sub: "UNDER" },
    { value: null, label: "Any", sub: "TIME" },
]
const CUISINES = ["Italian", "Mexican", "Japanese", "Mediterranean", "Indian", "Thai"]

/* ── Helpers ── */

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${active
                ? "bg-[#99CC33] text-white"
                : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
                }`}
        >
            {label}
        </button>
    )
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
    return (
        <button
            type="button"
            onClick={onChange}
            className="flex items-center gap-3 py-2 w-full text-left"
        >
            <span
                className={`w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${checked ? "bg-[#99CC33] border-[#99CC33]" : "bg-white border-[#CBD5E1]"
                    }`}
            >
                {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
            <span className="text-[14px] font-medium text-[#0F172A]">{label}</span>
        </button>
    )
}

function RadioRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center justify-between py-2.5 w-full text-left"
        >
            <span className="text-[14px] font-medium text-[#0F172A]">{label}</span>
            <span
                className={`w-[22px] h-[22px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${selected ? "border-[#99CC33]" : "border-[#CBD5E1]"
                    }`}
            >
                {selected && <span className="w-3 h-3 rounded-full bg-[#99CC33]" />}
            </span>
        </button>
    )
}

/* ── Shared filter body ── */

function FilterBody({
    local,
    setLocal,
    toggle,
}: {
    local: SearchFilterState
    setLocal: React.Dispatch<React.SetStateAction<SearchFilterState>>
    toggle: <K extends keyof SearchFilterState>(key: K, value: string) => void
}) {
    return (
        <div className="space-y-7">
            {/* Meal Type */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Meal Type</h3>
                <div className="flex flex-wrap gap-2">
                    {MEAL_TYPES.map((m) => (
                        <TogglePill
                            key={m}
                            label={m}
                            active={local.mealType.includes(m)}
                            onClick={() => toggle("mealType", m)}
                        />
                    ))}
                </div>
            </section>

            {/* Dietary Restrictions */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Dietary Restrictions</h3>
                <div className="flex flex-wrap gap-2">
                    {DIETS.map((d) => (
                        <TogglePill
                            key={d}
                            label={d}
                            active={local.diets.includes(d)}
                            onClick={() => toggle("diets", d)}
                        />
                    ))}
                </div>
            </section>

            {/* Allergens to Avoid */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Allergens to Avoid</h3>
                <div className="grid grid-cols-2 gap-x-4">
                    {ALLERGENS.map((a) => (
                        <CheckboxRow
                            key={a}
                            label={a}
                            checked={local.allergens.includes(a)}
                            onChange={() => toggle("allergens", a)}
                        />
                    ))}
                </div>
            </section>

            {/* Health Conditions */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Health Conditions</h3>
                <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                        <TogglePill
                            key={c}
                            label={c}
                            active={local.healthConditions.includes(c)}
                            onClick={() => toggle("healthConditions", c)}
                        />
                    ))}
                </div>
            </section>

            {/* Nutrition Goals */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Nutrition Goals</h3>
                <div className="space-y-0.5">
                    {NUTRITION_GOALS.map((ng) => (
                        <RadioRow
                            key={ng.value}
                            label={ng.label}
                            selected={local.nutritionGoal === ng.value}
                            onClick={() =>
                                setLocal((p) => ({ ...p, nutritionGoal: p.nutritionGoal === ng.value ? null : ng.value }))
                            }
                        />
                    ))}
                </div>
            </section>

            {/* Cooking Time */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Cooking Time</h3>
                <div className="flex gap-2">
                    {COOKING_TIMES.map((ct) => (
                        <button
                            key={ct.label}
                            type="button"
                            onClick={() => setLocal((p) => ({ ...p, cookingTime: ct.value }))}
                            className={`flex-1 py-3 rounded-[14px] flex flex-col items-center gap-0.5 text-center transition-colors ${local.cookingTime === ct.value
                                ? "bg-[#99CC33] text-white"
                                : "bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]"
                                }`}
                        >
                            <span className="text-[14px] font-bold">{ct.label}</span>
                            <span className={`text-[10px] font-semibold uppercase ${local.cookingTime === ct.value ? "text-white/80" : "text-[#94A3B8]"
                                }`}>
                                {ct.sub}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Cuisine */}
            <section>
                <h3 className="text-[16px] font-bold text-[#0F172A] mb-3">Cuisine</h3>
                <div className="flex flex-wrap gap-2">
                    {CUISINES.map((c) => (
                        <TogglePill
                            key={c}
                            label={c}
                            active={local.cuisines.includes(c)}
                            onClick={() => toggle("cuisines", c)}
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}

/* ── Main component ── */

interface FiltersPanelProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    filters: SearchFilterState
    onApply: (filters: SearchFilterState) => void
}

export function FiltersPanel({ open, onOpenChange, filters, onApply }: FiltersPanelProps) {
    const [local, setLocal] = useState<SearchFilterState>(filters)

    // Sync when opening
    if (open && local !== filters && JSON.stringify(local) === JSON.stringify(EMPTY_FILTERS)) {
        setLocal(filters)
    }

    if (!open) return null

    const toggle = <K extends keyof SearchFilterState>(key: K, value: string) => {
        setLocal((prev) => {
            const arr = prev[key] as string[]
            const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]
            return { ...prev, [key]: next }
        })
    }

    const handleReset = () => setLocal(EMPTY_FILTERS)

    const handleApply = () => {
        onApply(local)
        onOpenChange(false)
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-50"
                onClick={() => onOpenChange(false)}
            />

            {/* Desktop: right-side panel (max 480px) */}
            <div className="hidden lg:flex fixed inset-y-0 right-0 z-50 w-[480px] max-w-full flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9]">
                    <button type="button" onClick={() => onOpenChange(false)} className="p-1 rounded-lg hover:bg-[#F1F5F9]">
                        <X className="w-5 h-5 text-[#0F172A]" />
                    </button>
                    <h2 className="text-[18px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                        Filters
                    </h2>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-[14px] font-semibold text-[#99CC33]"
                    >
                        RESET
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <FilterBody local={local} setLocal={setLocal} toggle={toggle} />
                </div>

                {/* Sticky Apply button */}
                <div className="border-t border-[#F1F5F9] px-6 py-4 bg-white">
                    <button
                        type="button"
                        onClick={handleApply}
                        className="w-full py-3.5 rounded-[48px] bg-[#99CC33] text-white text-[16px] font-bold hover:bg-[#8ABB2A] transition-colors"
                        style={{
                            boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                        }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Mobile: full-screen overlay */}
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-white">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
                    <button type="button" onClick={() => onOpenChange(false)} className="p-1">
                        <X className="w-5 h-5 text-[#0F172A]" />
                    </button>
                    <h2 className="text-[18px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                        Filters
                    </h2>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-[14px] font-semibold text-[#99CC33]"
                    >
                        RESET
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-5 py-5 pb-28">
                    <FilterBody local={local} setLocal={setLocal} toggle={toggle} />
                </div>

                {/* Sticky Apply button */}
                <div className="border-t border-[#F1F5F9] px-5 py-4 bg-white">
                    <button
                        type="button"
                        onClick={handleApply}
                        className="w-full py-4 rounded-[48px] bg-[#99CC33] text-white text-[16px] font-bold hover:bg-[#8ABB2A] transition-colors"
                        style={{
                            boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.2), 0px 4px 6px -4px rgba(153,204,51,0.2)",
                        }}
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </>
    )
}
