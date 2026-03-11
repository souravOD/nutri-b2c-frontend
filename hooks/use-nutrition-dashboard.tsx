"use client";

import { useQuery } from "@tanstack/react-query";
import {
  apiGetNutritionDaily,
  apiGetNutritionHealthMetrics,
  apiGetNutritionMemberSummary,
  apiGetNutritionWeekly,
} from "@/lib/api";
import type {
  NutritionDashboardDailyResponse,
  NutritionDashboardWeeklyResponse,
  NutritionHealthMetricsResponse,
  NutritionMemberSummaryResponse,
} from "@/lib/types";

interface MemberScopedParams {
  memberId?: string;
}

export function useNutritionDaily(params: { date?: string } & MemberScopedParams = {}) {
  const { data, isLoading, error, refetch } = useQuery<NutritionDashboardDailyResponse>({
    queryKey: ["nutrition-daily", params.date ?? "", params.memberId ?? ""],
    queryFn: () => apiGetNutritionDaily(params),
    staleTime: 20_000,
  });

  return {
    daily: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useNutritionWeekly(params: { weekStart?: string } & MemberScopedParams = {}) {
  const { data, isLoading, error, refetch } = useQuery<NutritionDashboardWeeklyResponse>({
    queryKey: ["nutrition-weekly", params.weekStart ?? "", params.memberId ?? ""],
    queryFn: () => apiGetNutritionWeekly(params),
    staleTime: 30_000,
  });

  return {
    weekly: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useNutritionMemberSummary(params: { date?: string } = {}) {
  const { data, isLoading, error, refetch } = useQuery<NutritionMemberSummaryResponse>({
    queryKey: ["nutrition-member-summary", params.date ?? ""],
    queryFn: () => apiGetNutritionMemberSummary(params),
    staleTime: 20_000,
  });

  return {
    summary: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useNutritionHealthMetrics(params: MemberScopedParams = {}) {
  const { data, isLoading, error, refetch } = useQuery<NutritionHealthMetricsResponse>({
    queryKey: ["nutrition-health-metrics", params.memberId ?? ""],
    queryFn: () => apiGetNutritionHealthMetrics(params),
    staleTime: 30_000,
  });

  return {
    healthMetrics: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

