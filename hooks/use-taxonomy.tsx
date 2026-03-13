"use client";

import { useQuery } from "@tanstack/react-query";
import {
  apiGetAllergens,
  apiGetHealthConditions,
  apiGetDietaryPreferences,
  apiGetCuisines,
} from "@/lib/api";

export function useTaxonomyAllergens() {
  return useQuery({
    queryKey: ["taxonomy", "allergens"],
    queryFn: () => apiGetAllergens(),
    staleTime: 5 * 60_000,
  });
}

export function useTaxonomyDiets() {
  return useQuery({
    queryKey: ["taxonomy", "dietary-preferences"],
    queryFn: () => apiGetDietaryPreferences(),
    staleTime: 5 * 60_000,
  });
}

export function useTaxonomyConditions() {
  return useQuery({
    queryKey: ["taxonomy", "health-conditions"],
    queryFn: () => apiGetHealthConditions(),
    staleTime: 5 * 60_000,
  });
}

export function useTaxonomyCuisines() {
  return useQuery({
    queryKey: ["taxonomy", "cuisines"],
    queryFn: () => apiGetCuisines(),
    staleTime: 5 * 60_000,
  });
}
