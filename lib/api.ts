// lib/api.ts
"use client";

import { account } from "./appwrite";
import type {
  Recipe,
  MealPlan,
  MealPlanGenerateParams,
  MealPlanGenerateResponse,
  MealPlanDetailResponse,
  MealPlanSwapResponse,
  ShoppingList,
  ShoppingListItem,
  GroceryListDetailResponse,
  GrocerySubstitutionCandidate,
  GenerateGroceryListPayload,
  UpdateGroceryItemPayload,
  UpdateGroceryListStatusPayload,
  Budget,
  BudgetSnapshot,
  BudgetTrendsResponse,
  BudgetRecommendationsResponse,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetPeriod,
  BudgetType,
  NutritionDashboardDailyResponse,
  NutritionDashboardWeeklyResponse,
  NutritionMemberSummaryResponse,
  NutritionHealthMetricsResponse,
  HouseholdMembersResponse,
  HouseholdMember,
  RecipeRatingResponse,
  RateRecipePayload,
  RecipeRating,
} from "./types";

type FetchOpts = Omit<RequestInit, "headers"> & { headers?: HeadersInit };
let cachedJwt: { token: string; exp: number } | null = null;

type JsonRecord = Record<string, unknown>;
type SearchFilters = {
  dietaryRestrictions?: string[] | null;
  cuisines?: string[] | null;
  allergens?: string[] | null;
  majorConditions?: string[] | null;
  calories?: number[] | null;
  proteinMin?: number | null;
  fiberMin?: number | null;
  satfatMax?: number | null;
  sugarMax?: number | null;
  sodiumMax?: number | null;
  maxTime?: number | null;
  difficulty?: string | null;
  mealType?: string | null;
};

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

const toInt = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number.parseInt(String(v), 10);

const toNum = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number.parseFloat(String(v));

type NormalizedRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  cuisine?: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g?: number | null;
  saturated_fat_g: number | null;
  sodium_mg: number | null;
  servings: number | null;
  difficulty: string | null;
  meal_type: string | null;
  cuisines: string[];
  diet_tags: string[];
  allergens: string[];
  flags: string[];
  nutrition?: JsonRecord;
  ingredients: string[] | unknown[];
  instructions: string[] | unknown[];
  notes: string | null;
  market_country: string | null;
  status?: string;
  total_time_minutes: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
};

export type Ingredient = { qty?: number | string; unit?: string; name: string };
export type Instruction = string;

export type UserRecipe = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  servings?: number | null;
  totalTimeMinutes?: number | null;
  total_time_minutes?: number | null;
  prepTimeMinutes?: number | null;
  prep_time_minutes?: number | null;
  cookTimeMinutes?: number | null;
  cook_time_minutes?: number | null;
  mealType?: string | null;
  meal_type?: string | null;
  difficulty?: string | null;
  cuisine?: string | null;
  cuisines?: string[] | null;
  ingredients?: Ingredient[] | null;
  instructions?: Instruction[] | null;
  nutrition?: JsonRecord;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  saturated_fat_g?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  createdByUserId?: string | null;
  created_by_user_id?: string | null;
};



function makeIdemKey() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

function uniqStr(arr: unknown[]): string[] {
  return Array.from(new Set((arr ?? []).filter(Boolean).map(String)));
}

function toRecipe(raw: unknown): Recipe {
  const rawRecord = asRecord(raw);
  const r = asRecord(rawRecord.recipe ?? rawRecord);

  const imageUrl = r.image_url ?? r.imageUrl ?? null;
  const prep = toInt(r.prep_time_minutes ?? r.prepTimeMinutes) ?? 0;
  const cook = toInt(r.cook_time_minutes ?? r.cookTimeMinutes) ?? 0;
  const total = toInt(r.time_minutes ?? r.total_time_minutes ?? r.totalTimeMinutes) ?? (prep + cook);

  const cuisineSource = r.cuisine;
  const cuisineObj = asRecord(cuisineSource);
  const cuisineName =
    typeof cuisineSource === "string"
      ? cuisineSource
      : cuisineObj.name ?? cuisineObj.code ?? null;
  const cuisines = Array.isArray(r.cuisines)
    ? r.cuisines
    : cuisineName
      ? [cuisineName]
      : [];

  const nutritionBase = asRecord(r.nutrition);
  const nutrition = {
    calories: toInt(nutritionBase.calories ?? r.calories) ?? undefined,
    protein_g: toNum(nutritionBase.protein_g ?? nutritionBase.protein ?? r.protein_g ?? r.proteinG) ?? undefined,
    carbs_g: toNum(nutritionBase.carbs_g ?? nutritionBase.carbs ?? r.carbs_g ?? r.carbsG) ?? undefined,
    fat_g: toNum(nutritionBase.fat_g ?? nutritionBase.fat ?? r.fat_g ?? r.fatG) ?? undefined,
    fiber_g: toNum(nutritionBase.fiber_g ?? nutritionBase.fiber ?? r.fiber_g ?? r.fiberG) ?? undefined,
    sugar_g: toNum(nutritionBase.sugar_g ?? nutritionBase.sugar ?? r.sugar_g ?? r.sugarG) ?? undefined,
    sodium_mg: toInt(nutritionBase.sodium_mg ?? nutritionBase.sodium ?? r.sodium_mg ?? r.sodiumMg) ?? undefined,
    saturatedFat: toNum(
      nutritionBase.saturated_fat_g ?? nutritionBase.saturatedFat ?? r.saturated_fat_g ?? r.saturatedFatG
    ) ?? undefined,
  };

  const tags = uniqStr([
    ...(Array.isArray(r.tags) ? r.tags : []),
    ...(Array.isArray(r.diet_tags) ? r.diet_tags : Array.isArray(r.dietTags) ? r.dietTags : []),
    ...(Array.isArray(r.flags) ? r.flags : Array.isArray(r.flag_tags) ? r.flag_tags : Array.isArray(r.flagTags) ? r.flagTags : []),
    ...cuisines,
  ]);

  const isSaved = Boolean(rawRecord.isSaved ?? rawRecord.savedAt ?? r.is_saved ?? r.isSaved);
  const score = rawRecord.score ?? r.score;
  const difficultyRaw = String(r.difficulty ?? "easy").toLowerCase();
  const difficulty = (difficultyRaw === "easy" || difficultyRaw === "medium" || difficultyRaw === "hard")
    ? difficultyRaw
    : "easy";

  const normalizedCuisines = cuisines.map((c) => String(c));
  const recipe: Recipe = {
    id: String(r.id ?? ""),
    title: String(r.title ?? "Untitled"),
    imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    image_url: typeof imageUrl === "string" ? imageUrl : undefined,
    time_minutes: total,
    prepTime: prep || total,
    cookTime: cook || 0,
    prepTimeMinutes: toInt(r.prepTimeMinutes ?? prep) ?? undefined,
    cookTimeMinutes: toInt(r.cookTimeMinutes ?? cook) ?? undefined,
    totalTimeMinutes: toInt(r.totalTimeMinutes ?? total) ?? undefined,
    servings: toInt(r.servings) ?? undefined,
    difficulty,
    isSaved,
    tags,
    cuisine: typeof cuisineName === "string" ? cuisineName : null,
    cuisines: normalizedCuisines,
    nutrition,
    allergens: Array.isArray(r.allergens) ? r.allergens.map((a) => String(a)) : [],
    score: toNum(score) ?? undefined,
  };
  return recipe;
}

