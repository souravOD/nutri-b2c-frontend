const STORAGE_KEY = "user_recipes_v1"

export type UserRecipeRecord = { id: string } & Record<string, unknown>

function isUserRecipeRecord(value: unknown): value is UserRecipeRecord {
  if (!value || typeof value !== "object") return false
  const maybe = value as { id?: unknown }
  return typeof maybe.id === "string"
}

export function makeUserRecipeId() {
  return `user_${Date.now()}`
}

export function loadUserRecipes(): UserRecipeRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as unknown
    return Array.isArray(parsed) ? parsed.filter(isUserRecipeRecord) : []
  } catch {
    return []
  }
}

export function saveUserRecipe(r: UserRecipeRecord) {
  const all = loadUserRecipes()
  const idx = all.findIndex((x) => x.id === r.id)
  if (idx >= 0) all[idx] = r
  else all.unshift(r)
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 500))) } catch {}
}
