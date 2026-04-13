"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, MoreVertical } from "lucide-react";
import { useGrocerySubstitutions } from "@/hooks/use-grocery-list";
import { SubstitutionFeedbackInline } from "@/components/feedback/substitution-feedback-inline";
import type { ShoppingListItem } from "@/lib/types";

interface ItemRowProps {
  listId: string;
  item: ShoppingListItem;
  onTogglePurchased: (itemId: string, checked: boolean) => void;
  onUpdateActualPrice: (itemId: string, price?: number) => void;
  onApplySubstitution: (itemId: string, productId: string) => void;
  onDelete: (itemId: string) => void;
}

function money(v: number | string | null | undefined): string {
  if (v == null || v === "") return "-";
  const n = typeof v === "string" ? Number.parseFloat(v) : v;
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "-";
}

export function ItemRow({
  listId,
  item,
  onTogglePurchased,
  onUpdateActualPrice,
  onApplySubstitution,
  onDelete,
}: ItemRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [priceInput, setPriceInput] = useState(
    item.actualPrice == null ? "" : String(item.actualPrice)
  );

  const { substitutions, isLoading } = useGrocerySubstitutions(listId, item.id, showSubs);

  const sortedSubs = useMemo(
    () => [...substitutions].sort((a, b) => (a.price ?? Number.MAX_VALUE) - (b.price ?? Number.MAX_VALUE)),
    [substitutions]
  );

  const handlePriceBlur = () => {
    if (!priceInput.trim()) {
      onUpdateActualPrice(item.id, undefined);
      return;
    }
    const value = Number.parseFloat(priceInput);
    if (!Number.isFinite(value) || value < 0) return;
    onUpdateActualPrice(item.id, value);
  };

  return (
    <div
      className={`bg-white rounded-[12px] border ${item.isPurchased ? "border-[#D1FAE5] bg-[#F0FDF4]" : "border-[#F1F5F9]"
        } p-3 transition-colors`}
      style={{ boxShadow: "0px 1px 2px rgba(0,0,0,0.04)" }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onTogglePurchased(item.id, !item.isPurchased)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${item.isPurchased
              ? "bg-[#99CC33] border-[#99CC33]"
              : "border-[#CBD5E1] hover:border-[#99CC33]"
            }`}
          aria-label={item.isPurchased ? "Uncheck" : "Check"}
        >
          {item.isPurchased && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
        </button>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-[14px] font-medium leading-5 ${item.isPurchased ? "line-through text-[#94A3B8]" : "text-[#0F172A]"
              }`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {item.itemName}
          </p>
          <p className="text-[12px] text-[#94A3B8] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
            {item.quantity} {item.unit || ""}{item.category ? ` · ${item.category}` : ""}
            {item.estimatedPrice != null ? ` · ${money(item.estimatedPrice)}` : ""}
          </p>
          {item.currentProductName && (
            <p className="text-[11px] text-[#64748B] mt-0.5" style={{ fontFamily: "Inter, sans-serif" }}>
              {item.substitutedProductId ? "🔄 " : ""}
              {item.currentProductBrand ? `${item.currentProductBrand} ` : ""}
              {item.currentProductName}
              {item.currentProductUrl && (
                <a
                  href={item.currentProductUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1.5 text-[#99CC33] hover:text-[#88BB22] hover:underline transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  View →
                </a>
              )}
            </p>
          )}
        </div>

        {/* 3-dot menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#F1F5F9] transition-colors"
            aria-label="Item options"
          >
            <MoreVertical className="w-4 h-4 text-[#94A3B8]" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-8 z-50 bg-white rounded-[12px] border border-[#F1F5F9] py-1 min-w-[180px]"
                style={{ boxShadow: "0px 4px 16px rgba(0,0,0,0.12)" }}
              >
                {!item.isPurchased && (
                  <button
                    type="button"
                    onClick={() => { setPriceInput(""); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[13px] text-[#0F172A] hover:bg-[#F7F8F6] transition-colors"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    💰 Set Actual Price
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowSubs(!showSubs); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#0F172A] hover:bg-[#F7F8F6] transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  🔄 {showSubs ? "Hide" : "View"} Substitutions
                </button>
                <button
                  type="button"
                  onClick={() => { onDelete(item.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  🗑️ Delete Item
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actual price inline input (visible when set price is clicked) */}
      {priceInput !== undefined && item.actualPrice != null && (
        <div className="mt-2 ml-9 flex items-center gap-2">
          <span className="text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>Actual:</span>
          <input
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="0.00"
            type="number"
            min="0"
            step="0.01"
            className="h-7 w-20 px-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
            style={{ fontFamily: "Inter, sans-serif" }}
          />
        </div>
      )}

      {/* Substitutions panel */}
      {showSubs && (
        <div className="mt-2 ml-9 rounded-[10px] bg-[#F7F8F6] p-2.5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading substitutions...
            </div>
          ) : sortedSubs.length === 0 ? (
            <p className="text-[12px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>No substitutions available.</p>
          ) : (
            <div className="space-y-1.5">
              {sortedSubs.slice(0, 5).map((sub) => (
                <div
                  key={sub.productId}
                  className="flex items-center justify-between gap-2 rounded-[8px] bg-white border border-[#F1F5F9] px-2.5 py-1.5"
                >
                  <div>
                    <p className="text-[12px] font-medium text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                      {sub.name}
                    </p>
                    <p className="text-[11px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
                      {sub.brand || ""} {sub.category ? `· ${sub.category}` : ""} · {money(sub.price)}
                      {sub.savingsVsCurrent != null ? ` · Save $${sub.savingsVsCurrent.toFixed(2)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplySubstitution(item.id, sub.productId)}
                    className="h-6 px-2.5 rounded-full bg-[#99CC33] text-white text-[11px] font-medium hover:bg-[#88BB22] transition-colors flex-shrink-0"
                    style={{ fontFamily: "Inter, sans-serif" }}
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Beta feedback — inline after substitutions */}
          {sortedSubs.length > 0 && (
            <SubstitutionFeedbackInline itemName={item.itemName} />
          )}
        </div>
      )}
    </div>
  );
}
