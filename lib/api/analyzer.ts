// lib/api/analyzer.ts — Recipe analyzer (text, URL, image, barcode, save)
"use client";

import type { AnalyzeResult } from "../types";
import { authFetch } from "./core";

export async function apiAnalyzeText(text: string, memberId?: string): Promise<AnalyzeResult> {
  try {
    const res = await authFetch("/api/v1/analyzer/text", {
      method: "POST",
      body: JSON.stringify({ text, ...(memberId ? { memberId } : {}) }),
    });
    return res.json();
  } catch (err: unknown) {
    console.error("[API] apiAnalyzeText error:", err);
    throw err;
  }
}

export async function apiAnalyzeUrl(url: string, memberId?: string): Promise<AnalyzeResult> {
  const res = await authFetch("/api/v1/analyzer/url", {
    method: "POST",
    body: JSON.stringify({ url, ...(memberId ? { memberId } : {}) }),
  });
  return res.json();
}

export async function apiAnalyzeImage(
  imageDataUrl: string,
  memberId?: string,
): Promise<AnalyzeResult> {
  const blobRes = await fetch(imageDataUrl);
  const blob = await blobRes.blob();
  const form = new FormData();
  form.append("image", blob, "photo.jpg");
  if (memberId) form.append("memberId", memberId);

  const res = await authFetch("/api/v1/analyzer/image", {
    method: "POST",
    body: form,
  });
  return res.json();
}

export async function apiAnalyzeBarcode(
  barcode: string,
  memberId?: string,
): Promise<AnalyzeResult> {
  const res = await authFetch("/api/v1/analyzer/barcode", {
    method: "POST",
    body: JSON.stringify({ barcode, ...(memberId ? { memberId } : {}) }),
  });
  return res.json();
}

export async function apiSaveAnalyzedRecipe(result: AnalyzeResult): Promise<{ id: string }> {
  const res = await authFetch("/api/v1/analyzer/save", {
    method: "POST",
    body: JSON.stringify({ result }),
  });
  return res.json();
}
