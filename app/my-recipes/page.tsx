"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { deleteRecipe, fetchMyRecipes, type UserRecipe } from "@/lib/api";
import { useUser } from "@/hooks/use-user";

import { RecipeCard,  type RecipeCardProps } from "@/components/recipe-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyRecipesPage() {
  const { user } = useUser();
  const uid = user?.$id;
  const [items, setItems] = useState<UserRecipe[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!uid) return;
    setLoading(true);
    try {
      const res = await fetchMyRecipes(uid);
      // API returns { items, limit, offset }
      setItems(res.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: string) {
    if (!uid) return;
    // optimistic UI
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await deleteRecipe(uid, id);
    } catch (e) {
      // revert on error
      await load();
      console.error("Delete failed", e);
    }
  }

  // Map backend user recipe -> RecipeCard props
  function toCard(r: UserRecipe): RecipeCardProps {
    const prep = r.prep_time_minutes ?? 0;
    const cook = r.cook_time_minutes ?? 0;
    const total =
      (r.total_time_minutes ?? (prep + cook)) ?? 0;

    return {
      id: r.id,
      title: r.title ?? "Untitled",
      imageUrl: r.image_url ?? undefined,
      prepTime: prep || total,
      servings: r.servings ?? 0,
      difficulty: (r.difficulty ?? "easy") as RecipeCardProps["difficulty"],
      isSaved: false, // "My Recipes" are owned; we don’t show saved state here
      onSave: () => {}, // no-op; heart isn’t shown/used here
      tags: [
        ...(r.cuisines ?? (r.cuisine ? [r.cuisine] : [])),
      ],
      // Optional: score
      score: undefined,
    };
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My Recipes</h1>

        <Button asChild>
          <Link href="/create" className="inline-flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            Create Recipe
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : items.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => {
            return (
              <Card key={r.id} className="overflow-hidden p-0">
                <RecipeCard
                    {...toCard(r)}
                    href={`/my-recipes/${r.id}`}        // <— EXACT LINE TO ADD
                />
                {/* Actions row */}
                <div className="flex items-center justify-end gap-2 p-3 pt-0">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/recipes/${r.id}/edit`} className="inline-flex items-center">
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(r.id)}
                    className={cn("inline-flex items-center")}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">You haven’t created any recipes yet.</p>
          <Button asChild>
            <Link href="/create" className="inline-flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              Create your first recipe
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