async function getJwt(): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    if (cachedJwt && cachedJwt.exp - now > 60) return cachedJwt.token;
    const { jwt } = await account.createJWT();
    const exp = (() => {
      try {
        const payload = JSON.parse(atob(jwt.split(".")[1] ?? ""));
        return typeof payload.exp === "number" ? payload.exp : now + 15 * 60;
      } catch {
        return now + 15 * 60;
      }
    })();
    cachedJwt = { token: jwt, exp };
    return jwt;
  } catch {
    return null;
  }
}

export async function authFetch(path: string, opts: FetchOpts = {}) {
  const DIRECT_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
  const url = DIRECT_BASE ? `${DIRECT_BASE}${path}` : path;
  const jwt = await getJwt();
  const method = (opts.method ?? "GET").toUpperCase();

  // Normalize/dedupe headers
  const headers = new Headers();
  if (opts.headers) new Headers(opts.headers).forEach((v, k) => headers.set(k, v));
  if (opts.body && !headers.has("content-type") && !(opts.body instanceof FormData)) headers.set("content-type", "application/json");
  if (jwt) headers.set("x-appwrite-jwt", jwt);
  if (method !== "GET") headers.set("idempotency-key", makeIdemKey());

  try {
    const res = await fetch(url, {
      ...opts,
      headers,
      cache: "no-store",
      credentials: "include",
      mode: "cors",
    });
    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      let detail = raw;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          detail = parsed?.detail || parsed?.message || raw;
        } catch {
          detail = raw;
        }
      }
      throw new Error(detail || `Request failed ${res.status}`);
    }
    return res;
  } catch (err) {
    const redacted = new Set(["authorization", "x-appwrite-jwt", "idempotency-key", "cookie", "set-cookie"]);
    const safeHeaders = [...headers.entries()].map(([key, value]) => [
      key,
      redacted.has(key.toLowerCase()) ? "[REDACTED]" : value,
    ]);

    // Surface network/CORS issues in the console for easier debugging
    console.error("authFetch network error", { url, method, headers: safeHeaders }, err);
    throw err;
  }
}

