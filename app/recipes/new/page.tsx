"use client";
import { useRouter } from "next/navigation";
import RecipeForm from "@/components/recipe-builder-simple/form";
import { createRecipe, type UserRecipe } from "@/lib/api";
import { useUser } from "@/hooks/use-user";

export default function NewRecipePage() {
  const { user } = useUser();
  const router = useRouter();
  const uid = user?.$id;

  async function onSubmit(data: Partial<UserRecipe>) {
    if (!uid) throw new Error("Not signed in");
    const created = await createRecipe(uid, data);
    router.push(`/recipes/${created.id}/edit`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Create Recipe</h1>
      <RecipeForm onSubmit={onSubmit} />
    </div>
  );
}
