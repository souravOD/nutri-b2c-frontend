"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiAddMealItem,
  apiCopyDay,
  apiDeleteMealItem,
  apiGetMealLog,
  apiLogFromCooking,
  apiLogWater,
  apiUpdateMealItem,
} from "@/lib/api";
import type {
  AddMealItemPayload,
  CookingLogPayload,
  MealLogItem,
  MealLogResponse,
  MealType,
} from "@/lib/types";

export function useMealLog(date: string, memberId?: string) {
  const qc = useQueryClient();
  const queryKey = ["meal-log", date, memberId ?? ""];

  const { data, isLoading, error } = useQuery<MealLogResponse>({
    queryKey,
    queryFn: () => apiGetMealLog(date, memberId),
    staleTime: 30_000,
    enabled: !!date,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["meal-log"] });
    qc.invalidateQueries({ queryKey: ["meal-streak"] });
    qc.invalidateQueries({ queryKey: ["nutrition-daily"] });
    qc.invalidateQueries({ queryKey: ["nutrition-weekly"] });
    qc.invalidateQueries({ queryKey: ["nutrition-member-summary"] });
  };

  const addItem = useMutation({
    mutationFn: (payload: AddMealItemPayload) =>
      apiAddMealItem({
        ...payload,
        ...(payload.memberId ? {} : memberId ? { memberId } : {}),
      }),
    onSuccess: invalidate,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, ...rest }: { id: string; servings?: number; mealType?: string; notes?: string }) =>
      apiUpdateMealItem(id, rest, memberId),
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => apiDeleteMealItem(id, memberId),
    onSuccess: invalidate,
  });

  const logWater = useMutation({
    mutationFn: ({ date: d, amountMl }: { date: string; amountMl: number }) =>
      apiLogWater(d, amountMl, memberId),
    onSuccess: invalidate,
  });

  const copyDay = useMutation({
    mutationFn: ({ sourceDate, targetDate }: { sourceDate: string; targetDate: string }) =>
      apiCopyDay(sourceDate, targetDate, memberId),
    onSuccess: invalidate,
  });

  const logFromCooking = useMutation({
    mutationFn: (payload: CookingLogPayload) =>
      apiLogFromCooking({
        ...payload,
        ...(payload.memberId ? {} : memberId ? { memberId } : {}),
      }),
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

