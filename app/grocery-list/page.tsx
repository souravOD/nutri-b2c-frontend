import { Suspense } from "react";
import GroceryListClient from "./grocery-list-client";

export default function GroceryListPage() {
  return (
    <Suspense fallback={<main className="container mx-auto max-w-4xl px-4 py-4 text-sm text-muted-foreground">Loading grocery list...</main>}>
      <GroceryListClient />
    </Suspense>
  );
}
