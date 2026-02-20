// lib/types.ts
// Frontend-shared types. Keep fields optional for backend compatibility.

export type Difficulty = "easy" | "medium" | "hard";

export type SortOption = "time" | "relevance" | "popular";

/** Nutrition label values (per serving). */
export interface Nutrition {
  calories?: number;
  protein?: number;
  protein_g?: number;
  carbs?: number;
  carbs_g?: number;
  fat?: number;
  fat_g?: number;
  fiber?: number;
  fiber_g?: number;
  sugar?: number;
  sugar_g?: number;
  sodium?: number;
  sodium_mg?: number;
  saturatedFat?: number;
  saturated_fat_g?: number;
  transFat?: number;
  cholesterol?: number;
  addedSugars?: number;
  vitaminD?: number;
  vitaminA?: number;
  vitaminC?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  totalSugars?: number;
  allergens?: string[];
}

export type Cuisine = {
  id: string;
  code?: string | null;
  name?: string | null;
} | string;

/** Core recipe model (UI-friendly, backend-agnostic). */
export interface Recipe {
  id: string;

  // Names (varies by backend)
  name?: string;
  title?: string;

  description?: string;

  // Images
  images?: string[];
  imageUrl?: string;
  image_url?: string;

  // Timing
  time_minutes?: number;
  prepTime?: number;
  cookTime?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  total_time_minutes?: number;

  // Servings & difficulty
  servings?: number;
  difficulty?: Difficulty;

  // Tags / taxonomies
  cuisine?: Cuisine | null;
  cuisines?: string[];
  diet_tags?: string[];
  flag_tags?: string[];
  allergens?: string[];
  tags?: string[];

  // Nutrition (per serving, optional)
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  nutrition?: Nutrition;

  rating?: number;
  reviewCount?: number;
  imageAlt?: string;
  instructions?: string[];
  steps?: string[];
  ingredients?: any[];

  // Personalization & metadata
  isSaved?: boolean;
  reasons?: string[];
  score?: number;
  updated_at?: string;
  created_at?: string;
}

/** Minimal product model used by the scanner UI. */
export interface Product {
  id?: string;
  title: string;
  brand?: string;
  imageUrl?: string;
  tags?: string[];
  allergens?: string[];
  nutrition?: Nutrition;
}

/** Parsed ingredient line with optional match metadata. */
export interface AnalyzedIngredient {
  qty?: number;
  unit?: string;
  item: string;
  matched?: boolean; // true if matched to an internal DB entry
}

/** Attributes inferred from parsed text/ingredients. */
export interface InferredAttributes {
  allergens?: string[];
  diets?: string[];
  cuisines?: string[];
  taste?: string[]; // used by TasteProfileCard
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

  // Structured ingredients (after parsing)
  ingredients?: AnalyzedIngredient[];

  // Simple list of instruction steps
  steps?: string[];

  // Inferred tags like allergens/diets/cuisines/taste
  inferred?: InferredAttributes;

  // Per-serving nutrition; UI maps this to result.nutrition
  nutritionPerServing?: NutritionPerServing;

  // Optional suggestions shown in SuggestionsCard
  suggestions?: string[];

  // Optional freeform tags/categories
  tags?: string[];

  // Personalized warnings (from backend)
  allergenWarnings?: AllergenWarning[];
  healthWarnings?: HealthWarning[];
}

// ── Meal Logging (PRD-03) ───────────────────────────────────────────────────

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealLog {
  id: string;
  b2cCustomerId: string;
  householdId: string | null;
  logDate: string;
  totalCalories: number;
  totalProteinG: number | string;
  totalCarbsG: number | string;
  totalFatG: number | string;
  totalFiberG: number | string;
  totalSugarG: number | string;
  totalSodiumMg: number;
  waterMl: number;
  waterGoalMl: number;
  calorieGoal: number | null;
  goalMet: boolean;
  streakCount: number;
  notes?: string | null;
}