/* ---- Public ---- */
function normalizeRecipeFromApi(input: unknown): NormalizedRecipe {
  const d = asRecord(input);
  const nutrition = asRecord(d.nutrition);
  const cuisineSource = d.cuisine;
  const cuisineObj = asRecord(cuisineSource);
  const cuisineName =
    typeof cuisineSource === "string"
      ? cuisineSource
      : cuisineObj.name ?? cuisineObj.code ?? null;
  const cuisines = Array.isArray(d.cuisines)
    ? d.cuisines
    : cuisineName
      ? [cuisineName]
      : [];
  const imageUrl = typeof d.imageUrl === "string" ? d.imageUrl : typeof d.image_url === "string" ? d.image_url : null;
  const sourceUrl = typeof d.sourceUrl === "string" ? d.sourceUrl : typeof d.source_url === "string" ? d.source_url : null;
  const normalizedCuisines = cuisines.map((c) => String(c));

  return {
    id: String(d.id ?? ""),
    title: String(d.title ?? ""),
    description: d.description == null ? null : String(d.description),
    image_url: imageUrl,
    source_url: sourceUrl,
    cuisine: typeof cuisineName === "string" ? cuisineName : null,

    calories: toInt(nutrition.calories ?? d.calories),
    protein_g: toNum(nutrition.protein_g ?? nutrition.protein ?? d.protein_g ?? d.proteinG),
    carbs_g: toNum(nutrition.carbs_g ?? nutrition.carbs ?? d.carbs_g ?? d.carbsG),
    fat_g: toNum(nutrition.fat_g ?? nutrition.fat ?? d.fat_g ?? d.fatG),
    fiber_g: toNum(nutrition.fiber_g ?? nutrition.fiber ?? d.fiber_g ?? d.fiberG),
    sugar_g: toNum(nutrition.sugar_g ?? nutrition.sugar ?? d.sugar_g ?? d.sugarG),
    saturated_fat_g: toNum(
      nutrition.saturated_fat_g ?? nutrition.saturatedFat ?? d.saturated_fat_g ?? d.saturatedFatG
    ),
    sodium_mg: toInt(nutrition.sodium_mg ?? nutrition.sodium ?? d.sodium_mg ?? d.sodiumMg),

    servings: toInt(d.servings),
    difficulty: d.difficulty == null ? null : String(d.difficulty),
    meal_type: d.mealType == null ? (d.meal_type == null ? null : String(d.meal_type)) : String(d.mealType),

    cuisines: normalizedCuisines,
    diet_tags: Array.isArray(d.dietTags)
      ? d.dietTags.map((tag) => String(tag))
      : Array.isArray(d.diet_tags)
        ? d.diet_tags.map((tag) => String(tag))
        : [],
    allergens: Array.isArray(d.allergens)
      ? d.allergens.map((allergen) => String(allergen))
      : Array.isArray(nutrition.allergens)
        ? nutrition.allergens.map((allergen) => String(allergen))
        : [],
    flags: Array.isArray(d.flags)
      ? d.flags.map((flag) => String(flag))
      : Array.isArray(d.flag_tags)
        ? d.flag_tags.map((flag) => String(flag))
        : [],

    ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
    instructions: Array.isArray(d.instructions) ? d.instructions : [],
    notes: d.notes == null ? null : String(d.notes),

    market_country: d.marketCountry == null ? (d.market_country == null ? null : String(d.market_country)) : String(d.marketCountry),

    status: d.status == null ? undefined : String(d.status),

    total_time_minutes: toInt(d.totalTimeMinutes ?? d.total_time_minutes ?? d.time_minutes ?? d.timeMinutes),
    prep_time_minutes: toInt(d.prepTimeMinutes ?? d.prep_time_minutes),
    cook_time_minutes: toInt(d.cookTimeMinutes ?? d.cook_time_minutes),

    created_at: d.createdAt == null ? (d.created_at == null ? null : String(d.created_at)) : String(d.createdAt),
    updated_at: d.updatedAt == null ? (d.updated_at == null ? null : String(d.updated_at)) : String(d.updatedAt),
    published_at: d.publishedAt == null ? (d.published_at == null ? null : String(d.published_at)) : String(d.publishedAt),
    nutrition,
  };
}
function normalizeUserRecipe(row: unknown): UserRecipe {
  const baseRow = asRecord(row);
  const nutrition = asRecord(baseRow.nutrition);
  const imageUrl = baseRow.image_url ?? baseRow.imageUrl ?? null;
  const cuisineName =
    typeof baseRow.cuisine === "string"
      ? baseRow.cuisine
      : asRecord(baseRow.cuisine).name ?? asRecord(baseRow.cuisine).code ?? null;
  const cuisines = Array.isArray(baseRow.cuisines)
    ? baseRow.cuisines
    : cuisineName
      ? [cuisineName]
      : [];

  return {
    ...baseRow,
    image_url: imageUrl ?? undefined,
    imageUrl,
    prep_time_minutes: baseRow.prep_time_minutes ?? baseRow.prepTimeMinutes ?? null,
    cook_time_minutes: baseRow.cook_time_minutes ?? baseRow.cookTimeMinutes ?? null,
    total_time_minutes: baseRow.total_time_minutes ?? baseRow.totalTimeMinutes ?? null,
    meal_type: baseRow.meal_type ?? baseRow.mealType ?? null,
    cuisine: cuisineName ?? (cuisines.length ? cuisines[0] : null),
    cuisines,
    calories: baseRow.calories ?? nutrition.calories ?? null,
    protein_g: baseRow.protein_g ?? nutrition.protein_g ?? nutrition.protein ?? null,
    carbs_g: baseRow.carbs_g ?? nutrition.carbs_g ?? nutrition.carbs ?? null,
    fat_g: baseRow.fat_g ?? nutrition.fat_g ?? nutrition.fat ?? null,
    fiber_g: baseRow.fiber_g ?? nutrition.fiber_g ?? nutrition.fiber ?? null,
    sugar_g: baseRow.sugar_g ?? nutrition.sugar_g ?? nutrition.sugar ?? null,
    sodium_mg: baseRow.sodium_mg ?? nutrition.sodium_mg ?? nutrition.sodium ?? null,
    saturated_fat_g: baseRow.saturated_fat_g ?? nutrition.saturated_fat_g ?? nutrition.saturatedFat ?? null,
    created_at: baseRow.created_at ?? baseRow.createdAt ?? null,
    updated_at: baseRow.updated_at ?? baseRow.updatedAt ?? null,
  } as UserRecipe;
}

export async function apiGetFeed(): Promise<Recipe[]> {
  const res = await authFetch(`/api/v1/feed`);
  const data = await res.json().catch(() => []);
  const arr = Array.isArray(data) ? data : [];
  return arr.map((it: unknown) => toRecipe(it));
}


