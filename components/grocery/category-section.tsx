"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);
  const purchasedCount = items.filter((i) => i.isPurchased).length;
  const icon = CATEGORY_ICONS[category] ?? CATEGORY_ICONS.Other;

  return (
    <div className="mb-3">
      {/* Category header */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-[18px]">{icon}</span>
          <h3
            className="text-[15px] font-semibold text-[#0F172A]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {category}
          </h3>
          <span
            className="text-[11px] font-medium text-[#64748B] bg-[#F1F5F9] rounded-full px-2 py-0.5"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {items.length} items
          </span>
        </div>
        <div className="flex items-center gap-2">
          {purchasedCount > 0 && (
            <span
              className="text-[11px] font-medium text-[#538100]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {purchasedCount}/{items.length}
            </span>
          )}
          {collapsed ? (
            <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
          ) : (
            <ChevronUp className="w-4 h-4 text-[#94A3B8]" />
          )}
        </div>
      </button>

      {/* Items */}
      {!collapsed && (
        <div className="space-y-2">
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
      )}
    </div>
  );
}
