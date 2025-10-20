"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import RecipeCreateForm from "@/components/recipe-builder-simple/form";
import { createRecipe } from "@/lib/api";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

export default function CreateRecipePage() {
  const { user } = useUser();
  const uid = user?.$id; // Appwrite user id
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Create Recipe</h1>

      <RecipeCreateForm
        busy={saving}
        onSubmit={async (draft) => {
          if (!uid) {
            console.warn("createRecipe(): missing Appwrite user id");
            toast({
              title: "Sign in required",
              description: "Please log in before creating a recipe.",
              variant: "destructive",
            });
            return;
          }

          try {
            setSaving(true);
            await createRecipe(uid, draft);
            toast({
              title: "Recipe saved!",
              description: "You can find it in My Recipes.",
            });
            router.push("/my-recipes");
          } catch (error: any) {
            console.error("createRecipe failed", error);
            toast({
              title: "Could not save recipe",
              description: error?.message ?? "Please try again.",
              variant: "destructive",
            });
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
