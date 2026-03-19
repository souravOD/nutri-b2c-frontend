// lib/api/types.ts — Local types defined in the old api.ts (re-exported alongside ./types)
"use client";

// Re-export everything from the canonical types file
export type { AnalyzeResult, AnalyzedIngredient, InferredAttributes, NutritionPerServing, AllergenWarning, HealthWarning } from "../types";
export type { MealLogResponse, AddMealItemPayload, CookingLogPayload, MealLogTemplate, StreakInfo, DaySummary, MealLogItem } from "../types";
export type { HouseholdInvitation, HouseholdInvitationDetail, HouseholdPreference } from "../types";

type JsonRecord = Record<string, unknown>;

export type SearchFilters = {
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

export type NormalizedRecipe = {
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

/** Base nutrition shape used across the app (per serving). */
export interface Nutrition {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
}

export interface IngredientSearchResult {
  id: string;
  name: string;
  category: string | null;
  calories: number | null;
  protein_g: number | null;
  total_carbs_g: number | null;
  total_fat_g: number | null;
  dietary_fiber_g: number | null;
  sodium_mg: number | null;
  total_sugars_g: number | null;
  saturated_fat_g: number | null;
  cholesterol_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  vitamin_a_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
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

export type RecipeMeta = {
  cuisines: Array<{ id: string; code: string; name: string; region?: string }>;
  mealTypes: string[];
  diets: Array<{ id: string; code: string; name: string; category?: string; isMedical?: boolean }>;
  allergens: Array<{ id: string; code: string; name: string; category?: string; isTop9?: boolean }>;
};

export type DetectedAllergen = {
  allergen_id: string;
  code: string;
  name: string;
  matched_ingredient: string;
};
