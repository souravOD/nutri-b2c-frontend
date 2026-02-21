"use client";

import { Clock, Utensils, ArrowLeftRight, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MealPlanItem } from "@/lib/types";

interface MealCardProps {
  item: MealPlanItem;
  onSwap?: (item: MealPlanItem) => void;
  onLogMeal?: (item: MealPlanItem) => void;
  onViewRecipe?: (recipeId: string) => void;
  isPastOrToday?: boolean;
}

const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  cooked: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  skipped: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

export function MealCard({ item, onSwap, onLogMeal, onViewRecipe, isPastOrToday }: MealCardProps) {
  const recipe = item.recipe;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex gap-3">
          {recipe?.imageUrl && (
            <div
              className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 cursor-pointer"
              style={{ backgroundImage: `url(${recipe.imageUrl})` }}
              onClick={() => onViewRecipe?.(item.recipeId)}
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <h4
                className="font-medium text-sm truncate cursor-pointer hover:underline"
                onClick={() => onViewRecipe?.(item.recipeId)}
              >
                {recipe?.title || "Recipe"}
              </h4>
              <Badge variant="secondary" className={`text-[10px] shrink-0 ${statusColors[item.status] || ""}`}>
                {item.status}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              {item.caloriesPerServing != null && (
                <span className="flex items-center gap-0.5">
                  <Utensils className="h-3 w-3" />
                  {item.caloriesPerServing * (item.servings || 1)} cal
                </span>
              )}
              {recipe?.cookTimeMinutes && (
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {recipe.cookTimeMinutes}m
                </span>
              )}
              {item.servings > 1 && (
                <span>{item.servings} servings</span>
              )}
            </div>

            {item.swapCount != null && item.swapCount > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Swapped {item.swapCount}x
              </p>
            )}

            <div className="flex gap-1.5 mt-2">
              {item.status === "planned" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => onSwap?.(item)}
                  >
                    <ArrowLeftRight className="h-3 w-3 mr-1" />
                    Swap
                  </Button>
                  {isPastOrToday && (
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => onLogMeal?.(item)}
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Log
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {item.estimatedCost != null && Number(item.estimatedCost) > 0 && (
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            ~${Number(item.estimatedCost).toFixed(2)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
