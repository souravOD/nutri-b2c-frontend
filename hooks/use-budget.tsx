"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiCreateBudget,
  apiGetBudgetRecommendations,
  apiGetBudgetSnapshot,
  apiGetBudgetTrends,
  apiUpdateBudget,
} from "@/lib/api";
import type {
  BudgetPeriod,
  BudgetRecommendationsResponse,
  BudgetSnapshot,
  BudgetTrendsResponse,
  BudgetType,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "@/lib/types";

interface BudgetParams {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
}

export function useBudgetSnapshot(params: BudgetParams = {}) {
  const period = params.period ?? "weekly";
  const budgetType = params.budgetType ?? "grocery";

  const { data, isLoading, error, refetch } = useQuery<BudgetSnapshot>({
    queryKey: ["budget-snapshot", period, budgetType],
    queryFn: () => apiGetBudgetSnapshot({ period, budgetType }),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  return {
    snapshot: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useBudgetTrends(params: BudgetParams & { points?: number } = {}) {
  const period = params.period ?? "weekly";
  const budgetType = params.budgetType ?? "grocery";
  const points = params.points ?? 12;

  const { data, isLoading, error, refetch } = useQuery<BudgetTrendsResponse>({
    queryKey: ["budget-trends", period, budgetType, points],
    queryFn: () => apiGetBudgetTrends({ period, budgetType, points }),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });

  return {
    trends: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useBudgetRecommendations(params: BudgetParams = {}) {
  const period = params.period ?? "weekly";
  const budgetType = params.budgetType ?? "grocery";

  const { data, isLoading, error, refetch } = useQuery<BudgetRecommendationsResponse>({
    queryKey: ["budget-recommendations", period, budgetType],
    queryFn: () => apiGetBudgetRecommendations({ period, budgetType }),
    staleTime: 20_000,
    refetchInterval: 60_000,
  });

  return {
    recommendations: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useCreateBudget() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBudgetPayload) => apiCreateBudget(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget-snapshot"] });
      qc.invalidateQueries({ queryKey: ["budget-trends"] });
      qc.invalidateQueries({ queryKey: ["budget-recommendations"] });
    },
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ budgetId, payload }: { budgetId: string; payload: UpdateBudgetPayload }) =>
      apiUpdateBudget(budgetId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget-snapshot"] });
      qc.invalidateQueries({ queryKey: ["budget-trends"] });
      qc.invalidateQueries({ queryKey: ["budget-recommendations"] });
    },
  });
}
