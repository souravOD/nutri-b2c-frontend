"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiFetchCertifications,
  apiFetchGroceryPreferences,
  apiUpdateGroceryPreferences,
  apiSearchBrands,
  type Certification,
  type GroceryPreferences,
  type UpdateGroceryPreferencesPayload,
} from "@/lib/grocery-preferences-api";
import { useEffect, useState } from "react";

// ── Certifications (rarely change → long staleTime) ─────────────────────────

export function useCertifications() {
  const { data, isLoading, error } = useQuery<Certification[]>({
    queryKey: ["certifications"],
    queryFn: apiFetchCertifications,
    staleTime: Infinity, // certifications are seed data, rarely change
  });

  return {
    certifications: data ?? [],
    isLoading,
    error,
  };
}

// ── Current grocery preferences for household ───────────────────────────────

export function useGroceryPreferences() {
  const { data, isLoading, error, refetch } = useQuery<GroceryPreferences>({
    queryKey: ["grocery-preferences"],
    queryFn: apiFetchGroceryPreferences,
    staleTime: 30_000,
  });

  return {
    preferences: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

// ── Update grocery preferences mutation ─────────────────────────────────────

export function useUpdateGroceryPreferences() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateGroceryPreferencesPayload) =>
      apiUpdateGroceryPreferences(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grocery-preferences"] });
    },
  });
}

// ── Brand search with debounce ──────────────────────────────────────────────

export function useSearchBrands(query: string, debounceMs = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const { data, isLoading, error } = useQuery<string[]>({
    queryKey: ["brand-search", debouncedQuery],
    queryFn: () => apiSearchBrands(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60_000,
  });

  return {
    brands: data ?? [],
    isLoading,
    error,
  };
}
