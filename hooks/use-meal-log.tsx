"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetMealLog,
  apiAddMealItem,
  apiUpdateMealItem,
  apiDeleteMealItem,
  apiLogWater,
  apiCopyDay,
  apiLogFromCooking,
} from "@/lib/api";
import type {
  MealLogResponse,
  AddMealItemPayload,
  CookingLogPayload,
  MealLogItem,
  MealType,
} from "@/lib/types";

export function useMealLog(date: string) {
  const qc = useQueryClient();
  const queryKey = ["meal-log", date];

  const { data, isLoading, error } = useQuery<MealLogResponse>({
    queryKey,
    queryFn: () => apiGetMealLog(date),
    staleTime: 30_000,
    enabled: !!date,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["meal-log"] });
    qc.invalidateQueries({ queryKey: ["meal-streak"] });
  };

  const addItem = useMutation({
    mutationFn: (payload: AddMealItemPayload) => apiAddMealItem(payload),
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...rest }: { id: string; servings?: number; mealType?: string; notes?: string }) =>
      apiUpdateMealItem(id, rest),
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiDeleteMealItem(id),
    onSuccess: invalidate,
  });

  const logWater = useMutation({
    mutationFn: ({ date: d, amountMl }: { date: string; amountMl: number }) =>
      apiLogWater(d, amountMl),
    onSuccess: invalidate,
  });

  const copyDay = useMutation({
    mutationFn: ({ sourceDate, targetDate }: { sourceDate: string; targetDate: string }) =>
      apiCopyDay(sourceDate, targetDate),
    onSuccess: invalidate,
  });

  const logFromCooking = useMutation({
    mutationFn: (payload: CookingLogPayload) => apiLogFromCooking(payload),
    onSuccess: invalidate,
  });

  const itemsByMeal = (mealType: MealType): MealLogItem[] =>
    (data?.items ?? []).filter((i) => i.mealType === mealType);

  return {
    log: data?.log ?? null,
    items: data?.items ?? [],
    targets: data?.targets ?? null,
    streak: data?.streak ?? null,
    isLoading,
    error,
    itemsByMeal,
    addItem,
    updateItem,
    deleteItem,
    logWater,
    copyDay,
    logFromCooking,
  };
}
