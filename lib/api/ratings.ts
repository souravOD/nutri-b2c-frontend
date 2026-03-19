// lib/api/ratings.ts — Recipe ratings
"use client";

import type { RecipeRatingResponse, RateRecipePayload, RecipeRating } from "../types";
import { authFetch } from "./core";

export async function apiRateRecipe(recipeId: string, data: RateRecipePayload): Promise<RecipeRating> {
  const r = await authFetch(`/api/v1/recipes/${recipeId}/rate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiGetMyRating(recipeId: string): Promise<RecipeRatingResponse> {
  const r = await authFetch(`/api/v1/recipes/${recipeId}/rating`);
  return r.json();
}
