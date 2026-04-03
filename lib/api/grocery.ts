// lib/api/grocery.ts — Grocery list management (PRD-05)
"use client";

import type {
  ShoppingList,
  ShoppingListItem,
  GroceryListDetailResponse,
  GrocerySubstitutionCandidate,
  GenerateGroceryListPayload,
  UpdateGroceryItemPayload,
  UpdateGroceryListStatusPayload,
} from "../types";
import { authFetch } from "./core";

export async function apiGenerateGroceryList(
  payload: GenerateGroceryListPayload = {}
): Promise<{ list: ShoppingList; items: ShoppingListItem[]; estimatedTotal: number }> {
  const r = await authFetch("/api/v1/grocery-lists/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function apiGetGroceryLists(status?: string): Promise<{ lists: ShoppingList[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  const r = await authFetch(`/api/v1/grocery-lists${qs}`);
  return r.json();
}

export async function apiGetGroceryListDetail(id: string): Promise<GroceryListDetailResponse> {
  const r = await authFetch(`/api/v1/grocery-lists/${id}`);
  return r.json();
}

export async function apiUpdateGroceryItem(
  listId: string,
  itemId: string,
  payload: UpdateGroceryItemPayload
) {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function apiUpdateGroceryListStatus(
  listId: string,
  payload: UpdateGroceryListStatusPayload
): Promise<{ list: ShoppingList }> {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function apiAddGroceryItem(
  listId: string,
  payload: {
    itemName: string;
    quantity: number;
    unit?: string;
    category?: string;
    estimatedPrice?: number;
  }
) {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

export async function apiDeleteGroceryItem(listId: string, itemId: string) {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items/${itemId}`, {
    method: "DELETE",
  });
  return r.json();
}

export async function apiGetGrocerySubstitutions(
  listId: string,
  itemId: string
): Promise<{ substitutions: GrocerySubstitutionCandidate[] }> {
  const r = await authFetch(`/api/v1/grocery-lists/${listId}/items/${itemId}/substitutions`);
  return r.json();
}

// B2C-012: Export grocery list as CSV download
export async function apiExportGroceryList(listId: string): Promise<void> {
  if (typeof window === "undefined") return;

  const r = await authFetch(`/api/v1/grocery-lists/${listId}/export`);
  const blob = await r.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grocery-list.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
