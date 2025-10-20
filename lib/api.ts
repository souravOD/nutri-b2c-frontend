// lib/api.ts
"use client";

import { account } from "./appwrite";
import type { Recipe } from "./types";

// If NEXT_PUBLIC_API_BASE_URL is set, use it (direct to backend).
// Otherwise call relative /api/v1/* so Next proxies handle it.
const RAW_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
// Ensure absolute URL w/ protocol; strip trailing slash
const API_BASE = RAW_BASE
  ? (/^https?:\/\//i.test(RAW_BASE) ? RAW_BASE : `https://${RAW_BASE}`).replace(/\/+$/, "")
  : "";
type FetchOpts = Omit<RequestInit, "headers"> & { headers?: HeadersInit };
let cachedJwt: { token: string; exp: number } | null = null;


const toInt = (v: any): number | null =>
  v === null || v === undefined || v === '' ? null : Number.parseInt(String(v), 10);

const toNum = (v: any): number | null =>
  v === null || v === undefined || v === '' ? null : Number.parseFloat(String(v));

type NormalizedRecipe = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  saturated_fat_g: number | null;
  sodium_mg: number | null;
  servings: number | null;
  difficulty: string | null;
  meal_type: string | null;
  cuisines: string[];
  diet_tags: string[];
  allergens: string[];
  flags: string[];
  ingredients: string[] | any[];
  instructions: string[] | any[];
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
  owner_user_id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  servings?: number | null;
  total_time_minutes?: number | null;
  prep_time_minutes?: number | null;
  cook_time_minutes?: number | null;
  calories?: number | null;
  protein_g?: number | null;
  carbs_g?: number | null;
  fat_g?: number | null;
  fiber_g?: number | null;
  sugar_g?: number | null;
  sodium_mg?: number | null;
  saturated_fat_g?: number | null;
  difficulty?: string | null;
  meal_type?: string | null;
  cuisines?: string[] | null;
  diet_tags?: string[] | null;
  allergens?: string[] | null;
  flags?: string[] | null;
  ingredients?: Ingredient[] | null;
  instructions?: Instruction[] | null;
  notes?: string | null;
  visibility?: "private" | "public" | "unlisted" | null;
  created_at?: string;
  updated_at?: string;
};



function makeIdemKey() {
  try { return crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
}

function uniqStr(arr: any[]): string[] {
  return Array.from(new Set((arr ?? []).filter(Boolean).map(String)));
}

function toRecipe(raw: any): Recipe {
  const r = raw?.recipe ?? raw;

  const imageUrl =
    r.image_url ?? r.imageUrl ?? null;

  const prep =
    r.prep_time_minutes ?? r.prepTimeMinutes ?? 0;

  const cook =
    r.cook_time_minutes ?? r.cookTimeMinutes ?? 0;

  const total =
    (r.time_minutes ?? r.total_time_minutes ?? r.totalTimeMinutes ?? (prep + cook)) ?? 0;

  const tags = uniqStr([
    ...(r.tags ?? []),
    ...(r.diet_tags ?? r.dietTags ?? []),
    ...(r.flags ?? r.flag_tags ?? []),
    ...(r.cuisines ?? []),
  ]);

  return {
    id: r.id,
    title: r.title ?? "Untitled",
    imageUrl,
    time_minutes: total,
    prepTime: prep || total,         // keep card’s total time non-zero
    cookTime: cook || 0,
    servings: r.servings ?? undefined,
    difficulty: String(r.difficulty ?? "easy").toLowerCase() as any,
    isSaved: Boolean(r.is_saved ?? r.isSaved ?? raw?.isSaved),
    tags,
  } as Recipe;
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
  if (opts.body && !headers.has("content-type")) headers.set("content-type", "application/json");
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
    if (!res.ok) throw new Error((await res.text().catch(() => "")) || `Request failed ${res.status}`);
    return res;
  } catch (err) {
    // Surface network/CORS issues in the console for easier debugging
    console.error("authFetch network error", { url, method, headers: [...headers.entries()] }, err);
    throw err;
  }
}

/* ---- Public ---- */
function normalizeRecipeFromApi(d: any): NormalizedRecipe {
  return {
    id: d.id,
    title: d.title ?? '',
    description: d.description ?? null,
    // API sends camelCase; UI expects snake_case names below
    image_url: d.imageUrl ?? null,
    source_url: d.sourceUrl ?? null,

    calories: toInt(d.calories),
    protein_g: toNum(d.proteinG),
    carbs_g: toNum(d.carbsG),
    fat_g: toNum(d.fatG),
    fiber_g: toNum(d.fiberG),
    saturated_fat_g: toNum(d.saturatedFatG),
    sodium_mg: toInt(d.sodiumMg),

    servings: toInt(d.servings),
    difficulty: d.difficulty ?? null,
    meal_type: d.mealType ?? null,

    cuisines: Array.isArray(d.cuisines) ? d.cuisines : [],
    diet_tags: Array.isArray(d.dietTags) ? d.dietTags : [],
    allergens: Array.isArray(d.allergens) ? d.allergens : [],
    flags: Array.isArray(d.flags) ? d.flags : [],

    ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
    instructions: Array.isArray(d.instructions) ? d.instructions : [],
    notes: d.notes ?? null,

    market_country: (d.marketCountry ?? d.market_country ?? null),

    status: d.status,

    // time fields (convert any casing your API may return)
    total_time_minutes: toInt(d.totalTimeMinutes ?? d.time_minutes ?? d.timeMinutes),
    prep_time_minutes: toInt(d.prepTimeMinutes ?? d.prep_time_minutes),
    cook_time_minutes: toInt(d.cookTimeMinutes ?? d.cook_time_minutes),

    created_at: d.createdAt ?? null,
    updated_at: d.updatedAt ?? null,
    published_at: d.publishedAt ?? null,
  };
}

