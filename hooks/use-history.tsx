"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import type { Recipe } from "@/lib/types"
import { apiGetRecentlyViewed, apiLogHistoryView } from "@/lib/api";
import { useUser } from "@/hooks/use-user";

interface HistoryItem {
  recipeId: string
  viewedAt: string
}

interface HistoryContextType {
  history: HistoryItem[]
  recentRecipes: Recipe[]
  addToHistory: (recipeId: string) => void
  clearHistory: () => void
  loadRecentRecipes: () => Promise<void>
}

type JsonRecord = Record<string, unknown>
type RecentlyViewedRow = { history?: JsonRecord; recipe?: JsonRecord } & JsonRecord

const isRecord = (value: unknown): value is JsonRecord => typeof value === "object" && value !== null
const asString = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined)
const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
const asNumber = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}
const firstString = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) return undefined
  return value.find((item): item is string => typeof item === "string")
}
const asDifficulty = (value: unknown): Recipe["difficulty"] =>
  value === "easy" || value === "medium" || value === "hard" ? value : "easy"

const HistoryContext = createContext<HistoryContextType | undefined>(undefined)

export function HistoryProvider({ children }: { children: ReactNode }) {
  const { isAuthed } = useUser()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("nutrition-app-history")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setHistory(Array.isArray(parsed) ? parsed : [])
      } catch (error) {
        console.error("Failed to parse history from localStorage:", error)
        setHistory([])
      }
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("nutrition-app-history", JSON.stringify(history))
  }, [history])

  const historyRef = useRef(history)
  historyRef.current = history

  const loadRecentRecipes = useCallback(async () => {
    if (!isAuthed) {
      setRecentRecipes([])
      return
    }
    try {
      const rows = await apiGetRecentlyViewed(20)

      // Dedupe by recipe id and keep the most recent view timestamp if present
      const pickTs = (row: RecentlyViewedRow): number => {
        const h = isRecord(row.history) ? row.history : {}
        const raw =
          h["viewed_at"] ?? h["viewedAt"] ?? h["created_at"] ?? h["createdAt"] ?? h["ts"] ?? h["timestamp"] ?? null
        const t = typeof raw === "string" ? new Date(raw).getTime() : 0
        return Number.isFinite(t) ? t : 0
      }

      const byId = new Map<string, { ts: number; r: JsonRecord }>()
      for (const rawRow of rows) {
        if (!isRecord(rawRow)) continue
        const row = rawRow as RecentlyViewedRow
        const recipeRecord = isRecord(row.recipe) ? row.recipe : row
        const id = asString(recipeRecord["id"])
        if (!id) continue
        const ts = pickTs(row)
        const prev = byId.get(id)
        if (!prev || ts > prev.ts) byId.set(id, { ts, r: recipeRecord })
      }

      const dedupedSorted = Array.from(byId.values())
        .sort((a, b) => b.ts - a.ts)
        .map(({ r }) => r)

      const mapped: Recipe[] = dedupedSorted.map((recipe) => {
        const cuisine = recipe["cuisine"]
        const cuisineName =
          typeof cuisine === "string"
            ? cuisine
            : isRecord(cuisine)
              ? asString(cuisine["name"]) ?? asString(cuisine["code"]) ?? null
              : null
        const cuisines = asStringArray(recipe["cuisines"]).length
          ? asStringArray(recipe["cuisines"])
          : cuisineName
            ? [cuisineName]
            : []

        return {
          id: asString(recipe["id"]) ?? "",
          title: asString(recipe["title"]) ?? "Untitled",
          imageUrl:
            asString(recipe["imageUrl"]) ??
            asString(recipe["image_url"]) ??
            firstString(recipe["images"]) ??
            undefined,
          prepTime: asNumber(recipe["prepTimeMinutes"] ?? recipe["prep_time_minutes"], 0),
          cookTime: asNumber(recipe["cookTimeMinutes"] ?? recipe["cook_time_minutes"], 0),
          servings: asNumber(recipe["servings"], 1),
          difficulty: asDifficulty(recipe["difficulty"]),
          tags: [
            ...asStringArray(recipe["tags"]),
            ...asStringArray(recipe["diet_tags"]),
            ...asStringArray(recipe["flags"]),
            ...cuisines,
          ],
        }
      })

      setRecentRecipes(mapped)
    } catch (e) {
      console.error("Failed to load recent recipes:", e)
      setRecentRecipes([])
    }
  }, [isAuthed])

  useEffect(() => {
    if (!isAuthed) {
      setRecentRecipes([])
      return
    }
    if (history.length > 0) {
      loadRecentRecipes()
    } else {
      setRecentRecipes([])
    }
  }, [history.length, isAuthed, loadRecentRecipes]) // include auth state so logout clears safely

const addToHistory = useCallback((entry: string | { id?: string }) => {
  const id = typeof entry === "string" ? entry : entry?.id;
  if (!id) return;

  // Optimistic local update
  const now = new Date().toISOString();
  setHistory(prev => {
    const filtered = prev.filter(i => i.recipeId !== id);
    return [{ recipeId: id, viewedAt: now }, ...filtered].slice(0, 50);
  });

  // Fire-and-forget server log only if authed
  if (isAuthed) {
    void apiLogHistoryView(id);
  }
}, [isAuthed]);

  const clearHistory = useCallback(() => {
    setHistory([])
    setRecentRecipes([])
  }, []) // Memoize clearHistory

  return (
    <HistoryContext.Provider
    value={{
      history,
      recentRecipes,
      addToHistory,         // <— only the original name
      clearHistory,
      loadRecentRecipes,
    }}
  >
    {children}
  </HistoryContext.Provider>
      )
}

export function useHistory() {
  const context = useContext(HistoryContext)
  if (context === undefined) {
    throw new Error("useHistory must be used within a HistoryProvider")
  }
  return context
}
