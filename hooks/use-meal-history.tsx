"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGetMealHistory } from "@/lib/api";
import type { DaySummary } from "@/lib/types";

type MealHistoryAverages = Record<string, number | string | null | undefined>
type MealHistoryResult = {
  days: DaySummary[]
  averages: MealHistoryAverages | null
  isLoading: boolean
  error: unknown
}

export function useMealHistory(startDate: string, endDate: string, memberId?: string): MealHistoryResult {
  const { data, isLoading, error } = useQuery<{ days: DaySummary[]; averages: MealHistoryAverages }>({
    queryKey: ["meal-history", startDate, endDate, memberId ?? ""],
    queryFn: async () => {
      const response = await apiGetMealHistory(startDate, endDate, memberId)
      return {
        days: response.days,
        averages: response.averages as MealHistoryAverages,
      }
    },
    staleTime: 60_000,
    enabled: !!startDate && !!endDate,
  });
  const days: DaySummary[] = data?.days ?? []
  const averages: MealHistoryAverages | null = data?.averages ?? null

  return {
    days,
    averages,
    isLoading,
    error,
  };
}