export interface MealLogItem {
  id: string;
  mealLogId: string;
  mealType: MealType;
  recipeId?: string | null;
  productId?: string | null;
  customName?: string | null;
  customBrand?: string | null;
  servings: number | string;
  servingSize?: string | null;
  servingSizeG?: number | string | null;
  calories: number;
  proteinG: number | string;
  carbsG: number | string;
  fatG: number | string;
  fiberG: number | string;
  sugarG: number | string;
  sodiumMg: number;
  saturatedFatG?: number | string | null;
  cookedViaApp: boolean;
  cookingStartedAt?: string | null;
  cookingFinishedAt?: string | null;
  loggedAt: string;
  source: string;
  notes?: string | null;
  imageUrl?: string | null;
  recipeName?: string;
  recipeImage?: string | null;
  productName?: string;
  productBrand?: string | null;
  productImage?: string | null;
}

export interface NutritionTargets {
  targetCalories: number | null;
  targetProteinG: number | string | null;
  targetCarbsG: number | string | null;
  targetFatG: number | string | null;
  targetFiberG: number | string | null;
  targetSodiumMg: number | null;
  targetSugarG: number | string | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDaysLogged: number;
  lastLoggedDate: string | null;
}

export interface DaySummary {
  date: string;
  total_calories: number;
  total_protein_g: number | string;
  total_carbs_g: number | string;
  total_fat_g: number | string;
  goal_met: boolean;
  item_count: number;
}

export interface MealLogResponse {
  log: MealLog | null;
  items: MealLogItem[];
  targets: NutritionTargets | null;
  streak: StreakInfo | null;
}

export interface MealLogTemplate {
  id: string;
  b2cCustomerId: string;
  templateName: string;
  mealType?: string | null;
  items: any[];
  useCount: number;
}

export interface AddMealItemPayload {
  date: string;
  mealType: MealType;
  recipeId?: string;
  productId?: string;
  customName?: string;
  customBrand?: string;
  servings: number;
  servingSize?: string;
  servingSizeG?: number;
  source?: string;
  notes?: string;
  imageUrl?: string;
  nutrition?: {
    calories?: number;
    proteinG?: number;
    carbsG?: number;
    fatG?: number;
    fiberG?: number;
    sugarG?: number;
    sodiumMg?: number;
    saturatedFatG?: number;
  };
}

export interface CookingLogPayload {
  recipeId: string;
  servings: number;
  mealType?: MealType;
  cookingStartedAt: string;
  cookingFinishedAt: string;
}

/** App-wide recommendation settings used across settings + ranking. */
export interface RecommendationSettings {
  units: "US" | "Metric";
  cuisines: string[];
  dislikes: string[];

  // global constraints / ranges
  timeRangeMinMax: [number, number];
  diets: string[];
  allergens: string[];

  calorieTarget: number;
  macroWeights: { protein: number; carbs: number; fat: number };
  caps: { sodiumMax: number; addedSugarMax: number };

  // UX behavior flags
  behavior: {
    showScoreBadge?: boolean;
    exploration?: number;
    shortTermFocus?: number;
    defaultSort?: SortOption;
  };

  // personalization knobs
  personalization?: {
    diversityBias?: number; // 0..1
    avoidRecentlyViewedHours?: number;
  };

  // advanced ranking + filters
  advanced?: {
    weights: {
      health: number;
      time: number;
      popularity: number;
      personal: number;
      diversity: number;
    };
    filters?: {
      calories?: [number, number];
      proteinMin?: number;
      carbsMin?: number;
      fatMin?: number;
      fiberMin?: number;
      sugarMax?: number;
      sodiumMax?: number;
      maxTime?: number;
    };
  };

  // optional notifications section (UI references it)
  notifications?: {
    enableReminders?: boolean;
  };
}

// ── Meal Plans (PRD-04) ─────────────────────────────────────────────────────

