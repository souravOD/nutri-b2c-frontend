// lib/analyze.ts
import type { AnalyzeResult } from "@/lib/types"
import ingredientsDb from "@/app/_mock/ingredients-db.json"
import tasteProfiles from "@/app/_mock/taste-profiles.json"
import { convertToGrams } from "@/lib/units"

/** ---------- Types ---------- */

type IngredientDBRecord = {
  name: string
  aliases?: string[]
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  sodium?: number
  sugars?: number
  fiber?: number
  potassium?: number
  iron?: number
  calcium?: number
  vitaminD?: number
}

type NutritionPerServing = NonNullable<AnalyzeResult["nutritionPerServing"]>

/** ---------- Text Parsing ---------- */

export function parseRecipeText(text: string) {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim())
  const nonEmpty = lines.filter(Boolean)
  const title = (nonEmpty[0] || "Untitled").trim()

  let servings = 1
  const ingredients: string[] = []
  const steps: string[] = []

  let section: "title" | "ingredients" | "steps" | "unknown" = "title"

  for (const raw of lines) {
    const line = raw.trim()

    // servings detection
    if (/serv(es|ings?)\s*[:\-]?\s*(\d+)/i.test(line) || /makes\s+(\d+)/i.test(line)) {
      const m = /(\d+)/.exec(line)
      if (m) servings = Number(m[1])
    }

    // headers
    if (/^\s*ingredients?\s*:?\s*$/i.test(line)) { section = "ingredients"; continue }
    if (/^\s*(instructions?|steps?)\s*:?\s*$/i.test(line)) { section = "steps"; continue }

    if (section === "title") { section = "unknown"; continue }

    const looksLikeIngredient =
      /^\d/.test(line) ||
      /(cup|cups|tsp|tbsp|oz|lb|g|kg|ml|l)\b/i.test(line) ||
      /^[-*]\s+/.test(line)

    if (section === "ingredients" || looksLikeIngredient) {
      if (line) ingredients.push(line.replace(/^[-*]\s*/, ""))
      continue
    }

    if (section === "steps" || /^\d+[\)\.]\s*/.test(line)) {
      const step = line.replace(/^\d+[\)\.]\s*/, "")
      if (step) steps.push(step)
      continue
    }
  }

  return { title, servings: servings || 1, ingredients, steps }
}

export function parseIngredient(s: string) {
  const m = /^(\d+(?:\.\d+)?|\d+\s*\d+\/\d+|\d+\/\d+)?\s*(cups?|tbsps?|tbsp|tsps?|tsp|g|kg|ml|l|oz|lb|lbs|cup|pcs?)?\s*(.*)$/i.exec(s)

  const toNum = (f?: string) => {
    if (!f) return undefined
    const t = f.trim()
    if (/^\d+\s+\d+\/\d+$/.test(t)) {
      const [a, b] = t.split(/\s+/)
      const [n, d] = b.split("/").map(Number)
      return Number(a) + n / d
    }
    if (/^\d+\/\d+$/.test(t)) {
      const [n, d] = t.split("/").map(Number)
      return n / d
    }
    const n = Number(t)
    return Number.isFinite(n) ? n : undefined
  }

  return {
    qty: toNum(m?.[1] || ""),
    unit: (m?.[2] || "").toLowerCase(),
    item: (m?.[3] || s).trim(),
  }
}

/** ---------- Nutrition Estimation ---------- */

export function estimateNutrition(
  rows: Array<{ qty?: number; unit?: string; item: string }>,
  servings: number,
) {
  // Cast JSON to typed mini DB
  const db = ingredientsDb as unknown as IngredientDBRecord[]

  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sodium: 0,
    sugars: 0,
    fiber: 0,
    potassium: 0,
    iron: 0,
    calcium: 0,
    vitaminD: 0,
  }

  const match = (name: string): IngredientDBRecord | undefined => {
    const q = name.toLowerCase()
    return db.find(
      (r) =>
        r.name === q ||
        r.name.includes(q) ||
        (r.aliases || []).some((a) => q.includes(a)),
    )
  }

  for (const r of rows) {
    const rec = match(r.item) // IngredientDBRecord | undefined

    const grams = convertToGrams(Number(r.qty || 0), r.unit || "g", r.item)
    const mul = grams / 100

    totals.calories += (rec?.calories ?? 0) * mul
    totals.protein += (rec?.protein ?? 0) * mul
    totals.carbs += (rec?.carbs ?? 0) * mul
    totals.fat += (rec?.fat ?? 0) * mul
    totals.sodium += (rec?.sodium ?? 0) * mul
    totals.sugars += (rec?.sugars ?? 0) * mul
    totals.fiber += (rec?.fiber ?? 0) * mul
    totals.potassium += (rec?.potassium ?? 0) * mul
    totals.iron += (rec?.iron ?? 0) * mul
    totals.calcium += (rec?.calcium ?? 0) * mul
    totals.vitaminD += (rec?.vitaminD ?? 0) * mul
  }

  const per = Math.max(1, servings || 1)
  const round1 = (x: number) => Math.round(x * 10) / 10
  return Object.fromEntries(
    Object.entries(totals).map(([k, v]) => [k, round1(v / per)]),
  ) as Record<string, number>
}

/** ---------- Inference Helpers ---------- */

