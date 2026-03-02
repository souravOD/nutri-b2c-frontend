"use client"

import { ChevronLeft, ArrowRight, Search, Check } from "lucide-react"
import { useOnboarding, TOTAL_STEPS } from "../onboarding-context"
import { useState } from "react"

function toggleArray(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

const FALLBACK_ALLERGENS = ["Dairy", "Peanuts", "Shellfish", "Gluten", "Soy", "Tree Nuts", "Eggs"]
const FALLBACK_HEALTH = ["Diabetes", "Hypertension", "Celiac", "High Cholesterol", "PCOS", "IBS", "Lactose Intolerance"]

export default function HealthPage() {
    const { data, setData, goNext, goBack, stepLabel, stepNumber, progress, allergenOptions, healthConditionOptions } = useOnboarding()
    const [searchTerm, setSearchTerm] = useState("")

    const allergens = allergenOptions.length > 0 ? allergenOptions.map((a) => a.name) : FALLBACK_ALLERGENS
    const conditions = healthConditionOptions.length > 0 ? healthConditionOptions.map((h) => h.name) : FALLBACK_HEALTH

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
            {/* Header */}
            <div className="px-4 pt-4">
                <div className="flex items-center justify-between">
                    <button onClick={goBack} className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                        <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
                    </button>
                    <span className="text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Onboarding</span>
                    <div className="w-10" />
                </div>
                <div className="mt-6 space-y-3 px-2">
                    <div className="flex items-end justify-between">
                        <span className="text-[16px] font-semibold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>{stepLabel}</span>
                        <span className="text-[14px] font-medium" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>Step {stepNumber} of {TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: "var(--nutri-green-20)" }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress}%`, background: "var(--nutri-green)" }} />
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 px-6 pt-6 pb-[140px] space-y-8 max-w-[480px] mx-auto w-full overflow-y-auto">
                <div className="space-y-3">
                    <h1 className="text-[28px] font-bold leading-[32px] tracking-[-0.6px]" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>
                        Tell us about your health
                    </h1>
                    <p className="text-[14px] leading-[20px]" style={{ color: "var(--nutri-body-light)", fontFamily: "Inter, sans-serif" }}>
                        We&apos;ll tailor your food recommendations based on your needs.
                    </p>
                </div>

                {/* Search bar */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--nutri-placeholder)" }} />
                    <input
                        type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search allergies or conditions..."
                        className="w-full h-14 pl-12 pr-6 rounded-full border text-[16px] outline-none focus:border-[var(--nutri-green)]"
                        style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                    />
                </div>

                {/* Allergies */}
                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Allergies</h2>
                    <div className="flex flex-wrap gap-3">
                        {allergens.filter((a) => !searchTerm || a.toLowerCase().includes(searchTerm.toLowerCase())).map((a) => {
                            const selected = data.allergens.includes(a)
                            return (
                                <button
                                    key={a} onClick={() => setData((d) => ({ ...d, allergens: toggleArray(d.allergens, a) }))}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[14px] font-medium transition-all"
                                    style={{
                                        background: selected ? "var(--nutri-green)" : "white",
                                        borderColor: selected ? "var(--nutri-green)" : "var(--nutri-border)",
                                        color: selected ? "white" : "var(--nutri-heading)",
                                        fontFamily: "Inter, sans-serif",
                                    }}
                                >
                                    {selected && <Check className="w-3.5 h-3.5" />}
                                    {a}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Health Conditions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Health Conditions</h2>
                        <span className="text-[12px] font-bold tracking-wider uppercase" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>Recommended</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {conditions.filter((c) => !searchTerm || c.toLowerCase().includes(searchTerm.toLowerCase())).map((c) => {
                            const selected = data.healthConditions.includes(c)
                            return (
                                <button
                                    key={c} onClick={() => setData((d) => ({ ...d, healthConditions: toggleArray(d.healthConditions, c) }))}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[14px] font-medium transition-all"
                                    style={{
                                        background: selected ? "var(--nutri-green)" : "white",
                                        borderColor: selected ? "var(--nutri-green)" : "var(--nutri-border)",
                                        color: selected ? "white" : "var(--nutri-heading)",
                                        fontFamily: "Inter, sans-serif",
                                    }}
                                >
                                    {selected && <Check className="w-3.5 h-3.5" />}
                                    {c}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 px-6 py-6 max-w-[480px] mx-auto" style={{ background: "var(--nutri-bg)", backdropFilter: "blur(6px)" }}>
                <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