export async function apiSearchRecipes(args: { q?: string; filters: SearchFilters; sort?: string }): Promise<Recipe[]> {
  const { q, filters, sort } = args;
  const p = new URLSearchParams();

  if (q && q.trim()) p.set("q", q.trim());

  // arrays
  if (filters?.dietaryRestrictions?.length) p.set("diets", filters.dietaryRestrictions.join(","));
  if (filters?.cuisines?.length) p.set("cuisines", filters.cuisines.join(","));
  if (filters?.allergens?.length) p.set("allergens_exclude", filters.allergens.join(","));
  if (filters?.majorConditions?.length) { p.set("major_conditions", filters.majorConditions.join(",")); }

  // calories range: only send if stricter than [0, 1200]
  const [calMin = 0, calMax = 1200] = Array.isArray(filters?.calories) ? filters.calories : [0, 1200];
  if (Number.isFinite(calMin) && calMin > 0) p.set("cal_min", String(calMin));
  if (Number.isFinite(calMax) && calMax < 1200) p.set("cal_max", String(calMax));

  // mins: send only if > 0
  if (typeof filters?.proteinMin === "number" && Number.isFinite(filters.proteinMin) && filters.proteinMin > 0) {
    p.set("protein_min", String(filters.proteinMin));
  }
  if (typeof filters?.fiberMin === "number" && Number.isFinite(filters.fiberMin) && filters.fiberMin > 0) {
    p.set("fiber_min", String(filters.fiberMin));
  }

  // sat fat: if you want a default “no limit”, either omit or guard like the others
  if (typeof filters?.satfatMax === "number" && Number.isFinite(filters.satfatMax)) {
    p.set("satfat_max", String(filters.satfatMax));
  }

  // ✅ the three you asked about — send only if stricter than baseline
  if (typeof filters?.sugarMax === "number" && Number.isFinite(filters.sugarMax) && filters.sugarMax < 100) {
    p.set("sugar_max", String(filters.sugarMax));
  }
  if (typeof filters?.sodiumMax === "number" && Number.isFinite(filters.sodiumMax) && filters.sodiumMax < 4000) {
    p.set("sodium_max", String(filters.sodiumMax));
  }
  if (typeof filters?.maxTime === "number" && Number.isFinite(filters.maxTime) && filters.maxTime < 120) {
    p.set("time_max", String(filters.maxTime));
  }

  // enums
  if (filters?.difficulty) p.set("difficulty", String(filters.difficulty));
  if (filters?.mealType) p.set("meal_type", String(filters.mealType));

  if (sort) p.set("sort", sort);

  const res = await authFetch(`/api/v1/recipes?${p.toString()}`);
  const data = await res.json().catch(() => []);
  return (Array.isArray(data) ? data : []).map(toRecipe);
}

// export async function apiGetRecipe(id: string) {
//   const res = await authFetch(`/api/v1/recipes/${id}`);
//   if (!res.ok) throw new Error(`Failed to load recipe ${id}`);
//   return res.json();
// }

export async function apiGetRecipe(id: string) {
  const res = await authFetch(`/api/v1/recipes/${id}`);
  const json = await res.json();
  return normalizeRecipeFromApi(json);
}

/* ---- Auth-required ---- */
export async function apiToggleSave(id: string): Promise<{ isSaved: boolean }> {
  return (await authFetch(`/api/v1/recipes/${id}/save`, { method: "POST" })).json();
}

export async function apiGetSaved(): Promise<Recipe[]> {
  const res = await authFetch(`/api/v1/me/saved`);
  const payload = await res.json().catch(() => null);

  // Normalize various shapes (array, {recipes}, {items}, {data}, keyed map)
  const list =
    Array.isArray(payload) ? payload :
      Array.isArray(payload?.recipes) ? payload.recipes :
        Array.isArray(payload?.items) ? payload.items :
          Array.isArray(payload?.data) ? payload.data :
            (payload && typeof payload === "object") ? Object.values(payload) :
              [];

  return list.map(toRecipe);
}


// ---------- Recipe Analyzer API Functions ----------

export async function apiAnalyzeText(text: string, memberId?: string): Promise<AnalyzeResult> {
  try {
    const res = await authFetch("/api/v1/analyzer/text", {
      method: "POST",
      body: JSON.stringify({ text, ...(memberId ? { memberId } : {}) }),
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      console.error("[API] Analyzer text error:", res.status, errorText);
      throw new Error(`Analysis failed: ${res.status} ${errorText || res.statusText}`);
    }
    
    return res.json();
  } catch (err: unknown) {
    console.error("[API] apiAnalyzeText error:", err);
    throw err;
  }
}

export async function apiAnalyzeUrl(url: string, memberId?: string): Promise<AnalyzeResult> {
  const res = await authFetch("/api/v1/analyzer/url", {
    method: "POST",
    body: JSON.stringify({ url, ...(memberId ? { memberId } : {}) }),
  });

  return res.json();
}

export async function apiAnalyzeImage(
  imageDataUrl: string,
  memberId?: string,
): Promise<AnalyzeResult> {
  const blobRes = await fetch(imageDataUrl);
  const blob = await blobRes.blob();
  const form = new FormData();
  form.append("image", blob, "photo.jpg");
  if (memberId) form.append("memberId", memberId);

  const res = await authFetch("/api/v1/analyzer/image", {
    method: "POST",
    body: form,
  });

  return res.json();
}

export async function apiAnalyzeBarcode(
  barcode: string,
  memberId?: string,
): Promise<AnalyzeResult> {
  try {
    const res = await authFetch("/api/v1/analyzer/barcode", {
      method: "POST",
      body: JSON.stringify({ barcode, ...(memberId ? { memberId } : {}) }),
    });
    return res.json();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    try {
      const parsed = JSON.parse(msg);
      if (parsed.detail) throw new Error(parsed.detail);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== msg) throw parseErr;
    }
    throw err;
  }
}

