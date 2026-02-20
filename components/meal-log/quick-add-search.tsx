"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiSearchRecipes } from "@/lib/api";
import type { Recipe } from "@/lib/types";

interface QuickAddSearchProps {
  onSelect: (recipe: Recipe) => void;
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  const timer = useCallback(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  useState(() => timer());
  return debounced;
}

export function QuickAddSearch({ onSelect }: QuickAddSearchProps) {
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["recipe-search-quick", query],
    queryFn: () => apiSearchRecipes({ q: query, filters: {} }),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  const recipes: Recipe[] = Array.isArray(data) ? data.slice(0, 10) : [];

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes..."
          className="pl-9"
          autoFocus
        />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground py-2">Searching...</p>}

      {recipes.length > 0 && (
        <div className="max-h-64 overflow-y-auto divide-y">
          {recipes.map((r) => (
            <button
              key={r.id}
              className="w-full text-left py-2 px-1 hover:bg-accent/50 rounded-md transition-colors"
              onClick={() => onSelect(r)}
            >
              <p className="text-sm font-medium truncate">{r.title || r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.calories ? `${r.calories} cal` : ""}
                {r.servings ? ` · ${r.servings} servings` : ""}
              </p>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !isLoading && recipes.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">No recipes found</p>
      )}
    </div>
  );
}
