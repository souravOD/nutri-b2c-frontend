// lib/api/budget.ts — Budget management
"use client";

import type {
  Budget,
  BudgetSnapshot,
  BudgetTrendsResponse,
  BudgetRecommendationsResponse,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetPeriod,
  BudgetType,
} from "../types";
import { authFetch } from "./core";

export async function apiGetBudgetSnapshot(params?: {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
}): Promise<BudgetSnapshot> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.budgetType) query.set("budgetType", params.budgetType);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/budget${qs}`);
  return r.json();
}

export async function apiCreateBudget(payload: CreateBudgetPayload): Promise<{ budget: Budget }> {
  const r = await authFetch("/api/v1/budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function apiUpdateBudget(
  budgetId: string,
  payload: UpdateBudgetPayload
): Promise<{ budget: Budget }> {
  const r = await authFetch(`/api/v1/budget/${budgetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function apiGetBudgetTrends(params?: {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
  points?: number;
}): Promise<BudgetTrendsResponse> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.budgetType) query.set("budgetType", params.budgetType);
  if (params?.points != null) query.set("points", String(params.points));
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/budget/trends${qs}`);
  return r.json();
}

export async function apiGetBudgetRecommendations(params?: {
  period?: BudgetPeriod;
  budgetType?: BudgetType;
}): Promise<BudgetRecommendationsResponse> {
  const query = new URLSearchParams();
  if (params?.period) query.set("period", params.period);
  if (params?.budgetType) query.set("budgetType", params.budgetType);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/budget/recommendations${qs}`);
  return r.json();
}