export async function apiSaveAnalyzedRecipe(result: AnalyzeResult): Promise<{ id: string }> {
  const res = await authFetch("/api/v1/analyzer/save", {
    method: "POST",
    body: JSON.stringify({ result }),
  });
  return res.json();
}

// ---------- Recipe Analyzer types ----------

/** Base nutrition shape used across the app (per serving). */
export interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  /** optional saturated fat grams if you surface it */
  saturatedFat?: number;
}

/** Parsed ingredient line with optional match metadata. */
export interface AnalyzedIngredient {
  qty?: number;
  unit?: string;
  item: string;
  /** true if matched to an internal DB entry */
  matched?: boolean;
}

/** Attributes inferred from the parsed text/ingredients. */
export interface InferredAttributes {
  allergens?: string[];
  diets?: string[];
  cuisines?: string[];
  /** Taste tags list used by TasteProfileCard */
  taste?: string[];
}

/** Per-serving nutrition used by the analyzer; extends the base Nutrition. */
export interface NutritionPerServing extends Nutrition {
  potassium?: number;
  iron?: number;
  calcium?: number;
  vitaminD?: number;
}

/** Allergen warning from backend personalization. */
export interface AllergenWarning {
  allergenName: string;
  severity: string | null;
  memberName: string;
  message: string;
}

/** Health warning from backend personalization. */
export interface HealthWarning {
  conditionName: string;
  nutrient: string;
  value: number;
  message: string;
}

/** End-to-end result returned by analyzeRecipe(...). */
export interface AnalyzeResult {
  title?: string;
  summary?: string;
  servings?: number;

  /** Structured ingredients (after parsing). */
  ingredients?: AnalyzedIngredient[];

  /** Simple list of instruction steps, if available. */
  steps?: string[];

  /** Inferred tags like allergens/diets/cuisines/taste. */
  inferred?: InferredAttributes;

  /** Per-serving nutrition; UI maps this to result.nutrition. */
  nutritionPerServing?: NutritionPerServing;

  /** Optional suggestions shown in SuggestionsCard. */
  suggestions?: string[];

  /** Optional freeform tags/categories. */
  tags?: string[];

  /** Personalized allergen warnings (from backend). */
  allergenWarnings?: AllergenWarning[];

  /** Personalized health warnings (from backend). */
  healthWarnings?: HealthWarning[];
}

// ---------- Supabase Connection ----------

// Add appwriteUserId to the payloads we send to the backend.
// Callers will pass the Appwrite account id (user.$id).
export async function syncProfile(
  profile: {
    displayName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
    phone?: string | null;
    country?: string | null;
  },
  appwriteUserId: string
) {
  return authFetch("/api/v1/sync/profile", {
    method: "POST",
    body: JSON.stringify({ appwriteUserId, profile }),
  });
}

export async function syncHealth(
  health: {
    dateOfBirth?: string | null;
    sex?: string | null;
    activityLevel?: string | null;
    goal?: string | null;
    diets?: string[] | null;
    allergens?: string[] | null;
    intolerances?: string[] | null;
    dislikedIngredients?: string[] | null;
    onboardingComplete?: boolean | null;
    height?: { value: number; unit: "cm" | "ft" } | string | null;
    weight?: { value: number; unit: "kg" | "lb" } | string | null;
    majorConditions?: string[] | null;
    major_conditions?: string[] | null;
    diet_codes?: string[] | null;
    diet_ids?: string[] | null;
    allergen_codes?: string[] | null;
    allergen_ids?: string[] | null;
    condition_codes?: string[] | null;
    condition_ids?: string[] | null;
  },
  appwriteUserId: string
) {
  return authFetch("/api/v1/sync/health", {
    method: "POST",
    body: JSON.stringify({ appwriteUserId, health }),
  });
}


// ---------- User Recipes ----------
// These call /api/v1/user-recipes* endpoints which proxy to Supabase.
export async function fetchMyRecipes(appwriteUserId: string, { limit = 50, offset = 0 } = {}) {
  const url = `/api/v1/user-recipes?limit=${limit}&offset=${offset}`;
  const res = await authFetch(url, {
    method: "GET",
    headers: { "x-appwrite-user-id": appwriteUserId }, // helps backend resolve id if no JWT
  });
  const payload = await res.json().catch(() => ({}));
  return {
    items: Array.isArray(payload?.items) ? payload.items.map(normalizeUserRecipe) : [],
    limit: payload?.limit ?? limit,
    offset: payload?.offset ?? offset,
  } as { items: UserRecipe[]; limit: number; offset: number };
}

export async function createRecipe(appwriteUserId: string, recipe: Partial<UserRecipe>) {
  const res = await authFetch(`/api/v1/user-recipes`, {
    method: "POST",
    headers: { "x-appwrite-user-id": appwriteUserId, },
    body: JSON.stringify({ recipe }),
  });
  const payload = await res.json();
  return normalizeUserRecipe(payload);
}

