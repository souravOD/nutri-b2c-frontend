"use client";

import { useState } from "react";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MealItemRow } from "./meal-item-row";
import type { MealLogItem, MealType } from "@/lib/types";

interface MealSlotProps {
  mealType: MealType;
  items: MealLogItem[];
  onAdd: () => void;
  onEdit: (item: MealLogItem) => void;
  onDelete: (id: string) => void;
}

const LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

export function MealSlot({ mealType, items, onAdd, onEdit, onDelete }: MealSlotProps) {
  const [expanded, setExpanded] = useState(true);
  const totalCal = items.reduce((sum, i) => sum + n(i.calories), 0);

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between py-3 px-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className="text-sm font-semibold uppercase tracking-wide">
            {LABELS[mealType]}
          </h3>
          <span className="text-xs text-muted-foreground tabular-nums">
            ({totalCal} cal)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 pb-3 px-4">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              No items logged yet
            </p>
          ) : (
            <div className="divide-y">
              {items.map((item) => (
                <MealItemRow
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
