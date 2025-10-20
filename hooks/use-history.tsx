"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"
import type { Recipe } from "@/lib/types"
import { apiGetRecentlyViewed, apiLogHistoryView, apiClearHistory } from "@/lib/api";
import { useUser } from "@/hooks/use-user";

interface HistoryItem {
  recipeId: string
  viewedAt: string
}

interface HistoryContextType {
  history: HistoryItem[]
  recentRecipes: Recipe[]
  addToHistory: (recipeId: string | { id?: string }) => void
  clearHistory: () => Promise<void>
  loadRecentRecipes: () => Promise<void>
}


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
      const rows = await apiGetRecentlyViewed(20);

      // Dedupe by recipe id and keep the most recent view timestamp if present
      type Row = { history?: any; recipe?: any };
      const pickTs = (row: Row): number => {
        const h: any = row?.history ?? {};
        const raw =
          h.viewed_at ?? h.viewedAt ?? h.created_at ?? h.createdAt ?? h.ts ?? h.timestamp ?? null;
        const t = raw ? new Date(raw).getTime() : 0;
        return Number.isFinite(t) ? t : 0;
      };

      const byId = new Map<string, { ts: number; r: any }>();
      for (const row of rows as Row[]) {
        const r = (row?.recipe ?? row) as any;
        const id = r?.id;
        if (!id) continue;
        const ts = pickTs(row);
        const prev = byId.get(id);
        if (!prev || ts > prev.ts) byId.set(id, { ts, r });
      }

      const dedupedSorted = Array.from(byId.values())
        .sort((a, b) => b.ts - a.ts)
        .map(({ r }) => r);

      const mapped = dedupedSorted.map((recipe: any) => ({
        id: recipe.id,
        title: recipe.title ?? "Untitled",
        imageUrl: recipe.image_url ?? (Array.isArray(recipe.images) ? recipe.images[0] : null),
        prepTime: Number(recipe.prep_time_minutes ?? 0),
        cookTime: Number(recipe.cook_time_minutes ?? 0),
        servings: Number(recipe.servings ?? 1),
        difficulty: (recipe.difficulty ?? "easy") as any,
        tags: [
          ...(Array.isArray(recipe.tags) ? recipe.tags : []),
          ...(Array.isArray(recipe.diet_tags) ? recipe.diet_tags : []),
          ...(Array.isArray(recipe.cuisines) ? recipe.cuisines : []),
          ...(Array.isArray(recipe.flags) ? recipe.flags : []),
        ],
      }));

      setRecentRecipes(mapped);
    } catch (e) {
      console.error("Failed to load recent recipes:", e);
      setRecentRecipes([]);
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!isAuthed) {
      setRecentRecipes([])
      return
    }
    if (history.length > 0) {
      void loadRecentRecipes()
    } else {
      setRecentRecipes([])
    }
  }, [history.length, isAuthed, loadRecentRecipes]) // include auth state so logout clears safely

  const addToHistory = useCallback((entry: string | { id?: string }) => {
    const id = typeof entry === "string" ? entry : entry?.id;
    if (!id) return;

    // Optimistic local update
    const now = new Date().toISOString();
    setHistory((prev) => {
      const filtered = prev.filter((i) => i.recipeId !== id);
      return [{ recipeId: id, viewedAt: now }, ...filtered].slice(0, 50);
    });

    // Fire-and-forget server log only if authed
    if (isAuthed) {
      void apiLogHistoryView(id);
    }
  }, [isAuthed]);

  const clearHistory = useCallback(async () => {
    const previous = historyRef.current;

    setHistory([])
    setRecentRecipes([])

    if (!isAuthed) return;
    try {
      await apiClearHistory();
    } catch (error) {
      console.error("Failed to clear history on server:", error);
      setHistory(previous);
      void loadRecentRecipes();
    }
  }, [isAuthed, loadRecentRecipes])

  return (
    <HistoryContext.Provider
      value={{
        history,
        recentRecipes,
        addToHistory,
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