export async function apiGetUserRecipe(appwriteUserId: string, id: string) {
  const res = await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "GET",
    headers: { "x-appwrite-user-id": appwriteUserId },
  });
  const payload = await res.json();
  return normalizeUserRecipe(payload);
}

export async function fetchRecipe(appwriteUserId: string, id: string) {
  const res = await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "GET",
    headers: { "x-appwrite-user-id": appwriteUserId },
  });
  const payload = await res.json();
  return normalizeUserRecipe(payload);
}

export async function updateRecipe(appwriteUserId: string, id: string, patch: Partial<UserRecipe>) {
  const res = await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "PATCH",
    headers: { "x-appwrite-user-id": appwriteUserId, },
    body: JSON.stringify({ recipe: patch }),
  });
  const payload = await res.json();
  return normalizeUserRecipe(payload);
}

export async function deleteRecipe(appwriteUserId: string, id: string) {
  await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "DELETE",
    headers: { "x-appwrite-user-id": appwriteUserId },
  });
}

// ---------- Recently Viewed / History ----------

export async function apiLogHistoryView(recipeId: string) {
  // logs a 'viewed' event
  await authFetch(`/api/v1/me/history`, {
    method: "POST",
    // headers: { "content-type": "application/json" },
    body: JSON.stringify({ recipeId, event: "viewed" }),
  });
}

export async function apiGetRecentlyViewed(limit = 20) {
  const res = await authFetch(`/api/v1/me/recently-viewed?limit=${limit}`, {
    method: "GET",
  });
  // backend returns rows like { history: {...}, recipe: {...} }
  return res.json() as Promise<Array<{ history: JsonRecord; recipe: JsonRecord }>>;
}

export async function apiGetAllergens(): Promise<TaxonomyOption[]> {
  const res = await authFetch("/api/v1/taxonomy/allergens", { method: "GET" });
  return res.json();
}

export async function apiGetHealthConditions(): Promise<TaxonomyOption[]> {
  const res = await authFetch("/api/v1/taxonomy/health-conditions", { method: "GET" });
  return res.json();
}

export async function apiGetDietaryPreferences(): Promise<TaxonomyOption[]> {
  const res = await authFetch("/api/v1/taxonomy/dietary-preferences", { method: "GET" });
  return res.json();
}

export async function apiGetCuisines(): Promise<TaxonomyOption[]> {
  const res = await authFetch("/api/v1/taxonomy/cuisines", { method: "GET" });
  return res.json();
}

export type UserProfile = {
  id?: string;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  diets?: string[] | null;
  allergens?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type TaxonomyOption = {
  code: string;
  name: string;
  category?: string | null;
  gold_id?: string | null;
};

export type HealthProfile = {
  id?: string;
  b2cCustomerId?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  bmi?: number | null;
  activityLevel?: string | null;
  healthGoal?: string | null;
  targetWeightKg?: number | null;
  targetCalories?: number | null;
  targetProteinG?: number | null;
  targetCarbsG?: number | null;
  targetFatG?: number | null;
  targetFiberG?: number | null;
  targetSodiumMg?: number | null;
  targetSugarG?: number | null;
  intolerances?: string[] | null;
  dislikedIngredients?: string[] | null;
  onboardingComplete?: boolean | null;
  conditions?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
};

// --- PROFILE ---

export async function apiGetMyOverview() {
  const r = await authFetch("/api/v1/me/profile");
  if (!r.ok) throw new Error(`profile ${r.status}`);
  return r.json();
}

export async function apiGetMyHealth() {
  const r = await authFetch("/api/v1/me/health");
  if (!r.ok) throw new Error(`health ${r.status}`);
  return r.json();
}

export async function apiGetProfile() {
  return authFetch("/api/v1/me/profile", { method: "GET" });
}

export async function apiUpdateOverview(body: Partial<UserProfile>) {
  return authFetch("/api/v1/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiUpdateHealth(body: Partial<HealthProfile>) {
  return authFetch("/api/v1/me/health", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDeleteProfileRows() {
  return authFetch("/api/v1/me/profile", { method: "DELETE" });
}

export async function apiDeleteAccount() {
  return authFetch("/api/v1/me/account", { method: "DELETE" });
}

// ── Meal Logging (PRD-03) ───────────────────────────────────────────────────

import type {
  MealLogResponse,
  AddMealItemPayload,
  CookingLogPayload,
  MealLogTemplate,
  StreakInfo,
  DaySummary,
} from "./types";

export async function apiGetMealLog(date: string, memberId?: string): Promise<MealLogResponse> {
  const query = new URLSearchParams({ date });
  if (memberId) query.set("memberId", memberId);
  const r = await authFetch(`/api/v1/meal-log?${query.toString()}`);
  if (!r.ok) throw new Error(`meal-log ${r.status}`);
  return r.json();
}

export async function apiAddMealItem(data: AddMealItemPayload) {
  const r = await authFetch("/api/v1/meal-log/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`add-meal-item ${r.status}`);
  return r.json();
}

export async function apiUpdateMealItem(
  id: string,
  data: { servings?: number; mealType?: string; notes?: string },
  memberId?: string
) {
  const query = new URLSearchParams();
  if (memberId) query.set("memberId", memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/meal-log/items/${id}${qs}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`update-meal-item ${r.status}`);
  return r.json();
}

export async function apiDeleteMealItem(id: string, memberId?: string) {
  const query = new URLSearchParams();
  if (memberId) query.set("memberId", memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/meal-log/items/${id}${qs}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`delete-meal-item ${r.status}`);
  return r.json();
}

export async function apiLogWater(date: string, amountMl: number, memberId?: string) {
  const r = await authFetch("/api/v1/meal-log/water", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, amount_ml: amountMl, ...(memberId ? { memberId } : {}) }),
  });
  if (!r.ok) throw new Error(`log-water ${r.status}`);
  return r.json();
}

export async function apiCopyDay(sourceDate: string, targetDate: string, memberId?: string) {
  const r = await authFetch("/api/v1/meal-log/copy-day", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceDate, targetDate, ...(memberId ? { memberId } : {}) }),
  });
  if (!r.ok) throw new Error(`copy-day ${r.status}`);
  return r.json();
}

