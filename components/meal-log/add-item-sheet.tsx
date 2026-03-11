"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuickAddSearch } from "./quick-add-search";
import { ManualEntryForm } from "./manual-entry-form";
import type { MealType, AddMealItemPayload, Recipe } from "@/lib/types";

interface AddItemSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealType: MealType;
  date: string;
  memberId?: string;
  onAdd: (payload: AddMealItemPayload) => void;
}

const LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function AddItemSheet({ open, onOpenChange, mealType, date, memberId, onAdd }: AddItemSheetProps) {
  const [tab, setTab] = useState("search");

  const handleRecipeSelect = (recipe: Recipe) => {
    onAdd({
      date,
      ...(memberId ? { memberId } : {}),
      mealType,
      recipeId: recipe.id,
      servings: 1,
      source: "recipe",
    });
    onOpenChange(false);
  };

  const handleManualEntry = (data: {
    customName: string;
    customBrand?: string;
    servings: number;
    nutrition: AddMealItemPayload["nutrition"];
  }) => {
    onAdd({
      date,
      ...(memberId ? { memberId } : {}),
      mealType,
      customName: data.customName,
      customBrand: data.customBrand,
      servings: data.servings,
      nutrition: data.nutrition,
      source: "manual",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="pb-4">
          <SheetTitle>Add to {LABELS[mealType]}</SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="w-full">
            <TabsTrigger value="search" className="flex-1">Search Recipe</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            <QuickAddSearch onSelect={handleRecipeSelect} />
          </TabsContent>

          <TabsContent value="manual" className="mt-4">
            <ManualEntryForm
              onSubmit={handleManualEntry}
              onCancel={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
