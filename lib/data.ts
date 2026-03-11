// lib/data.ts
import type { Recipe } from "./types";

/** Vocab lists used by filters & settings — export as mutable string[] */
export const ALL_CUISINES: string[] = [
  "American",
  "Italian",
  "Mexican",
  "Indian",
  "Chinese",
  "Japanese",
  "Thai",
  "Mediterranean",
  "Middle Eastern",
  "French",
  "Spanish",
  "Greek",
  "Korean",
  "Vietnamese",
  "Caribbean",
  "African",
  "Latin American",
];

export const ALL_DIETS: string[] = [
  "VEGAN",
  "VEGETARIAN",
  "PESCATARIAN",
  "KETO",
  "PALEO",
  "CELIAC_GLUTEN_FREE",
  "DAIRY_FREE",
  "LOW_CARB",
  "LOW_FAT",
  "HIGH_PROTEIN",
  "FLEXITARIAN",
  "CARNIVORE",
  "MEDITERRANEAN",
  "WHOLE_30",
  "HALAL",
  "KOSHER",
  "HINDU",
  "JAIN",
  "LOW_FODMAP",
  "HEART_HEALTHY_DASH",
  "DIABETES_TYPE_2",
  "HYPERLIPIDEMIA",
  "RENAL",
  "NUT_FREE",
  "SOY_FREE",
  "EGG_FREE",
  "FISH_FREE",
  "SHELLFISH_FREE",
  "SESAME_FREE",
  "CORN_FREE",
  "LEGUME_FREE",
  "GLUTEN_SENSITIVITY",
  "ALPHA_GAL_SYNDROME",
  "ORAL_ALLERGY_SYNDROME",
  "PKU",
];

export const ALL_ALLERGENS: string[] = [
  "Milk_dairy",
  "Egg",
  "Fish_finned",
  "Shellfish_crustaceans",
  "Tree_nuts",
  "Peanut",
  "Wheat_gluten_cereals",
  "Soy",
  "Sesame_seed",
  "Celery",
  "Corn_maize",
  "Molluscs",
  "Buckwheat_pseudo-cereal",
  "Other_legumes",
  "Seeds_non-sesame",
  "Spices_and_herbs_rare",
  "Gelatin_bovine_porcine",
  "Insect_entomophagy_cross-reactive",
  "Oral_Allergy_Syndrome_OAS",
  "Alpha-gal_syndrome",
];

export const ALL_MAJOR_CONDITIONS: string[] = [
  "diabetes_type_1",
  "diabetes_type_2",
  "hypertension",
  "hyperlipidemia",
  "celiac_disease",
  "gluten_sensitivity",
  "lactose_intolerance",
  "ibs",
  "gerd",
  "kidney_disease",
  "liver_disease",
  "heart_disease",
  "gout",
  "food_allergy_other",
  "oral_allergy_syndrome",
];

/** Loose filter shape to keep callers happy until backend is wired */
export type SearchFilters = {
  q?: string;
  dietaryRestrictions?: string[];
  allergens?: string[];
  cuisines?: string[];
  calories?: [number, number];
  proteinMin?: number;
  carbsMin?: number;
  fatMin?: number;
  fiberMin?: number;
  sugarMax?: number;
  sodiumMax?: number;
  maxTime?: number;
};

/* ----------------------- Backend placeholder shims ----------------------- */
/* These keep the mock API routes compiling while you connect a real backend. */

/** Search placeholder – signature matches current mock route usage */
export async function searchRecipesData(
  q: string = "",
  filters?: Partial<SearchFilters>
): Promise<Recipe[]> {
  void q;
  void filters;
  return [];
}

/** Feed placeholder: full list (empty until backend is added) */
export async function listRecipes(): Promise<Recipe[]> {
  return [];
}

/** Find recipe by id placeholder */
export async function findRecipe(id: string): Promise<Recipe | null> {
  void id;
  return null;
}

/** Return saved ids for current user (empty until backend is added) */
export async function getSavedIds(): Promise<string[]> {
  return [];
}

/**
 * Toggle save placeholder.
 * Second argument optional so calls like toggleSave(id) still compile.
 */
export async function toggleSave(
  id: string,
  saved?: boolean
): Promise<{ ok: true }> {
  void id;
  void saved;
  return { ok: true };
}

export type { Recipe };
