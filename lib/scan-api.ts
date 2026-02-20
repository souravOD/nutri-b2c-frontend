// lib/scan-api.ts
// Scan-specific API functions for barcode lookup and history

import { authFetch } from "./api";

// ---------- Types ----------

export interface ScanLookupResult {
    product: {
        id: string;
        barcode: string | null;
        name: string;
        brand: string | null;
        imageUrl: string | null;
        allergens: string[];
        nutrition: {
            calories: number | null;
            protein_g: number | null;
            carbs_g: number | null;
            fat_g: number | null;
            fiber_g: number | null;
            sugar_g: number | null;
            sodium_mg: number | null;
            saturatedFat: number | null;
            transFat: number | null;
            cholesterol: number | null;
        };
        servingSize: string | null;
        ingredientText: string | null;
    } | null;
    allergenWarnings: {
        allergenName: string;
        severity: string | null;
        memberName: string;
        message: string;
    }[];
    healthWarnings: {
        conditionName: string;
        nutrient: string;
        value: number;
        message: string;
    }[];
    source: "cache" | "openfoodfacts" | "not_found";
}

export interface ScanHistoryItem {
    id: string;
    barcode: string;
    barcodeFormat: string | null;
    scanSource: string | null;
    scannedAt: string;
    product: {
        id: string;
        name: string;
        brand: string | null;
        imageUrl: string | null;
    } | null;
}

// ---------- API Functions ----------

export async function apiScanLookup(
    barcode: string,
    memberId?: string
): Promise<ScanLookupResult> {
    const res = await authFetch("/api/v1/scan/lookup", {
        method: "POST",
        body: JSON.stringify({ barcode, ...(memberId ? { memberId } : {}) }),
    });
    return res.json();
}

export async function apiSaveScanHistory(params: {
    barcode: string;
    productId?: string;
    barcodeFormat?: string;
    scanSource?: string;
}): Promise<{ id: string; success: boolean }> {
    const res = await authFetch("/api/v1/scan/history", {
        method: "POST",
        body: JSON.stringify(params),
    });
    return res.json();
}

export async function apiGetScanHistory(
    limit = 20,
    offset = 0
): Promise<{ items: ScanHistoryItem[]; total: number }> {
    const res = await authFetch(
        `/api/v1/scan/history?limit=${limit}&offset=${offset}`
    );
    return res.json();
}
