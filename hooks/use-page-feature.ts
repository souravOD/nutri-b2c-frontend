"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

/**
 * hooks/use-page-feature.ts — Dynamic route-to-feature mapping
 *
 * Maps the current URL pathname to a feature code and display label
 * for the global feedback form's "SELECT FEATURE" dropdown.
 *
 * Routes are ordered by specificity (most specific first) so
 * `/meal-plan/weekly` matches before `/meal-plan`.
 */

export interface PageFeature {
  code: string;
  label: string;
}

/** Ordered by specificity — most specific routes first */
const ROUTE_MAP: Array<{ pattern: string; exact?: boolean; feature: PageFeature }> = [
  // Meal Plan sub-routes (before /meal-plan)
  { pattern: "/meal-plan/weekly", feature: { code: "meal_plan_weekly", label: "Weekly Meal Plan" } },
  { pattern: "/meal-plan/monthly", feature: { code: "meal_plan_monthly", label: "Monthly Meal Plan" } },
  { pattern: "/meal-plan/generate", feature: { code: "meal_plan_generate", label: "AI Meal Planner" } },
  { pattern: "/meal-plan/ai-planner", feature: { code: "meal_plan_ai", label: "AI Plan Generator" } },
  { pattern: "/meal-plan", feature: { code: "meal_plan", label: "Meal Planning Hub" } },

  // Profile sub-routes (before /profile)
  { pattern: "/profile/edit-health", feature: { code: "health_profile", label: "Health Profile" } },
  { pattern: "/profile/edit", feature: { code: "profile_edit", label: "Edit Profile" } },
  { pattern: "/profile/family", feature: { code: "family_hub", label: "Family Hub" } },
  { pattern: "/profile", exact: true, feature: { code: "profile", label: "Profile" } },

  // Grocery sub-routes (before /grocery-list)
  { pattern: "/grocery-list/preferences", feature: { code: "grocery_preferences", label: "Grocery Preferences" } },
  { pattern: "/grocery-list", feature: { code: "grocery_list", label: "Grocery List" } },

  // Budget sub-routes
  { pattern: "/budget/setup", feature: { code: "budget_setup", label: "Budget Setup" } },
  { pattern: "/budget", feature: { code: "budget", label: "Budget Dashboard" } },

  // Recipe routes
  { pattern: "/recipes/new", feature: { code: "recipe_create", label: "Create Recipe" } },
  { pattern: "/recipes/", feature: { code: "recipe_detail", label: "Recipe Detail" } },
  { pattern: "/recipe-analyzer", feature: { code: "recipe_analyzer", label: "Recipe Analyzer" } },
  { pattern: "/my-recipes", feature: { code: "my_recipes", label: "My Recipes" } },
  { pattern: "/create", exact: true, feature: { code: "recipe_create", label: "Recipe Builder" } },

  // Top-level routes (exact matches)
  { pattern: "/", exact: true, feature: { code: "feed", label: "Home Feed" } },
  { pattern: "/nutrition", exact: true, feature: { code: "nutrition", label: "Nutrition Dashboard" } },
  { pattern: "/meal-log", exact: true, feature: { code: "meal_log", label: "Daily Meal Log" } },
  { pattern: "/search", exact: true, feature: { code: "search", label: "Recipe Search" } },
  { pattern: "/favorites", exact: true, feature: { code: "favorites", label: "Favorites" } },
  { pattern: "/saved", exact: true, feature: { code: "saved_recipes", label: "Saved Recipes" } },
  { pattern: "/scan", feature: { code: "barcode_scanner", label: "Barcode Scanner" } },
  { pattern: "/settings", exact: true, feature: { code: "settings", label: "Settings" } },
  { pattern: "/notifications", exact: true, feature: { code: "notifications", label: "Notifications" } },
  { pattern: "/history", exact: true, feature: { code: "history", label: "History" } },

  // Onboarding (prefix match)
  { pattern: "/onboarding", feature: { code: "onboarding", label: "Onboarding" } },
];

const FALLBACK: PageFeature = { code: "general", label: "General App" };

/**
 * All available features for the dropdown (deduplicated by code).
 * Used to let users manually override the auto-detected feature.
 */
export const ALL_FEATURES: PageFeature[] = (() => {
  const seen = new Set<string>();
  const result: PageFeature[] = [];
  for (const { feature } of ROUTE_MAP) {
    if (!seen.has(feature.code)) {
      seen.add(feature.code);
      result.push(feature);
    }
  }
  result.push(FALLBACK);
  // Sort alphabetically by label for the dropdown
  result.sort((a, b) => a.label.localeCompare(b.label));
  return result;
})();

/**
 * Hook: returns the auto-detected feature for the current page.
 *
 * @example
 *   const { code, label } = usePageFeature();
 *   // On /meal-plan/weekly → { code: "meal_plan_weekly", label: "Weekly Meal Plan" }
 */
export function usePageFeature(): PageFeature {
  const pathname = usePathname();

  return useMemo(() => {
    if (!pathname) return FALLBACK;

    for (const { pattern, exact, feature } of ROUTE_MAP) {
      if (exact) {
        if (pathname === pattern) return feature;
      } else {
        if (pathname.startsWith(pattern)) return feature;
      }
    }

    return FALLBACK;
  }, [pathname]);
}
