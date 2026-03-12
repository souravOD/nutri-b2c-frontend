"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGenerateMealPlan,
  apiGetMealPlans,
  apiGetMealPlanDetail,
  apiActivateMealPlan,
  apiSwapMeal,
  apiRegenerateMealPlan,
  apiDeleteMealPlan,
  apiLogMealFromPlan,
  apiAddMealPlanItem,
  apiReorderMealPlanItems,
  apiDeleteMealPlanItem,
} from "@/lib/api";
import type {
  MealPlan,
  MealPlanGenerateParams,
  MealPlanGenerateResponse,
  MealPlanDetailResponse,
} from "@/lib/types";

export function useMealPlans(status?: string, memberId?: string) {
  const { data, isLoading, error, refetch } = useQuery<{ plans: MealPlan[] }>({
    queryKey: ["meal-plans", status, memberId],
    queryFn: () => apiGetMealPlans(status, memberId),
    staleTime: 30_000,
  });

  return {
    plans: data?.plans ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useMealPlanDetail(id: string | null) {
  const { data, isLoading, error, refetch } = useQuery<MealPlanDetailResponse>({
    queryKey: ["meal-plan", id],
    queryFn: () => apiGetMealPlanDetail(id!),
    enabled: !!id,
    staleTime: 30_000,
  });

  return {
    plan: data?.plan ?? null,
    items: data?.items ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useGeneratePlan() {
  const qc = useQueryClient();

  return useMutation<MealPlanGenerateResponse, Error, MealPlanGenerateParams>({
    mutationFn: (params) => apiGenerateMealPlan(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
    },
  });
}

export function useActivatePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => apiActivateMealPlan(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
      qc.invalidateQueries({ queryKey: ["meal-plan"] });
    },
  });
}

export function useSwapMeal() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, itemId, reason }: { planId: string; itemId: string; reason?: string }) =>
      apiSwapMeal(planId, itemId, reason),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", variables.planId] });
    },
  });
}

export function useRegeneratePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => apiRegenerateMealPlan(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
      qc.invalidateQueries({ queryKey: ["meal-plan"] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => apiDeleteMealPlan(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal-plans"] });
    },
  });
}

export function useLogMealFromPlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, itemId }: { planId: string; itemId: string }) =>
      apiLogMealFromPlan(planId, itemId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", variables.planId] });
      qc.invalidateQueries({ queryKey: ["meal-log"] });
    },
  });
}

export function useAddMealPlanItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      recipeId,
      mealDate,
      mealType,
      servings,
      replaceItemId,
    }: {
      planId: string;
      recipeId: string;
      mealDate: string;
      mealType: string;
      servings?: number;
      replaceItemId?: string;
    }) => apiAddMealPlanItem(planId, { recipeId, mealDate, mealType, servings, replaceItemId }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", variables.planId] });
    },
  });
}

export function useReorderMealPlanItems() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      moves,
    }: {
      planId: string;
      moves: { itemId: string; mealDate: string; mealType: string }[];
    }) => apiReorderMealPlanItems(planId, moves),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", variables.planId] });
    },
  });
}

export function useDeleteMealPlanItem() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      planId,
      itemId,
    }: {
      planId: string;
      itemId: string;
    }) => apiDeleteMealPlanItem(planId, itemId),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["meal-plan", variables.planId] });
    },
  });
}
