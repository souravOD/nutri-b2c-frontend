"use client";

import * as React from "react";
import RecipeCreateForm from "@/components/recipe-builder-simple/form";
import { createRecipe } from "@/lib/api";
import { useUser } from "@/hooks/use-user";

export default function CreateRecipePage() {
  const { user } = useUser();
  const uid = user?.$id;

  return (
    <div style={{ background: "#F7F8F6", minHeight: "100vh" }}>
      <RecipeCreateForm
        onSubmit={async (draft) => {
          if (!uid) {
            throw new Error("Not authenticated — please log in first");
          }
          await createRecipe(uid, draft);
        }}
      />
    </div>
  );
}
