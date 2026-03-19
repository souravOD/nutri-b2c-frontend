// lib/api/recipes.ts — User-created recipe CRUD, ingredient search, image upload
"use client";

import { authFetch } from "./core";
import type { UserRecipe, IngredientSearchResult } from "./types";
import { normalizeUserRecipe } from "./normalizers";

export async function fetchMyRecipes(appwriteUserId: string, { limit = 50, offset = 0 } = {}) {
  const url = `/api/v1/user-recipes?limit=${limit}&offset=${offset}`;
  const res = await authFetch(url, {
    method: "GET",
    headers: { "x-appwrite-user-id": appwriteUserId },
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
    headers: { "x-appwrite-user-id": appwriteUserId },
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
    headers: { "x-appwrite-user-id": appwriteUserId },
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

export async function searchIngredients(q: string, limit = 10): Promise<IngredientSearchResult[]> {
  if (q.trim().length < 2) return [];
  const params = new URLSearchParams({ q: q.trim(), limit: String(limit) });
  const res = await authFetch(`/api/v1/ingredients/search?${params.toString()}`);
  const data = await res.json().catch(() => ({ items: [] }));
  return Array.isArray(data?.items) ? data.items : [];
}

export async function uploadRecipeImage(
  file: File,
  recipeId?: string,
): Promise<{ url: string; recipeId: string }> {
  const form = new FormData();
  form.append("file", file);
  if (recipeId) form.append("recipeId", recipeId);

  const res = await authFetch("/api/v1/uploads/recipe-image", {
    method: "POST",
    body: form,
  });
  return res.json();
}
