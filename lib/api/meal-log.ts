// lib/api/meal-log.ts — Meal logging (PRD-03)
"use client";

import type {
  MealLogResponse,
  AddMealItemPayload,
  CookingLogPayload,
  MealLogTemplate,
  StreakInfo,
  DaySummary,
  MealLogItem,
} from "../types";
import { authFetch } from "./core";

type JsonRecord = Record<string, unknown>;

export async function apiGetMealLog(date: string, memberId?: string): Promise<MealLogResponse> {
  const query = new URLSearchParams({ date });
  if (memberId) query.set("memberId", memberId);
  const r = await authFetch(`/api/v1/meal-log?${query.toString()}`);
  return r.json();
}

export async function apiAddMealItem(data: AddMealItemPayload): Promise<MealLogItem> {
  const r = await authFetch("/api/v1/meal-log/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiUpdateMealItem(
  id: string,
  data: { servings?: number; mealType?: string; notes?: string },
  memberId?: string
) {
  const query = new URLSearchParams();
  if (memberId) query.set("memberId", memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/meal-log/items/${id}${qs}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiDeleteMealItem(id: string, memberId?: string) {
  const query = new URLSearchParams();
  if (memberId) query.set("memberId", memberId);
  const qs = query.toString() ? `?${query.toString()}` : "";
  const r = await authFetch(`/api/v1/meal-log/items/${id}${qs}`, { method: "DELETE" });
  return r.json();
}

export async function apiLogWater(date: string, amountMl: number, memberId?: string) {
  const r = await authFetch("/api/v1/meal-log/water", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, amount_ml: amountMl, ...(memberId ? { memberId } : {}) }),
  });
  return r.json();
}

export async function apiCopyDay(sourceDate: string, targetDate: string, memberId?: string) {
  const r = await authFetch("/api/v1/meal-log/copy-day", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceDate, targetDate, ...(memberId ? { memberId } : {}) }),
  });
  return r.json();
}

export async function apiGetMealHistory(
  startDate: string,
  endDate: string,
  memberId?: string
): Promise<{ days: DaySummary[]; averages: JsonRecord }> {
  const query = new URLSearchParams({ startDate, endDate });
  if (memberId) query.set("memberId", memberId);
  const r = await authFetch(`/api/v1/meal-log/history?${query.toString()}`);
  return r.json();
}

export async function apiGetStreak(memberId?: string): Promise<StreakInfo> {
  const qs = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const r = await authFetch(`/api/v1/meal-log/streak${qs}`);
  return r.json();
}

export async function apiLogFromCooking(data: CookingLogPayload) {
  const r = await authFetch("/api/v1/meal-log/from-cooking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiGetMealTemplates(memberId?: string): Promise<{ templates: MealLogTemplate[] }> {
  const qs = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
  const r = await authFetch(`/api/v1/meal-log/templates${qs}`);
  return r.json();
}

export async function apiCreateMealTemplate(data: { name: string; memberId?: string; mealType?: string; items: unknown[] }) {
  const r = await authFetch("/api/v1/meal-log/templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}
