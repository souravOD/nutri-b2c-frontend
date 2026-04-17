"use client";

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

const CATEGORY_ICONS: Record<string, string> = {
  Products: "🛒",
  Ingredients: "🥬",
  Produce: "🥬",
  Dairy: "🧀",
  Pantry: "🫙",
  Meat: "🥩",
  Frozen: "🧊",
  Bakery: "🍞",
  Beverages: "🥤",
  Snacks: "🍿",
  Other: "📦",
};

export function CategorySection({
  listId,
  category,
  items,
  onTogglePurchased,
  onUpdateActualPrice,
  onApplySubstitution,
  onDelete,
}: CategorySectionProps) {
  const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;
  const itemLabel = items.length === 1 ? "1 item" : `${items.length} items`;

  return (
    <div className="mb-8" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* ── Category header ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 w-full mb-3">
        <span className="text-[18px]">{icon}</span>
        <h3 className="text-[18px] font-bold text-[#0F172A]">
          {category}
        </h3>
        {/* Spacer pushes badge to right */}
        <div className="flex-1" />
        <span className="text-[12px] font-medium text-[#538100] bg-[rgba(153,204,51,0.1)] rounded-full px-2 py-0.5">
          {itemLabel}
        </span>
      </div>

      {/* ── Items ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {items.map((item) => (
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
    </div>
  );
}
