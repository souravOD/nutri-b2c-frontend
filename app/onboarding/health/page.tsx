"use client"

import { ChevronLeft, ArrowRight, Search, Check, Plus, Minus } from "lucide-react"
import { useOnboarding, TOTAL_STEPS } from "../onboarding-context"
import { useState } from "react"
import { displayLabel } from "@/lib/taxonomy"

function toggleArray(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
}

/* FDA Top 9 allergens — shown by default */
const TOP_ALLERGENS = new Set([
    "Milk (dairy)", "Egg", "Fish (finned)", "Shellfish — crustaceans",
    "Tree nuts", "Peanut", "Wheat / gluten cereals", "Soy", "Sesame (seed)",
])

/* Common health conditions — shown by default */
const TOP_CONDITIONS = new Set([
    "Type 2 Diabetes", "Hypertension (High Blood Pressure)",
    "Hyperlipidemia / High Cholesterol", "Celiac Disease",
    "Lactose Intolerance", "Irritable Bowel Syndrome (IBS)",
    "Heart Disease / Cardiovascular Disease",
])

const FALLBACK_ALLERGENS = ["Milk (dairy)", "Egg", "Fish (finned)", "Shellfish — crustaceans", "Tree nuts", "Peanut", "Wheat / gluten cereals", "Soy", "Sesame (seed)"]
const FALLBACK_HEALTH = ["Type 2 Diabetes", "Hypertension (High Blood Pressure)", "Hyperlipidemia / High Cholesterol", "Celiac Disease", "Lactose Intolerance", "Irritable Bowel Syndrome (IBS)", "Heart Disease / Cardiovascular Disease"]

const INITIAL_SHOW = 7

