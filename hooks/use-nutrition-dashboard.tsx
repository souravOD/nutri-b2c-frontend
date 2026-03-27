"use client";

import { useQuery } from "@tanstack/react-query";
import {
  apiGetNutritionDaily,
  apiGetNutritionHealthMetrics,
  apiGetNutritionMemberSummary,
  apiGetNutritionMonthly,
  apiGetNutritionRange,
  apiGetNutritionWeekly,
} from "@/lib/api";
import type {
  NutritionDashboardDailyResponse,
  NutritionDashboardRangeResponse,
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

export function useNutritionMonthly(params: { month?: string } & MemberScopedParams = {}) {
  const { data, isLoading, error, refetch } = useQuery<NutritionDashboardRangeResponse>({
    queryKey: ["nutrition-monthly", params.month ?? "", params.memberId ?? ""],
    queryFn: () => apiGetNutritionMonthly(params),
    staleTime: 30_000,
    enabled: !!params.month,
  });

  return {
    monthly: data ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useNutritionRange(params: { startDate?: string; endDate?: string } & MemberScopedParams = {}) {
  const { data, isLoading, error, refetch } = useQuery<NutritionDashboardRangeResponse>({
    queryKey: ["nutrition-range", params.startDate ?? "", params.endDate ?? "", params.memberId ?? ""],
    queryFn: () => apiGetNutritionRange(params),
    staleTime: 30_000,
    enabled: !!(params.startDate && params.endDate),
  });

  return {
    rangeData: data ?? null,
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

