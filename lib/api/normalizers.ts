// lib/api/normalizers.ts — Recipe normalization helpers
"use client";

import type { Recipe } from "../types";
import type { NormalizedRecipe, UserRecipe } from "./types";

type JsonRecord = Record<string, unknown>;

export const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" ? (value as JsonRecord) : {};

export const toInt = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number.parseInt(String(v), 10);

export const toNum = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number.parseFloat(String(v));

function uniqStr(arr: unknown[]): string[] {
  return Array.from(new Set((arr ?? []).filter(Boolean).map(String)));
}

export function toRecipe(raw: unknown): Recipe {
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

export function normalizeRecipeFromApi(input: unknown): NormalizedRecipe {
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

export function normalizeUserRecipe(row: unknown): UserRecipe {
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