export default function HealthPage() {
    const { data, setData, goNext, goBack, stepLabel, stepNumber, progress, allergenOptions, healthConditionOptions } = useOnboarding()
    const [searchTerm, setSearchTerm] = useState("")
    const [showAllAllergens, setShowAllAllergens] = useState(false)
    const [showAllConditions, setShowAllConditions] = useState(false)

    const allergens = allergenOptions.length > 0 ? allergenOptions.map((a) => a.name) : FALLBACK_ALLERGENS
    const conditions = healthConditionOptions.length > 0 ? healthConditionOptions.map((h) => h.name) : FALLBACK_HEALTH

    // Sort: top items first, then alphabetical
    const sortedAllergens = [...allergens].sort((a, b) => {
        const aTop = TOP_ALLERGENS.has(a)
        const bTop = TOP_ALLERGENS.has(b)
        if (aTop && !bTop) return -1
        if (!aTop && bTop) return 1
        return a.localeCompare(b)
    })

    const sortedConditions = [...conditions].sort((a, b) => {
        const aTop = TOP_CONDITIONS.has(a)
        const bTop = TOP_CONDITIONS.has(b)
        if (aTop && !bTop) return -1
        if (!aTop && bTop) return 1
        return a.localeCompare(b)
    })

    // Filter by search
    const filteredAllergens = sortedAllergens.filter((a) => !searchTerm || a.toLowerCase().includes(searchTerm.toLowerCase()))
    const filteredConditions = sortedConditions.filter((c) => !searchTerm || c.toLowerCase().includes(searchTerm.toLowerCase()))

    // When searching, show all; otherwise collapse
    const isSearching = searchTerm.length > 0
    const visibleAllergens = isSearching || showAllAllergens ? filteredAllergens : filteredAllergens.slice(0, INITIAL_SHOW)
    const hiddenAllergenCount = filteredAllergens.length - INITIAL_SHOW
    const visibleConditions = isSearching || showAllConditions ? filteredConditions : filteredConditions.slice(0, INITIAL_SHOW)
    const hiddenConditionCount = filteredConditions.length - INITIAL_SHOW

    return (
        <div className="ob-page min-h-screen flex flex-col" style={{ background: "var(--nutri-bg)" }}>
            {/* Header */}
            <div className="ob-header px-4 pt-4">
                <div className="ob-nav flex items-center justify-between">
                    <button onClick={goBack} className="ob-back flex items-center justify-center w-10 h-10 rounded-full" style={{ background: "rgba(226,232,240,0.5)" }}>
                        <ChevronLeft className="w-4 h-4" style={{ color: "var(--nutri-heading)" }} />
                    </button>
                    <span className="ob-title text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Onboarding</span>
                    <div className="ob-spacer w-10" />
                </div>
                <div className="ob-progress mt-6 space-y-3 px-2">
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
            <div className="ob-main flex-1 px-6 pt-6 pb-[140px] space-y-8 max-w-[480px] mx-auto w-full overflow-y-auto">
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
                        className="ob-search w-full h-14 pl-12 pr-6 rounded-full border text-[16px] outline-none focus:border-[var(--nutri-green)]"
                        style={{ background: "white", borderColor: "var(--nutri-border)", color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}
                    />
                </div>

                {/* Allergies */}
                <div className="space-y-4">
                    <h2 className="text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Allergies</h2>
                    <div className="flex flex-wrap gap-3">
                        {visibleAllergens.map((a) => {
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
                                    {displayLabel(a)}
                                </button>
                            )
                        })}
                    </div>
                    {!isSearching && hiddenAllergenCount > 0 && (
                        <button
                            onClick={() => setShowAllAllergens((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-semibold transition-all"
                            style={{
                                background: "var(--nutri-green-5)",
                                borderColor: "var(--nutri-green-10)",
                                color: "var(--nutri-green-dark)",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            {showAllAllergens ? (
                                <><Minus className="w-3.5 h-3.5" /> Show less</>
                            ) : (
                                <><Plus className="w-3.5 h-3.5" /> {hiddenAllergenCount} more</>
                            )}
                        </button>
                    )}
                </div>

                {/* Health Conditions */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[18px] font-bold" style={{ color: "var(--nutri-heading)", fontFamily: "Inter, sans-serif" }}>Health Conditions</h2>
                        <span className="text-[12px] font-bold tracking-wider uppercase" style={{ color: "var(--nutri-green-dark)", fontFamily: "Inter, sans-serif" }}>Recommended</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {visibleConditions.map((c) => {
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
                                    {displayLabel(c)}
                                </button>
                            )
                        })}
                    </div>
                    {!isSearching && hiddenConditionCount > 0 && (
                        <button
                            onClick={() => setShowAllConditions((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-[13px] font-semibold transition-all"
                            style={{
                                background: "var(--nutri-green-5)",
                                borderColor: "var(--nutri-green-10)",
                                color: "var(--nutri-green-dark)",
                                fontFamily: "Inter, sans-serif",
                            }}
                        >
                            {showAllConditions ? (
                                <><Minus className="w-3.5 h-3.5" /> Show less</>
                            ) : (
                                <><Plus className="w-3.5 h-3.5" /> {hiddenConditionCount} more</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="ob-footer fixed bottom-0 left-0 right-0 px-6 py-6 max-w-[480px] mx-auto" style={{ background: "var(--nutri-bg)", backdropFilter: "blur(6px)" }}>
                <button
                    onClick={goNext}
                    className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-[16px] font-bold text-black transition-opacity hover:opacity-90"
                    style={{ background: "var(--nutri-green)", fontFamily: "Inter, sans-serif", boxShadow: "0px 10px 15px -3px rgba(153,204,51,0.25), 0px 4px 6px -4px rgba(153,204,51,0.25)" }}
                >
                    Continue <ArrowRight className="w-4 h-4" />
                </button>
                <p className="ob-terms text-center text-[12px] leading-[16px] mt-4" style={{ color: "var(--nutri-placeholder)", fontFamily: "Inter, sans-serif" }}>
                    By continuing, you agree to our{" "}
                    {process.env.NEXT_PUBLIC_MARKETING_URL ? (
                        <>
                            <a href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/terms`} target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a>{" "}and{" "}
                            <a href={`${process.env.NEXT_PUBLIC_MARKETING_URL}/privacy`} target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.
                        </>
                    ) : (
                        <><a href="/terms" target="_blank" rel="noopener noreferrer" className="underline">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">Privacy Policy</a>.</>
                    )}
                </p>
            </div>

            <style jsx>{`
                @media (min-width: 1024px) {
                    .ob-header { max-width: 1160px; margin: 0 auto; padding: 16px 60px 0; width: 100%; box-sizing: border-box; }
                    .ob-nav { justify-content: flex-start; gap: 12px; }
                    .ob-spacer { display: none; }
                    .ob-title { font-size: 22px; font-weight: 700; }
                    .ob-main { max-width: 1160px; padding: 24px 60px 40px; box-sizing: border-box; }
                    .ob-search { border-radius: 16px; }
                    .ob-footer {
                        position: static; max-width: 480px; margin: 0 auto;
                        padding: 0 60px 32px;
                    }
                }
            `}</style>
        </div>
    )
}