export async function apiGetFeed(): Promise<Recipe[]> {
  const res = await authFetch(`/api/v1/feed`);
  const data = await res.json().catch(() => []);
  const arr = Array.isArray(data) ? data : [];
  return arr.map((it: any) => it?.recipe ?? it);
}


export async function apiSearchRecipes(args: { q?: string; filters: any; sort?: string }): Promise<Recipe[]> {
  const { q, filters, sort } = args;
  const p = new URLSearchParams();

  if (q && q.trim()) p.set("q", q.trim());

  // arrays
  if (filters?.dietaryRestrictions?.length) p.set("diets", filters.dietaryRestrictions.join(","));
  if (filters?.cuisines?.length) p.set("cuisines", filters.cuisines.join(","));
  if (filters?.allergens?.length) p.set("allergens_exclude", filters.allergens.join(","));
  if (filters?.majorConditions?.length) {p.set("major_conditions", filters.majorConditions.join(","));}

  // calories range: only send if stricter than [0, 1200]
  const [calMin = 0, calMax = 1200] = Array.isArray(filters?.calories) ? filters.calories : [0, 1200];
  if (Number.isFinite(calMin) && calMin > 0) p.set("cal_min", String(calMin));
  if (Number.isFinite(calMax) && calMax < 1200) p.set("cal_max", String(calMax));

  // mins: send only if > 0
  if (Number.isFinite(filters?.proteinMin) && filters.proteinMin > 0) p.set("protein_min", String(filters.proteinMin));
  if (Number.isFinite(filters?.fiberMin) && filters.fiberMin > 0) p.set("fiber_min", String(filters.fiberMin));

  // sat fat: if you want a default “no limit”, either omit or guard like the others
  if (Number.isFinite(filters?.satfatMax)) p.set("satfat_max", String(filters.satfatMax));

  // ✅ the three you asked about — send only if stricter than baseline
  if (Number.isFinite(filters?.sugarMax)  && filters.sugarMax  < 100)  p.set("sugar_max",  String(filters.sugarMax));
  if (Number.isFinite(filters?.sodiumMax) && filters.sodiumMax < 4000) p.set("sodium_max", String(filters.sodiumMax));
  if (Number.isFinite(filters?.maxTime)   && filters.maxTime   < 120)  p.set("time_max",   String(filters.maxTime));

  // enums
  if (filters?.difficulty) p.set("difficulty", String(filters.difficulty));
  if (filters?.mealType)   p.set("meal_type",  String(filters.mealType));

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
}

// ---------- Supabase Connection ----------

// Add appwriteUserId to the payloads we send to the backend.
// Callers will pass the Appwrite account id (user.$id).
export async function syncProfile(
  profile: {
    displayName?: string | null;
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
  return res.json() as Promise<{ items: UserRecipe[]; limit: number; offset: number }>;
}

export async function createRecipe(appwriteUserId: string, recipe: Partial<UserRecipe>) {
  const res = await authFetch(`/api/v1/user-recipes`, {
    method: "POST",
    headers: { "x-appwrite-user-id": appwriteUserId, },
    body: JSON.stringify({ recipe }),
  });
  return res.json() as Promise<UserRecipe>;
}

export async function apiGetUserRecipe(appwriteUserId: string, id: string) {
  const res = await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "GET",
    headers: { "x-appwrite-user-id": appwriteUserId },
  });
  return res.json(); // returns UserRecipe row
}

export async function fetchRecipe(appwriteUserId: string, id: string) {
  const res = await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "GET",
    headers: { "x-appwrite-user-id": appwriteUserId },
  });
  return res.json() as Promise<UserRecipe>;
}

export async function updateRecipe(appwriteUserId: string, id: string, patch: Partial<UserRecipe>) {
  const res = await authFetch(`/api/v1/user-recipes/${id}`, {
    method: "PATCH",
    headers: { "x-appwrite-user-id": appwriteUserId,},
    body: JSON.stringify({ recipe: patch }),
  });
  return res.json() as Promise<UserRecipe>;
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
  return res.json() as Promise<Array<{ history: any; recipe: any }>>;
}

export async function apiClearHistory(): Promise<void> {
  await authFetch(`/api/v1/me/history`, {
    method: "DELETE",
  });
}

export type UserProfile = {
  user_id: string;
  display_name: string | null;
  image_url: string | null;
  phone: string | null;
  country: string | null;
  email: string | null;
  name: string | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;
  profile_diets: string[] | null;
  profile_allergens: string[] | null;
  preferred_cuisines: string[] | null;
};

export type HealthProfile = {
  user_id: string;
  date_of_birth: string | null; // ISO
  sex: "male" | "female" | "other" | null;
  activity_level: string | null;
  goal: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  height_display: string | null;
  weight_display: string | null;
  majorConditions?: string[]; 
  onboarding_complete: boolean | null;
  diets: string[] | null;
  allergens: string[] | null;
  intolerances: string[] | null;
  disliked_ingredients: string[] | null;
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
