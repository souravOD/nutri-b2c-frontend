// lib/api/taxonomy.ts — Taxonomy lookups and recipe meta
"use client";

import { authFetch } from "./core";
import type { TaxonomyOption, RecipeMeta, DetectedAllergen } from "./types";

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

export async function fetchRecipeMeta(): Promise<RecipeMeta> {
  const res = await authFetch("/api/v1/recipe-meta", { method: "GET" });
  return res.json();
}

export async function detectAllergens(ingredientNames: string[]): Promise<DetectedAllergen[]> {
  const res = await authFetch("/api/v1/recipe-meta/detect-allergens", {
    method: "POST",
    body: JSON.stringify({ ingredient_names: ingredientNames }),
  });
  const data = await res.json();
  return data.detected_allergens ?? [];
}
