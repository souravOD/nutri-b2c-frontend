"use client";

import { useMemo } from "react";
import { CategorySection } from "@/components/grocery/category-section";
import type { ShoppingListItem } from "@/lib/types";

interface ListViewProps {
  listId: string;
  items: ShoppingListItem[];
  onTogglePurchased: (itemId: string, checked: boolean) => void;
  onUpdateActualPrice: (itemId: string, price?: number) => void;
  onApplySubstitution: (itemId: string, productId: string) => void;
  onDelete: (itemId: string) => void;
}

export function ListView({
  listId,
  items,
  onTogglePurchased,
  onUpdateActualPrice,
  onApplySubstitution,
  onDelete,
}: ListViewProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>();
    for (const item of items) {
      const category = item.category?.trim() || "Other";
      if (!map.has(category)) map.set(category, []);
      map.get(category)!.push(item);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  if (items.length === 0) {
    return <p className="rounded-md border p-4 text-sm text-muted-foreground">No items in this list yet.</p>;
  }

  return (
    <div className="space-y-3">
      {grouped.map(([category, categoryItems]) => (
        <CategorySection
          key={category}
          listId={listId}
          category={category}
          items={categoryItems}
          onTogglePurchased={onTogglePurchased}
          onUpdateActualPrice={onUpdateActualPrice}
          onApplySubstitution={onApplySubstitution}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

