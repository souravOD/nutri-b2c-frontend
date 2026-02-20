"use client";

import { Trash2, ChefHat, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MealLogItem } from "@/lib/types";

interface MealItemRowProps {
  item: MealLogItem;
  onEdit?: (item: MealLogItem) => void;
  onDelete?: (id: string) => void;
}

function n(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

function displayName(item: MealLogItem): string {
  if (item.recipeName) return item.recipeName;
  if (item.productName) {
    return item.productBrand
      ? `${item.productName} (${item.productBrand})`
      : item.productName;
  }
  return item.customName ?? "Custom item";
}

export function MealItemRow({ item, onEdit, onDelete }: MealItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-2 px-1 group hover:bg-accent/50 rounded-md transition-colors">
      {item.cookedViaApp && (
        <ChefHat className="h-4 w-4 text-orange-500 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{displayName(item)}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {n(item.servings)} srv &middot; {n(item.calories)} cal &middot;{" "}
          P {Math.round(n(item.proteinG))}g &middot;{" "}
          C {Math.round(n(item.carbsG))}g &middot;{" "}
          F {Math.round(n(item.fatG))}g
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