export async function apiGetMealHistory(
  startDate: string,
  endDate: string,
  memberId?: string
): Promise<{ days: DaySummary[]; averages: JsonRecord }> {
  const query = new URLSearchParams({ startDate, endDate });
  if (memberId) query.set("memberId", memberId);
  const r = await authFetch(`/api/v1/meal-log/history?${query.toString()}`);
  if (!r.ok) throw new Error(`meal-history ${r.status}`);
  return r.json();
}

export async function apiGetStreak(memberId?: string): Promise<StreakInfo> {
  const qs = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const r = await authFetch(`/api/v1/meal-log/streak${qs}`);
  if (!r.ok) throw new Error(`streak ${r.status}`);
  return r.json();
}

export async function apiLogFromCooking(data: CookingLogPayload) {
  const r = await authFetch("/api/v1/meal-log/from-cooking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`log-from-cooking ${r.status}`);
  return r.json();
}

export async function apiGetMealTemplates(memberId?: string): Promise<{ templates: MealLogTemplate[] }> {
  const qs = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const r = await authFetch(`/api/v1/meal-log/templates${qs}`);
  if (!r.ok) throw new Error(`meal-templates ${r.status}`);
  return r.json();
}

export async function apiCreateMealTemplate(data: { name: string; memberId?: string; mealType?: string; items: unknown[] }) {
  const r = await authFetch("/api/v1/meal-log/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`create-template ${r.status}`);
  return r.json();
}

// ── Meal Plans (PRD-04) ────────────────────────────────────────────────────

export async function apiGenerateMealPlan(params: MealPlanGenerateParams): Promise<MealPlanGenerateResponse> {
  const r = await authFetch("/api/v1/meal-plans/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`generate-meal-plan ${r.status}: ${text}`);
  }
  return r.json();
}

export async function apiGetMealPlans(status?: string): Promise<{ plans: MealPlan[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const r = await authFetch(`/api/v1/meal-plans${qs}`);
  if (!r.ok) throw new Error(`get-meal-plans ${r.status}`);
  return r.json();
}

export async function apiGetMealPlanDetail(id: string): Promise<MealPlanDetailResponse> {
  const r = await authFetch(`/api/v1/meal-plans/${id}`);
  if (!r.ok) throw new Error(`get-meal-plan ${r.status}`);
  return r.json();
}

export async function apiActivateMealPlan(id: string): Promise<{ plan: MealPlan }> {
  const r = await authFetch(`/api/v1/meal-plans/${id}/activate`, { method: "PUT" });
  if (!r.ok) throw new Error(`activate-plan ${r.status}`);
  return r.json();
}

export async function apiSwapMeal(planId: string, itemId: string, reason?: string): Promise<MealPlanSwapResponse> {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/swap-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, reason }),
  });
  if (!r.ok) throw new Error(`swap-meal ${r.status}`);
  return r.json();
}

export async function apiRegenerateMealPlan(id: string): Promise<MealPlanGenerateResponse> {
  const r = await authFetch(`/api/v1/meal-plans/${id}/regenerate`, { method: "POST" });
  if (!r.ok) throw new Error(`regenerate-plan ${r.status}`);
  return r.json();
}

export async function apiDeleteMealPlan(id: string): Promise<{ success: boolean }> {
  const r = await authFetch(`/api/v1/meal-plans/${id}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`delete-plan ${r.status}`);
  return r.json();
}

export async function apiLogMealFromPlan(planId: string, itemId: string) {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/log-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId }),
  });
  if (!r.ok) throw new Error(`log-meal-from-plan ${r.status}`);
  return r.json();
}

// ── Household ──────────────────────────────────────────────────────────────

export async function apiGenerateGroceryList(
  payload: GenerateGroceryListPayload = {}
): Promise<{ list: ShoppingList; items: ShoppingListItem[]; estimatedTotal: number }> {
  const r = await authFetch("/api/v1/grocery-lists/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`generate-grocery-list ${r.status}: ${text}`);
  }
  return r.json();
}

export async function apiGetGroceryLists(status?: string): Promise<{ lists: ShoppingList[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const r = await authFetch(`/api/v1/grocery-lists${qs}`);
  if (!r.ok) throw new Error(`get-grocery-lists ${r.status}`);
  return r.json();
}

export async function apiGetGroceryListDetail(id: string): Promise<GroceryListDetailResponse> {
  const r = await authFetch(`/api/v1/grocery-lists/${id}`);
  if (!r.ok) throw new Error(`get-grocery-list ${r.status}`);
  return r.json();
}

export async function apiUpdateGroceryItem(
  listId: string,
  itemId: string,
  payload: UpdateGroceryItemPayload
) {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`update-grocery-item ${r.status}`);
  return r.json();
}

export async function apiUpdateGroceryListStatus(
  listId: string,
  payload: UpdateGroceryListStatusPayload
): Promise<{ list: ShoppingList }> {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`update-grocery-list-status ${r.status}`);
  return r.json();
}

export async function apiAddGroceryItem(
  listId: string,
  payload: {
    itemName: string;
    quantity: number;
    unit?: string;
    category?: string;
    estimatedPrice?: number;
  }
) {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`add-grocery-item ${r.status}`);
  return r.json();
}

export async function apiDeleteGroceryItem(listId: string, itemId: string) {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items/${itemId}`, {
    method: "DELETE",
  });
  if (!r.ok) throw new Error(`delete-grocery-item ${r.status}`);
  return r.json();
}

