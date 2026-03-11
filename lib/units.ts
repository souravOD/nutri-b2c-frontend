// Common cooking unit conversions (approximate)
export const VOLUME_TO_ML = {
  ml: 1, tsp: 4.93, tbsp: 14.79, cup: 236.59, "fl oz": 29.57, pint: 473.18, quart: 946.35, liter: 1000, l: 1000,
} as const

export const WEIGHT_TO_G = {
  g: 1, kg: 1000, mg: 0.001, lb: 453.592, lbs: 453.592, oz: 28.3495,
} as const

// approximate densities (g/ml) for common ingredients when given in volume
const DENSITY = {
  water: 1, milk: 1.03, oil: 0.91, olive_oil: 0.91, flour: 0.53, sugar: 0.85, rice: 0.85,
  default: 0.8,
}

export function convertToGrams(quantity: number, unit: string, ingredient?: string): number {
  const u = unit.toLowerCase().trim()
  const weightMap = WEIGHT_TO_G as Record<string, number>
  const volumeMap = VOLUME_TO_ML as Record<string, number>
  const densityMap = DENSITY as Record<string, number>

  // direct weight
  if (u in weightMap) return quantity * weightMap[u]

  // volume => grams using density
  if (u in volumeMap) {
    const ml = quantity * volumeMap[u]
    const key =
      ingredient?.includes("oil") ? "olive_oil"
      : ingredient?.includes("milk") ? "milk"
      : ingredient?.includes("sugar") ? "sugar"
      : ingredient?.includes("flour") ? "flour"
      : ingredient?.includes("rice") ? "rice"
      : "default"
    const density = densityMap[key] ?? DENSITY.default
    return ml * density
  }

  // unknown unit? best effort: treat as grams
  return quantity
}
