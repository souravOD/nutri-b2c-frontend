"use client";

import { useMemo } from "react";
import { MealCard } from "./meal-card";
import type { MealPlanItem } from "@/lib/types";

interface WeeklyCalendarProps {
  items: MealPlanItem[];
  startDate: string;
  endDate: string;
  mealsPerDay: string[];
  onSwap?: (item: MealPlanItem) => void;
  onLogMeal?: (item: MealPlanItem) => void;
  onViewRecipe?: (recipeId: string) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function getDateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + "T00:00:00");
  const endD = new Date(end + "T00:00:00");
  while (d <= endD) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayName = DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1];
  return `${dayName} ${d.getDate()}/${d.getMonth() + 1}`;
}

export function WeeklyCalendar({
  items,
  startDate,
  endDate,
  mealsPerDay,
  onSwap,
  onLogMeal,
  onViewRecipe,
}: WeeklyCalendarProps) {
  const dates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate]);
  const todayStr = new Date().toISOString().slice(0, 10);

  const itemMap = useMemo(() => {
    const map = new Map<string, MealPlanItem>();
    for (const item of items) {
      map.set(`${item.mealDate}|${item.mealType}`, item);
    }
    return map;
  }, [items]);

  return (
    <div className="space-y-4">
      {/* Desktop grid */}
      <div className="hidden md:block overflow-x-auto">
        <div
          className="grid gap-2 min-w-[800px]"
          style={{
            gridTemplateColumns: `100px repeat(${dates.length}, 1fr)`,
          }}
        >
          {/* Header row */}
          <div />
          {dates.map((date) => (
            <div
              key={date}
              className={`text-center text-sm font-medium p-2 rounded-lg ${
                date === todayStr
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {formatDayLabel(date)}
            </div>
          ))}

          {/* Meal rows */}
          {mealsPerDay.map((meal) => (
            <div key={meal} className="contents">
              <div
                className="flex items-center text-sm font-medium text-muted-foreground capitalize"
              >
                {MEAL_LABELS[meal] || meal}
              </div>
              {dates.map((date) => {
                const item = itemMap.get(`${date}|${meal}`);
                return (
                  <div key={`${date}-${meal}`} className="min-h-[80px]">
                    {item ? (
                      <MealCard
                        item={item}
                        onSwap={onSwap}
                        onLogMeal={onLogMeal}
                        onViewRecipe={onViewRecipe}
                        isPastOrToday={date <= todayStr}
                      />
                    ) : (
                      <div className="h-full min-h-[80px] border border-dashed rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                        No meal
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: stacked daily view */}
      <div className="md:hidden space-y-6">
        {dates.map((date) => (
          <div key={date}>
            <h3
              className={`text-sm font-semibold mb-2 ${
                date === todayStr ? "text-primary" : ""
              }`}
            >
              {formatDayLabel(date)}
              {date === todayStr && (
                <span className="ml-2 text-xs font-normal text-primary">(Today)</span>
              )}
            </h3>
            <div className="space-y-2">
              {mealsPerDay.map((meal) => {
                const item = itemMap.get(`${date}|${meal}`);
                return (
                  <div key={`${date}-${meal}`}>
                    <p className="text-xs font-medium text-muted-foreground capitalize mb-1">
                      {MEAL_LABELS[meal] || meal}
                    </p>
                    {item ? (
                      <MealCard
                        item={item}
                        onSwap={onSwap}
                        onLogMeal={onLogMeal}
                        onViewRecipe={onViewRecipe}
                        isPastOrToday={date <= todayStr}
                      />
                    ) : (
                      <div className="border border-dashed rounded-lg p-3 text-center text-xs text-muted-foreground">
                        No meal planned
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
