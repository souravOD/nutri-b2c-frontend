"use client";

import { useState, useCallback } from "react";
import { Copy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMealLog } from "@/hooks/use-meal-log";
import { DateNavigator } from "./date-navigator";
import { NutritionRing } from "./nutrition-ring";
import { MacroBars } from "./macro-bars";
import { WaterTracker } from "./water-tracker";
import { StreakBadge } from "./streak-badge";
import { MealSlot } from "./meal-slot";
import { AddItemSheet } from "./add-item-sheet";
import { HistoryView } from "./history-view";
import type { MealType, MealLogItem, AddMealItemPayload } from "@/lib/types";

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

interface DailyViewProps {
  initialDate?: string;
}

export function DailyView({ initialDate }: DailyViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(initialDate ?? today);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>("breakfast");
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

  const isViewingToday = date === today;

  const {
    log,
    items,
    targets,
    streak,
    isLoading,
    itemsByMeal,
    addItem,
    updateItem,
    deleteItem,
    logWater,
    copyDay,
  } = useMealLog(date);

  const handleOpenAdd = useCallback((mealType: MealType) => {
    setActiveMealType(mealType);
    setAddSheetOpen(true);
  }, []);

  const handleAddItem = useCallback(
    (payload: AddMealItemPayload) => {
      addItem.mutate(payload, {
        onSuccess: () => toast({ title: "Item added" }),
        onError: () => toast({ title: "Failed to add item", variant: "destructive" }),
      });
    },
    [addItem, toast]
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      deleteItem.mutate(id, {
        onSuccess: () => toast({ title: "Item removed" }),
        onError: () => toast({ title: "Failed to remove item", variant: "destructive" }),
      });
    },
    [deleteItem, toast]
  );

  const handleEditItem = useCallback(
    (item: MealLogItem) => {
      // For now, toggle servings as a simple edit (full edit dialog is a future enhancement)
    },
    []
  );

  const handleAddWater = useCallback(
    (ml: number) => {
      logWater.mutate(
        { date, amountMl: ml },
        {
          onError: () => toast({ title: "Failed to log water", variant: "destructive" }),
        }
      );
    },
    [logWater, date, toast]
  );

  const handleCopyToToday = useCallback(() => {
    if (isViewingToday) return;
    copyDay.mutate(
      { sourceDate: date, targetDate: today },
      {
        onSuccess: (data: any) => {
          const label = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          toast({ title: `Copied ${data.items?.length ?? 0} items from ${label} to today` });
          setDate(today);
        },
        onError: () =>
          toast({ title: "No items found on this date to copy", variant: "destructive" }),
      }
    );
  }, [copyDay, date, today, isViewingToday, toast]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-muted rounded" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
        <div className="h-24 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DateNavigator date={date} onChange={setDate} />

      {/* Calorie Ring + Streak */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <NutritionRing
            current={n(log?.totalCalories)}
            goal={log?.calorieGoal ?? n(targets?.targetCalories)}
          />
          <div className="flex flex-col items-end gap-2">
            <StreakBadge streak={streak} />
            {log?.goalMet && (
              <span className="text-xs text-green-600 font-medium">Goal met!</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Macro Bars */}
      <Card>
        <CardContent className="py-4">
          <MacroBars
            currentProtein={n(log?.totalProteinG)}
            currentCarbs={n(log?.totalCarbsG)}
            currentFat={n(log?.totalFatG)}
            targets={targets}
          />
        </CardContent>
      </Card>

      {/* Water Tracker */}
      <Card>
        <CardContent className="py-4">
          <WaterTracker
            currentMl={log?.waterMl ?? 0}
            goalMl={log?.waterGoalMl ?? 2500}
            onAdd={handleAddWater}
          />
        </CardContent>
      </Card>

      {/* Meal Slots */}
      {MEAL_TYPES.map((mt) => (
        <MealSlot
          key={mt}
          mealType={mt}
          items={itemsByMeal(mt)}
          onAdd={() => handleOpenAdd(mt)}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
        />
      ))}

      {/* Actions */}
      <div className="flex gap-2">
        {!isViewingToday && (
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={handleCopyToToday}
            disabled={copyDay.isPending || items.length === 0}
          >
            <Copy className="h-4 w-4" />
            Copy to Today
          </Button>
        )}
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setShowHistory(!showHistory)}
        >
          <TrendingUp className="h-4 w-4" />
          {showHistory ? "Hide Trends" : "Weekly Trends"}
        </Button>
      </div>

      {showHistory && (
        <HistoryView open={showHistory} onClose={() => setShowHistory(false)} />
      )}

      <AddItemSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        mealType={activeMealType}
        date={date}
        onAdd={handleAddItem}
      />
    </div>
  );
}
