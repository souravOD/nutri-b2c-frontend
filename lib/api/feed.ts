// lib/api/feed.ts — Feed, search, recipe detail, save/reject
"use client";

import type { Recipe } from "../types";
import { authFetch } from "./core";
import type { SearchFilters } from "./types";
import { toRecipe, normalizeRecipeFromApi } from "./normalizers";

export type FeedSource = "rag" | "personalized_sql" | "relaxed_sql" | "trending";

export interface FeedApiResult {
  recipes: Recipe[];
  source: FeedSource;
}

export async function apiGetFeed(memberId?: string): Promise<FeedApiResult> {
  const params = new URLSearchParams();
  if (memberId) params.set("memberId", memberId);
  const qs = params.toString();
  const res = await authFetch(`/api/v1/feed${qs ? `?${qs}` : ""}`);
  const data = await res.json().catch(() => []);

  // Support both old (array) and new ({ recipes, source }) response shapes
  if (Array.isArray(data)) {
    return { recipes: data.map((it: unknown) => toRecipe(it)), source: "personalized_sql" };
  }
  const arr = Array.isArray(data?.recipes) ? data.recipes : [];
  return {
    recipes: arr.map((it: unknown) => toRecipe(it)),
    source: data?.source ?? "personalized_sql",
  };
}

export async function apiSearchRecipes(args: { q?: string; filters: SearchFilters; sort?: string; memberId?: string }): Promise<Recipe[]> {
  const { q, filters, sort, memberId } = args;
  const p = new URLSearchParams();

  if (q && q.trim()) p.set("q", q.trim());
  if (memberId) p.set("memberId", memberId);

  // arrays
  if (filters?.dietaryRestrictions?.length) p.set("diets", filters.dietaryRestrictions.join(","));
  if (filters?.cuisines?.length) p.set("cuisines", filters.cuisines.join(","));
  if (filters?.allergens?.length) p.set("allergens_exclude", filters.allergens.join(","));
  if (filters?.majorConditions?.length) { p.set("major_conditions", filters.majorConditions.join(",")); }

  // calories range
  const [calMin = 0, calMax = 1200] = Array.isArray(filters?.calories) ? filters.calories : [0, 1200];
  if (Number.isFinite(calMin) && calMin > 0) p.set("cal_min", String(calMin));
  if (Number.isFinite(calMax) && calMax < 1200) p.set("cal_max", String(calMax));

  if (typeof filters?.proteinMin === "number" && Number.isFinite(filters.proteinMin) && filters.proteinMin > 0) {
    p.set("protein_min", String(filters.proteinMin));
  }
  if (typeof filters?.fiberMin === "number" && Number.isFinite(filters.fiberMin) && filters.fiberMin > 0) {
    p.set("fiber_min", String(filters.fiberMin));
  }
  if (typeof filters?.satfatMax === "number" && Number.isFinite(filters.satfatMax)) {
    p.set("satfat_max", String(filters.satfatMax));
  }
  if (typeof filters?.sugarMax === "number" && Number.isFinite(filters.sugarMax) && filters.sugarMax < 100) {
    p.set("sugar_max", String(filters.sugarMax));
  }
  if (typeof filters?.sodiumMax === "number" && Number.isFinite(filters.sodiumMax) && filters.sodiumMax < 4000) {
    p.set("sodium_max", String(filters.sodiumMax));
  }
  if (typeof filters?.maxTime === "number" && Number.isFinite(filters.maxTime) && filters.maxTime < 120) {
    p.set("time_max", String(filters.maxTime));
  }

  if (filters?.difficulty) p.set("difficulty", String(filters.difficulty));
  if (filters?.mealType) p.set("meal_type", String(filters.mealType));
  if (sort) p.set("sort", sort);

  const res = await authFetch(`/api/v1/recipes?${p.toString()}`);
  const data = await res.json().catch(() => []);
  return (Array.isArray(data) ? data : []).map(toRecipe);
}

export async function apiGetRecipe(id: string) {
  const res = await authFetch(`/api/v1/recipes/${id}`);
  const json = await res.json();
  return normalizeRecipeFromApi(json);
}

export async function apiToggleSave(id: string): Promise<{ isSaved: boolean }> {
  return (await authFetch(`/api/v1/recipes/${id}/save`, { method: "POST" })).json();
}

export async function apiRejectRecipe(id: string): Promise<{ rejected: boolean }> {
  return (await authFetch(`/api/v1/recipes/${id}/reject`, { method: "POST" })).json();
}

export async function apiGetPopularRecipes(limit = 10): Promise<Recipe[]> {
  try {
    const res = await authFetch(`/api/v1/recipes/popular?limit=${limit}`);
    return res.json().catch(() => []);
  } catch {
    return [];
  }
}

export async function apiGetSaved(): Promise<Recipe[]> {
  const res = await authFetch(`/api/v1/me/saved`);
  const payload = await res.json().catch(() => null);

  const list =
    Array.isArray(payload) ? payload :
      Array.isArray(payload?.recipes) ? payload.recipes :
        Array.isArray(payload?.items) ? payload.items :
          Array.isArray(payload?.data) ? payload.data :
            (payload && typeof payload === "object") ? Object.values(payload) :
              [];

  return list.map(toRecipe);
}