export type MealPlanStatus = "draft" | "active" | "completed" | "archived";
export type MealPlanItemStatus = "planned" | "cooked" | "skipped";

export interface MealPlan {
  id: string;
  householdId: string | null;
  planName: string | null;
  startDate: string;
  endDate: string;
  status: MealPlanStatus;
  totalEstimatedCost: number | string | null;
  totalCalories: number | null;
  mealsPerDay: string[] | null;
  memberIds: string[] | null;
  budgetAmount: number | string | null;
  budgetCurrency: string | null;
  aiModel: string | null;
  generationTimeMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanItemRecipe {
  id: string;
  title: string;
  imageUrl: string | null;
  mealType: string | null;
  difficulty: string | null;
  cookTimeMinutes: number | null;
  servings: number | null;
}

export interface MealPlanItem {
  id: string;
  mealPlanId: string;
  recipeId: string;
  mealDate: string;
  mealType: MealType;
  servings: number;
  forMemberIds: string[] | null;
  estimatedCost: number | string | null;
  caloriesPerServing: number | null;
  status: MealPlanItemStatus;
  rating: number | null;
  notes: string | null;
  originalRecipeId: string | null;
  swapReason: string | null;
  swapCount: number | null;
  nutritionSnapshot: NutritionSnapshot | null;
  recipe?: MealPlanItemRecipe | null;
}

export interface NutritionSnapshot {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
}

export interface MealPlanGenerateParams {
  startDate: string;
  endDate: string;
  memberIds: string[];
  budgetAmount?: number;
  budgetCurrency?: string;
  mealsPerDay: string[];
  preferences?: {
    maxCookTime?: number;
    cuisines?: string[];
    excludeRecipeIds?: string[];
  };
}

export interface MealPlanGenerateResponse {
  plan: MealPlan;
  items: MealPlanItem[];
  generationTimeMs: number;
  summary: string;
}

export interface MealPlanDetailResponse {
  plan: MealPlan;
  items: MealPlanItem[];
}

export interface MealPlanSwapResponse {
  item: MealPlanItem;
  reasoning: string;
}

// ── Household ───────────────────────────────────────────────────────────────

export interface Household {
  id: string;
  householdName: string | null;
  primaryAccountEmail: string;
  householdType: string | null;
  totalMembers: number | null;
}

export interface HouseholdMemberHealthProfile {
  targetCalories: number | null;
  targetProteinG: number | string | null;
  targetCarbsG: number | string | null;
  targetFatG: number | string | null;
  targetFiberG: number | string | null;
  targetSodiumMg: number | null;
  targetSugarG: number | string | null;
  allergens: { id: string; code: string; name: string; severity: string | null }[];
  diets: { id: string; code: string; name: string; strictness: string | null }[];
  conditions: { id: string; code: string; name: string; severity: string | null }[];
}

export interface HouseholdMember {
  id: string;
  fullName: string;
  firstName: string | null;
  age: number | null;
  gender: string | null;
  householdRole: string | null;
  isProfileOwner: boolean | null;
  healthProfile: HouseholdMemberHealthProfile | null;
}

export interface HouseholdMembersResponse {
  household: Household;
  members: HouseholdMember[];
}

// ── Recipe Ratings ──────────────────────────────────────────────────────────

export interface RecipeRating {
  id: string;
  recipeId: string;
  b2cCustomerId: string | null;
  rating: number;
  feedbackText: string | null;
  likedAspects: string[] | null;
  dislikedAspects: string[] | null;
  wouldMakeAgain: boolean | null;
  createdAt: string;
}

export interface RateRecipePayload {
  rating: number;
  feedbackText?: string;
  likedAspects?: string[];
  dislikedAspects?: string[];
  wouldMakeAgain?: boolean;
}

export interface RecipeRatingResponse {
  myRating: RecipeRating | null;
  averageRating: number | null;
  ratingCount: number;
}
