"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { apiGetAllergens, apiGetDietaryPreferences, apiGetHealthConditions } from "@/lib/api"
import type { TaxonomyOption } from "@/lib/api"

/* ── Types ── */
export type Sex = "male" | "female" | "other"
export type HeightUnit = "cm" | "ft"
export type WeightUnit = "kg" | "lbs"
export type ActivityValue = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active"
export type GoalValue = "lose_weight" | "maintain_weight" | "gain_muscle"

export interface OnboardingData {
    dob: string
    sex: Sex
    heightValue: string
    heightUnit: HeightUnit
    weightValue: string
    weightUnit: WeightUnit
    activityLevel: ActivityValue
    goal: GoalValue
    allergens: string[]
    healthConditions: string[]
    dietaryPreferences: string[]
    // PRD-33: Location fields
    country: string
    state: string
    zipCode: string
}

const defaultData: OnboardingData = {
    dob: "",
    sex: "male",
    heightValue: "",
    heightUnit: "cm",
    weightValue: "",
    weightUnit: "kg",
    activityLevel: "sedentary",
    goal: "lose_weight",
    allergens: [],
    healthConditions: [],
    dietaryPreferences: [],
    country: "",
    state: "",
    zipCode: "",
}

/* ── Steps config ── */
export const STEPS = [
    { path: "/onboarding/personal-info", label: "Personal Details", step: 2 },
    { path: "/onboarding/location", label: "Location", step: 3 },
    { path: "/onboarding/lifestyle", label: "Activity Level", step: 4 },
    { path: "/onboarding/goals", label: "Goals", step: 5 },
    { path: "/onboarding/health", label: "Profile Setup", step: 6 },
    { path: "/onboarding/review", label: "Review", step: 7 },
] as const

export const TOTAL_STEPS = 6

/* ── Context ── */
interface OnboardingContextValue {
    data: OnboardingData
    setData: React.Dispatch<React.SetStateAction<OnboardingData>>
    allergenOptions: TaxonomyOption[]
    healthConditionOptions: TaxonomyOption[]
    dietaryPrefOptions: TaxonomyOption[]
    currentStepIndex: number
    goNext: () => void
    goBack: () => void
    stepLabel: string
    stepNumber: number
    progress: number
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

export function useOnboarding() {
    const ctx = useContext(OnboardingContext)
    if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider")
    return ctx
}

/* ── Provider ── */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [data, setData] = useState<OnboardingData>(defaultData)

    const [allergenOptions, setAllergenOptions] = useState<TaxonomyOption[]>([])
    const [healthConditionOptions, setHealthConditionOptions] = useState<TaxonomyOption[]>([])
    const [dietaryPrefOptions, setDietaryPrefOptions] = useState<TaxonomyOption[]>([])

    useEffect(() => {
        Promise.all([apiGetAllergens(), apiGetHealthConditions(), apiGetDietaryPreferences()])
            .then(([a, h, d]) => {
                setAllergenOptions(a)
                setHealthConditionOptions(h)
                setDietaryPrefOptions(d)
            })
            .catch(() => { /* fallback: empty arrays */ })
    }, [])

    const currentStepIndex = STEPS.findIndex((s) => pathname?.startsWith(s.path))
    const idx = currentStepIndex >= 0 ? currentStepIndex : 0

    const goNext = useCallback(() => {
        if (idx < STEPS.length - 1) router.push(STEPS[idx + 1].path)
        else router.push("/onboarding/success")
    }, [idx, router])

    const goBack = useCallback(() => {
        if (idx > 0) router.push(STEPS[idx - 1].path)
        else router.push("/register")
    }, [idx, router])

    const stepLabel = STEPS[idx]?.label ?? ""
    const stepNumber = STEPS[idx]?.step ?? 2
    const progress = ((stepNumber - 1) / TOTAL_STEPS) * 100

    return (
        <OnboardingContext.Provider value={{ data, setData, allergenOptions, healthConditionOptions, dietaryPrefOptions, currentStepIndex: idx, goNext, goBack, stepLabel, stepNumber, progress }}>
            {children}
        </OnboardingContext.Provider>
    )
}
