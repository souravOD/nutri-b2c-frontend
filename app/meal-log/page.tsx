"use client";

import { DailyView } from "@/components/meal-log/daily-view";

export default function MealLogPage() {
  return (
    <main className="container max-w-2xl mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-4">Meal Log</h1>
      <DailyView />
    </main>
  );
}
