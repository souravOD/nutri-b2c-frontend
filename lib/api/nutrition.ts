// lib/api/nutrition.ts — Nutrition dashboard
"use client";

import type {
  NutritionDashboardDailyResponse,
  NutritionDashboardWeeklyResponse,
  NutritionDashboardRangeResponse,
  NutritionMemberSummaryResponse,
  NutritionHealthMetricsResponse,
} from "../types";
import { authFetch } from "./core";

export async function apiGetNutritionDaily(params?: {
  date?: string;
  memberId?: string;
}): Promise<NutritionDashboardDailyResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/daily${qs}`);
  return r.json();
}

export async function apiGetNutritionWeekly(params?: {
  weekStart?: string;
  memberId?: string;
}): Promise<NutritionDashboardWeeklyResponse> {
  const query = new URLSearchParams();
  if (params?.weekStart) query.set("weekStart", params.weekStart);
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/weekly${qs}`);
  return r.json();
}

export async function apiGetNutritionMonthly(params?: {
  month?: string;
  memberId?: string;
}): Promise<NutritionDashboardRangeResponse> {
  const query = new URLSearchParams();
  if (params?.month) query.set("month", params.month);
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/monthly${qs}`);
  return r.json();
}

export async function apiGetNutritionRange(params?: {
  startDate?: string;
  endDate?: string;
  memberId?: string;
}): Promise<NutritionDashboardRangeResponse> {
  const query = new URLSearchParams();
  if (params?.startDate) query.set("startDate", params.startDate);
  if (params?.endDate) query.set("endDate", params.endDate);
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/range${qs}`);
  return r.json();
}

export async function apiGetNutritionMemberSummary(params?: {
  date?: string;
}): Promise<NutritionMemberSummaryResponse> {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/member-summary${qs}`);
  return r.json();
}

export async function apiGetNutritionHealthMetrics(params?: {
  memberId?: string;
}): Promise<NutritionHealthMetricsResponse> {
  const query = new URLSearchParams();
  if (params?.memberId) query.set("memberId", params.memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/nutrition-dashboard/health-metrics${qs}`);
  return r.json();
}
