// lib/grocery-preferences-api.ts
// Grocery preferences API functions (certifications, brands, meal frequency)

import { authFetch } from "./api";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Certification {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  region: string | null;
}

export interface GroceryPreferences {
  certificationIds: string[];
  brands: { name: string; priority: number }[];
  mealsPerDay: number;
  daysPerWeek: number;
}

export interface UpdateGroceryPreferencesPayload {
  certificationIds?: string[];
  brands?: { name: string; priority: number }[];
  mealsPerDay?: number;
  daysPerWeek?: number;
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function apiFetchCertifications(): Promise<Certification[]> {
  const res = await authFetch("/api/v1/grocery-preferences/certifications");
  const data = await res.json();
  return data.certifications;
}

export async function apiFetchGroceryPreferences(): Promise<GroceryPreferences> {
  const res = await authFetch("/api/v1/grocery-preferences");
  const data = await res.json();
  return data.preferences;
}

export async function apiUpdateGroceryPreferences(
  payload: UpdateGroceryPreferencesPayload
): Promise<GroceryPreferences> {
  const res = await authFetch("/api/v1/grocery-preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return data.preferences;
}

export async function apiSearchBrands(query: string): Promise<string[]> {
  const res = await authFetch(
    `/api/v1/grocery-preferences/brands?q=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return data.brands;
}