export async function apiGetGrocerySubstitutions(
  listId: string,
  itemId: string
): Promise<{ substitutions: GrocerySubstitutionCandidate[] }> {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items/${itemId}/substitutions`);
  if (!r.ok) throw new Error(`get-grocery-substitutions ${r.status}`);
  return r.json();
}

export async function apiGetBudgetSnapshot(params?: {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
}): Promise<BudgetSnapshot> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.budgetType) query.set("budgetType", params.budgetType);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/budget${qs}`);
  if (!r.ok) throw new Error(`budget-snapshot ${r.status}`);
  return r.json();
}

export async function apiCreateBudget(payload: CreateBudgetPayload): Promise<{ budget: Budget }> {
  const r = await authFetch("/api/v1/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`create-budget ${r.status}`);
  return r.json();
}

export async function apiUpdateBudget(
  budgetId: string,
  payload: UpdateBudgetPayload
): Promise<{ budget: Budget }> {
  const r = await authFetch(`/api/v1/budget/${budgetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`update-budget ${r.status}`);
  return r.json();
}

export async function apiGetBudgetTrends(params?: {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
  points?: number;
}): Promise<BudgetTrendsResponse> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.budgetType) query.set("budgetType", params.budgetType);
  if (params?.points != null) query.set("points", String(params.points));
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/budget/trends${qs}`);
  if (!r.ok) throw new Error(`budget-trends ${r.status}`);
  return r.json();
}

export async function apiGetBudgetRecommendations(params?: {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
}): Promise<BudgetRecommendationsResponse> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.budgetType) query.set("budgetType", params.budgetType);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/budget/recommendations${qs}`);
  if (!r.ok) throw new Error(`budget-recommendations ${r.status}`);
  return r.json();
}

export async function apiGetNutritionDaily(params?: {
  date?: string;
  memberId?: string;
}): Promise<NutritionDashboardDailyResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/daily${qs}`);
  if (!r.ok) throw new Error(`nutrition-daily ${r.status}`);
  return r.json();
}

export async function apiGetNutritionWeekly(params?: {
  weekStart?: string;
  memberId?: string;
}): Promise<NutritionDashboardWeeklyResponse> {
  const query = new URLSearchParams();
  if (params?.weekStart) query.set("weekStart", params.weekStart);
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/weekly${qs}`);
  if (!r.ok) throw new Error(`nutrition-weekly ${r.status}`);
  return r.json();
}

export async function apiGetNutritionMemberSummary(params?: {
  date?: string;
}): Promise<NutritionMemberSummaryResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/member-summary${qs}`);
  if (!r.ok) throw new Error(`nutrition-member-summary ${r.status}`);
  return r.json();
}

export async function apiGetNutritionHealthMetrics(params?: {
  memberId?: string;
}): Promise<NutritionHealthMetricsResponse> {
  const query = new URLSearchParams();
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/health-metrics${qs}`);
  if (!r.ok) throw new Error(`nutrition-health-metrics ${r.status}`);
  return r.json();
}

export async function apiGetHouseholdMembers(): Promise<HouseholdMembersResponse> {
  const r = await authFetch("/api/v1/households/members");
  if (!r.ok) throw new Error(`household-members ${r.status}`);
  return r.json();
}

export async function apiAddFamilyMember(data: {
  fullName: string;
  firstName?: string;
  age?: number;
  gender?: string;
  householdRole?: string;
}): Promise<{ member: HouseholdMember }> {
  const r = await authFetch("/api/v1/households/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`add-member ${r.status}`);
  return r.json();
}

export async function apiGetMemberDetail(memberId: string): Promise<{ member: HouseholdMember }> {
  const r = await authFetch(`/api/v1/households/members/${memberId}`);
  if (!r.ok) throw new Error(`member-detail ${r.status}`);
  return r.json();
}

export async function apiUpdateMemberHealth(memberId: string, data: {
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  allergenIds?: string[];
  dietIds?: string[];
  conditionIds?: string[];
}): Promise<{ member: HouseholdMember }> {
  const r = await authFetch(`/api/v1/households/members/${memberId}/health`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`update-member-health ${r.status}`);
  return r.json();
}

// ── Recipe Ratings ─────────────────────────────────────────────────────────

export async function apiRateRecipe(recipeId: string, data: RateRecipePayload): Promise<RecipeRating> {
  const r = await authFetch(`/api/v1/recipes/${recipeId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error(`rate-recipe ${r.status}`);
  return r.json();
}

export async function apiGetMyRating(recipeId: string): Promise<RecipeRatingResponse> {
  const r = await authFetch(`/api/v1/recipes/${recipeId}/rating`);
  if (!r.ok) throw new Error(`get-rating ${r.status}`);
  return r.json();
}

