import type { RecommendationSettings } from "./types"
import { ALL_CUISINES, ALL_DIETS, ALL_ALLERGENS } from "./data"

// ---- Non-optional default sections ----
const DEFAULT_BEHAVIOR: NonNullable<RecommendationSettings["behavior"]> = {
  showScoreBadge: true,
  exploration: 0.15,
  shortTermFocus: 0.5,
}

const DEFAULT_PERSONALIZATION: NonNullable<RecommendationSettings["personalization"]> = {
  diversityBias: 0.25,
  avoidRecentlyViewedHours: 48,
}

const DEFAULT_NOTIFICATIONS: NonNullable<RecommendationSettings["notifications"]> = {
  enableReminders: false,
}

const DEFAULT_ADVANCED: NonNullable<RecommendationSettings["advanced"]> = {
  weights: {
    health: 0.35,
    time: 0.15,
    popularity: 0.15,
    personal: 0.25,
    diversity: 0.10,
  },
  filters: {
    calories: [0, 1000],
    proteinMin: 0,
    carbsMin: 0,
    fatMin: 0,
    fiberMin: 0,
    sugarMax: 60,
    sodiumMax: 2300,
    maxTime: 120,
  },
}

// ---- Full defaults ----
export const DEFAULT_SETTINGS: RecommendationSettings = {
  units: "US",
  cuisines: ["Italian", "American", "Mediterranean"],
  dislikes: [],
  timeRangeMinMax: [0, 120],
  diets: [],
  allergens: [],

  calorieTarget: 2000,
  macroWeights: { protein: 30, carbs: 40, fat: 30 },
  caps: { sodiumMax: 2300, addedSugarMax: 50 },

  behavior: DEFAULT_BEHAVIOR,
  personalization: DEFAULT_PERSONALIZATION,
  notifications: DEFAULT_NOTIFICATIONS,
  advanced: DEFAULT_ADVANCED,
}

// ---- Download helper (kept for Privacy tab) ----
export function downloadSettingsJson(settings: RecommendationSettings): void {
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

export { ALL_CUISINES, ALL_DIETS, ALL_ALLERGENS }
