"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemRow } from "@/components/grocery/item-row";
import type { ShoppingListItem } from "@/lib/types";

interface CategorySectionProps {
  listId: string;
  category: string;
  items: ShoppingListItem[];
  onTogglePurchased: (itemId: string, checked: boolean) => void;
  onUpdateActualPrice: (itemId: string, price?: number) => void;
  onApplySubstitution: (itemId: string, productId: string) => void;
  onDelete: (itemId: string) => void;
}

export function CategorySection({
  listId,
  category,
  items,
  onTogglePurchased,
  onUpdateActualPrice,
  onApplySubstitution,
  onDelete,
}: CategorySectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const purchasedCount = useMemo(
    () => items.filter((item) => item.isPurchased).length,
    [items]
  );

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased)),
    [items]
  );

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <Button
        variant="ghost"
        className="h-auto w-full justify-between p-0 text-left"
        onClick={() => setCollapsed((prev) => !prev)}
      >
        <div className="flex items-center gap-2">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          <p className="text-sm font-semibold">{category}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {purchasedCount}/{items.length} purchased
        </p>
      </Button>

      {!collapsed && (
        <div className="space-y-2">
          {orderedItems.map((item) => (
            <ItemRow
              key={item.id}
              listId={listId}
              item={item}
              onTogglePurchased={onTogglePurchased}
              onUpdateActualPrice={onUpdateActualPrice}
              onApplySubstitution={onApplySubstitution}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

