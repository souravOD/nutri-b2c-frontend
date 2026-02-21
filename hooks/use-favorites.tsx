"use client"

import { createContext, useContext, useState, useCallback } from "react"
import type { Recipe } from "@/lib/types"
import { apiGetSaved, apiToggleSave } from "@/lib/api";
import { useUser } from "@/hooks/use-user";

interface FavoritesContextType {
  favorites: string[];
  savedRecipes: Recipe[];
  addFavorite: (recipeId: string) => void;
  removeFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => Promise<void>;
  loadSavedRecipes: () => Promise<void>;
}

type ToggleSaveResponse = {
  isSaved?: boolean
  saved?: boolean
  is_saved?: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthed } = useUser()
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  const isFavorite = useCallback((id: string) => favoritesSet.has(id), [favoritesSet]);

  const addFavorite = useCallback((id: string) => {
    setFavoritesSet(prev => new Set(prev).add(id));
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavoritesSet(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback(async (id: string) => {
    if (!isAuthed) {
      console.warn("toggleFavorite requires login");
      return;
    }
    // optimistic flip
    const was = isFavorite(id);
    if (was) removeFavorite(id); else addFavorite(id);

    try {
      const res = (await apiToggleSave(id)) as ToggleSaveResponse
      const serverSaved = (res?.isSaved ?? res?.saved ?? res?.is_saved);
      // reconcile with server if backend returns a definitive boolean
      if (serverSaved === true) addFavorite(id);
      else if (serverSaved === false) removeFavorite(id);
    } catch (e) {
      // revert on error
      if (was) addFavorite(id); else removeFavorite(id);
      console.error("toggleFavorite failed", e);
    }
  }, [addFavorite, removeFavorite, isFavorite, isAuthed]);

  const loadSavedRecipes = useCallback(async () => {
    if (!isAuthed) {
      setSavedRecipes([]);
      setFavoritesSet(new Set());
      return;
    }
    const list = await apiGetSaved();         // returns Recipe[]
    setSavedRecipes(list);
    setFavoritesSet(new Set(list.map(r => r.id)));
  }, [isAuthed]);

  return (
    <FavoritesContext.Provider
      value={{
        favorites: Array.from(favoritesSet),
        savedRecipes,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        loadSavedRecipes,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
