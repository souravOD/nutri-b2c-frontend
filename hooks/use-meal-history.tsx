"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGetMealHistory } from "@/lib/api";
import type { DaySummary } from "@/lib/types";

export function useMealHistory(startDate: string, endDate: string) {
  const { data, isLoading, error } = useQuery<{ days: DaySummary[]; averages: any }>({
    queryKey: ["meal-history", startDate, endDate],
    queryFn: () => apiGetMealHistory(startDate, endDate),
    staleTime: 60_000,
    enabled: !!startDate && !!endDate,
  });

  return {
    days: data?.days ?? [],
    averages: data?.averages ?? null,
    isLoading,
    error,
  };
}
