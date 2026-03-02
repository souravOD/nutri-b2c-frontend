"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { RecommendationSettings } from "@/lib/types"
import { DEFAULT_SETTINGS } from "@/lib/settings"
import { apiGetSettings, apiPatchSettings } from "@/lib/api"

type SettingsContextType = {
  settings: RecommendationSettings
  setSettings: (settings: RecommendationSettings) => void
  updateSettings: (partial: Partial<RecommendationSettings>) => void
  apply: () => Promise<void>
  resetToDefaults: () => Promise<void>
  downloadJson: () => void
  isLoading: boolean
  hasUnsavedChanges: boolean
}

const SettingsContext = createContext<SettingsContextType | null>(null)

/** Map the flat API response back into the nested RecommendationSettings shape */
function apiToSettings(api: Record<string, any>): RecommendationSettings {
  return {
    units: api.units ?? "US",
    cuisines: api.preferredCuisines ?? [],
    dislikes: api.dislikedIngredients ?? [],
    timeRangeMinMax: [api.timeRangeMin ?? 0, api.timeRangeMax ?? 120],
    diets: [],
    allergens: [],

    // Goals
    healthGoal: api.healthGoal ?? null,
    targetWeightKg: api.targetWeightKg != null ? Number(api.targetWeightKg) : undefined,
    calorieTarget: api.targetCalories != null ? Number(api.targetCalories) : 2000,
    macroWeights: {
      protein: api.targetProteinG != null ? Number(api.targetProteinG) : 30,
      carbs: api.targetCarbsG != null ? Number(api.targetCarbsG) : 40,
      fat: api.targetFatG != null ? Number(api.targetFatG) : 30,
    },
    caps: {
      sodiumMax: api.targetSodiumMg != null ? Number(api.targetSodiumMg) : 2300,
      addedSugarMax: api.targetSugarG != null ? Number(api.targetSugarG) : 50,
    },
    targetFiberG: api.targetFiberG != null ? Number(api.targetFiberG) : undefined,

    behavior: {
      showScoreBadge: api.showScoreBadge ?? true,
      exploration: api.exploration ?? 0.15,
      shortTermFocus: 0.5,
      defaultSort: api.defaultSort ?? "time",
    },
    personalization: {
      diversityBias: api.diversityWeight ?? 0.25,
      avoidRecentlyViewedHours: 48,
    },
    notifications: {
      enableReminders: api.enableReminders ?? false,
    },
    advanced: {
      weights: {
        health: api.healthWeight ?? 0.35,
        time: api.timeWeight ?? 0.15,
        popularity: api.popularityWeight ?? 0.15,
        personal: api.personalWeight ?? 0.25,
        diversity: api.diversityWeight ?? 0.10,
      },
      filters: {
        calories: [api.filterCaloriesMin ?? 0, api.filterCaloriesMax ?? 1000],
        proteinMin: api.filterProteinMin ?? 0,
        carbsMin: api.filterCarbsMin ?? 0,
        fatMin: api.filterFatMin ?? 0,
        fiberMin: api.filterFiberMin ?? 0,
        sugarMax: api.filterSugarMax ?? 60,
        sodiumMax: api.filterSodiumMax ?? 2300,
        maxTime: api.filterMaxTime ?? 120,
      },
    },
  }
}

/** Map the nested RecommendationSettings shape to the flat API body */
function settingsToApi(s: RecommendationSettings): Record<string, any> {
  const adv = s.advanced as any ?? { weights: {}, filters: {} }
  const w = adv.weights ?? {}
  const f = adv.filters ?? {}
  const behavior = s.behavior ?? {}
  return {
    // General
    units: s.units,
    preferredCuisines: s.cuisines,
    dislikedIngredients: s.dislikes,
    timeRangeMin: s.timeRangeMinMax?.[0] ?? 0,
    timeRangeMax: s.timeRangeMinMax?.[1] ?? 120,
    // Goals
    healthGoal: s.healthGoal ?? null,
    targetWeightKg: s.targetWeightKg ?? null,
    targetCalories: s.calorieTarget ?? null,
    targetProteinG: s.macroWeights?.protein ?? null,
    targetCarbsG: s.macroWeights?.carbs ?? null,
    targetFatG: s.macroWeights?.fat ?? null,
    targetFiberG: s.targetFiberG ?? null,
    targetSodiumMg: s.caps?.sodiumMax ?? null,
    targetSugarG: s.caps?.addedSugarMax ?? null,
    // Recommend
    exploration: behavior.exploration ?? 0.15,
    diversityWeight: w.diversity ?? 0.10,
    healthWeight: w.health ?? 0.35,
    timeWeight: w.time ?? 0.15,
    popularityWeight: w.popularity ?? 0.15,
    personalWeight: w.personal ?? 0.25,
    defaultSort: behavior.defaultSort ?? "time",
    showScoreBadge: behavior.showScoreBadge ?? true,
    // Alerts
    enableReminders: s.notifications?.enableReminders ?? false,
    // Advanced filters
    filterCaloriesMin: f.calories?.[0] ?? 0,
    filterCaloriesMax: f.calories?.[1] ?? 1000,
    filterProteinMin: f.proteinMin ?? 0,
    filterCarbsMin: f.carbsMin ?? 0,
    filterFatMin: f.fatMin ?? 0,
    filterFiberMin: f.fiberMin ?? 0,
    filterSugarMax: f.sugarMax ?? 60,
    filterSodiumMax: f.sodiumMax ?? 2300,
    filterMaxTime: f.maxTime ?? 120,
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<RecommendationSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Load settings from backend on mount
  useEffect(() => {
    let cancelled = false
    apiGetSettings()
      .then((data: any) => {
        if (!cancelled) setSettingsState(apiToSettings(data))
      })
      .catch(() => {
        // Fall back to defaults on error (e.g. not logged in)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const setSettings = (newSettings: RecommendationSettings) => {
    setSettingsState(newSettings)
    setHasUnsavedChanges(true)
  }

  const updateSettings = (partial: Partial<RecommendationSettings>) => {
    const updated = { ...settings, ...partial }
    setSettings(updated)
  }

  const apply = useCallback(async () => {
    try {
      await apiPatchSettings(settingsToApi(settings))
      setHasUnsavedChanges(false)
    } catch {
      // Toast error will be handled by UI
      throw new Error("Failed to save settings")
    }
  }, [settings])

  const resetToDefaults = useCallback(async () => {
    try {
      await apiPatchSettings(settingsToApi(DEFAULT_SETTINGS))
      setSettingsState(DEFAULT_SETTINGS)
      setHasUnsavedChanges(false)
    } catch {
      throw new Error("Failed to reset settings")
    }
  }, [])

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "nutrifind-settings.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        updateSettings,
        apply,
        resetToDefaults,
        downloadJson,
        isLoading,
        hasUnsavedChanges,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
