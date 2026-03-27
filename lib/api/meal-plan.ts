// lib/api/meal-plan.ts — Meal plan generation and management (PRD-04)
"use client";

import type {
  MealPlan,
  MealPlanItem,
  MealPlanGenerateParams,
  MealPlanGenerateResponse,
  MealPlanDetailResponse,
  MealPlanSwapResponse,
} from "../types";
import { authFetch } from "./core";

export async function apiGenerateMealPlan(params: MealPlanGenerateParams): Promise<MealPlanGenerateResponse> {
  const r = await authFetch("/api/v1/meal-plans/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return r.json();
}

export async function apiGetMealPlans(status?: string, memberId?: string): Promise<{ plans: MealPlan[] }> {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (memberId) params.set("memberId", memberId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const r = await authFetch(`/api/v1/meal-plans${qs}`);
  return r.json();
}

export async function apiGetMealPlanDetail(id: string): Promise<MealPlanDetailResponse> {
  const r = await authFetch(`/api/v1/meal-plans/${id}`);
  return r.json();
}

export async function apiActivateMealPlan(id: string): Promise<{ plan: MealPlan }> {
  const r = await authFetch(`/api/v1/meal-plans/${id}/activate`, { method: "PUT" });
  return r.json();
}

export async function apiSwapMeal(planId: string, itemId: string, reason?: string): Promise<MealPlanSwapResponse> {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/swap-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, reason }),
  });
  return r.json();
}

export async function apiRegenerateMealPlan(id: string): Promise<MealPlanGenerateResponse> {
  const r = await authFetch(`/api/v1/meal-plans/${id}/regenerate`, { method: "POST" });
  return r.json();
}

export async function apiDeleteMealPlan(id: string): Promise<{ success: boolean }> {
  const r = await authFetch(`/api/v1/meal-plans/${id}`, { method: "DELETE" });
  return r.json();
}

export async function apiLogMealFromPlan(planId: string, itemId: string) {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/log-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId }),
  });
  return r.json();
}

export async function apiAddMealPlanItem(
  planId: string,
  data: { recipeId: string; mealDate: string; mealType: string; servings?: number; replaceItemId?: string }
): Promise<{ item: MealPlanItem }> {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/add-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiReorderMealPlanItems(
  planId: string,
  moves: { itemId: string; mealDate: string; mealType: string }[]
): Promise<{ items: MealPlanItem[] }> {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/reorder`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ moves }),
  });
  return r.json();
}

export async function apiDeleteMealPlanItem(
  planId: string,
  itemId: string
): Promise<{ deleted: boolean; itemId: string }> {
  const r = await authFetch(`/api/v1/meal-plans/${planId}/items/${itemId}`, {
    method: "DELETE",
  });
  return r.json();
}
