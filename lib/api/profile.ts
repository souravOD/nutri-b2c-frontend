// lib/api/profile.ts — User profile, health, sync, and account management
"use client";

import { authFetch } from "./core";
import type { UserProfile, HealthProfile } from "./types";

export async function syncProfile(
  profile: {
    displayName?: string | null;
    email?: string | null;
    imageUrl?: string | null;
    phone?: string | null;
    country?: string | null;
  },
  appwriteUserId: string
) {
  return authFetch("/api/v1/sync/profile", {
    method: "POST",
    body: JSON.stringify({ appwriteUserId, profile }),
  });
}

export async function syncHealth(
  health: {
    dateOfBirth?: string | null;
    sex?: string | null;
    activityLevel?: string | null;
    goal?: string | null;
    diets?: string[] | null;
    allergens?: string[] | null;
    intolerances?: string[] | null;
    dislikedIngredients?: string[] | null;
    onboardingComplete?: boolean | null;
    height?: { value: number; unit: "cm" | "ft" } | string | null;
    weight?: { value: number; unit: "kg" | "lb" } | string | null;
    majorConditions?: string[] | null;
    major_conditions?: string[] | null;
    diet_codes?: string[] | null;
    diet_ids?: string[] | null;
    allergen_codes?: string[] | null;
    allergen_ids?: string[] | null;
    condition_codes?: string[] | null;
    condition_ids?: string[] | null;
  },
  appwriteUserId: string
) {
  return authFetch("/api/v1/sync/health", {
    method: "POST",
    body: JSON.stringify({ appwriteUserId, health }),
  });
}

export async function apiGetMyOverview() {
  const r = await authFetch("/api/v1/me/profile");
  return r.json();
}

export async function apiGetMyHealth() {
  const r = await authFetch("/api/v1/me/health");
  return r.json();
}

export async function apiGetProfile() {
  return authFetch("/api/v1/me/profile", { method: "GET" });
}

export async function apiUpdateOverview(body: Partial<UserProfile>) {
  return authFetch("/api/v1/me/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiUpdateHealth(body: Partial<HealthProfile>) {
  return authFetch("/api/v1/me/health", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDeleteProfileRows() {
  return authFetch("/api/v1/me/profile", { method: "DELETE" });
}

export async function apiDeleteAccount() {
  return authFetch("/api/v1/me/account", { method: "DELETE" });
}