export function detectAllergens(ings: Array<{ item: string }>): string[] {
  const dict: Record<string, string[]> = {
    milk: ["milk", "cheese", "butter", "cream", "yogurt", "dairy"],
    egg: ["egg", "eggs"],
    fish: ["fish", "salmon", "tuna", "cod", "mackerel"],
    crustacean_shellfish: ["shrimp", "crab", "lobster", "prawn"],
    tree_nuts: ["almond", "walnut", "pecan", "cashew", "pistachio", "hazelnut"],
    peanuts: ["peanut", "peanuts"],
    wheat: ["wheat", "flour", "bread", "pasta", "gluten"],
    soy: ["soy", "tofu", "soy sauce", "miso"],
    sesame: ["sesame", "tahini"],
  }
  const text = ings.map((i) => i.item.toLowerCase()).join(" ")
  return Object.entries(dict)
    .filter(([, keys]) => keys.some((k) => text.includes(k)))
    .map(([k]) => k)
}

export function inferDiets(ings: Array<{ item: string }>): string[] {
  const txt = ings.map((i) => i.item.toLowerCase()).join(" ")
  const diets: string[] = []
  if (!/(meat|chicken|beef|pork|fish|shrimp|egg|cheese|milk|butter|yogurt)/.test(txt)) diets.push("vegan")
  if (!/(meat|chicken|beef|pork|fish|shrimp)/.test(txt)) diets.push("vegetarian")
  if (!/wheat|flour|bread|pasta|gluten/.test(txt)) diets.push("gluten_free")
  return diets
}

export function getTasteProfile(ings: Array<{ item: string }>): string[] {
  const set = new Set<string>()
  const table = tasteProfiles as Record<string, string[]>
  for (const ing of ings) {
    const item = ing.item.toLowerCase()
    for (const [k, tags] of Object.entries(table)) {
      if (item.includes(k.toLowerCase())) tags.forEach((t) => set.add(t))
    }
  }
  return Array.from(set)
}

/** ---------- Summaries & Suggestions ---------- */

export function generateSummary(r: AnalyzeResult) {
  const parts = [
    r.title ? `“${r.title}”` : "Recipe",
    r.servings ? `serves ${r.servings}` : "",
    r.ingredients?.length ? `${r.ingredients.length} ingredients` : "",
  ].filter(Boolean)
  const diets = (r.inferred?.diets || []).map((d) => d.replace(/_/g, " ")).join(", ")
  return `${parts.join(" • ")}. ${diets ? `Fits: ${diets}.` : ""}`
}

export function generateSuggestions(r: AnalyzeResult) {
  const s: string[] = []
  const t = r.inferred?.taste || []
  const n = (r.nutritionPerServing || {}) as NutritionPerServing
  if ((n.calories ?? 0) > 800) s.push("⚠️ High calories per serving — consider smaller portions.")
  if ((n.sodium ?? 0) > 1000) s.push("⚠️ High sodium — reduce salt or processed ingredients.")
  if ((n.protein ?? 0) < 10) s.push("💡 Add protein sources like beans, yogurt, or nuts.")
  if (t.includes("spicy") && !t.includes("cooling")) s.push("💡 Balance spice with yogurt or cucumber.")
  return s
}

/** ---------- Main Analyzer ---------- */

/**
 * Analyze recipe with LLM backend, fallback to local parser on error.
 */
export async function analyzeRecipe(text: string, memberId?: string): Promise<AnalyzeResult> {
  // Try backend LLM analysis first
  try {
    const { apiAnalyzeText } = await import("./api");
    const result = await apiAnalyzeText(text, memberId);
    console.log("[Analyze] LLM analysis succeeded:", { title: result.title, ingredientsCount: result.ingredients?.length });
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn("[Analyze] LLM analysis failed, falling back to local parser", message);
    // Fallback to local parser
    return analyzeRecipeLocal(text);
  }
}

/**
 * Local recipe parser (fallback when LLM is unavailable).
 */
export function analyzeRecipeLocal(text: string): AnalyzeResult {
  const parsed = parseRecipeText(text)
  const ingredients = parsed.ingredients.map(parseIngredient)

  const inferred = {
    allergens: detectAllergens(ingredients),
    diets: inferDiets(ingredients),
    cuisines: [] as string[],
    taste: getTasteProfile(ingredients),
  }

  // Map -> typed object for nutritionPerServing
  const nutritionMap = estimateNutrition(ingredients, parsed.servings) // Record<string, number>
  const nutritionPerServing: NutritionPerServing = {
    calories: Number(nutritionMap.calories ?? 0),
    protein: Number(nutritionMap.protein ?? 0),
    carbs: Number(nutritionMap.carbs ?? 0),
    fat: Number(nutritionMap.fat ?? 0),
    sodium: nutritionMap.sodium,
    sugar: nutritionMap.sugars,
    fiber: nutritionMap.fiber,
    potassium: nutritionMap.potassium,
    iron: nutritionMap.iron,
    calcium: nutritionMap.calcium,
    vitaminD: nutritionMap.vitaminD,
  }

  const result: AnalyzeResult = {
    title: parsed.title,
    servings: parsed.servings,
    ingredients,
    steps: parsed.steps,
    inferred,
    nutritionPerServing,
    summary: "",
    suggestions: [],
  }

  result.summary = generateSummary(result)
  result.suggestions = generateSuggestions(result)
  return result
}
