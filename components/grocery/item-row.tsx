"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, MoreVertical, Package } from "lucide-react";
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

// Category-based fallback icons for items without product images
const CATEGORY_FALLBACK: Record<string, string> = {
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

  const imageUrl = item.currentProductImageUrl;
  const productUrl = item.currentProductUrl;
  const fallbackEmoji = CATEGORY_FALLBACK[item.category?.trim() || "Other"] ?? "📦";

  // Dynamic border radius: pill when compact, softer when subs are expanded
  const cardRadius = showSubs ? "rounded-[16px]" : "rounded-[48px]";

  return (
    <div
      className={`bg-white ${cardRadius} border transition-all duration-200 ${
        item.isPurchased
          ? "border-transparent bg-[rgba(153,204,51,0.05)] opacity-60"
          : "border-[rgba(153,204,51,0.05)]"
      } p-[17px]`}
      style={{
        boxShadow: item.isPurchased ? "none" : "0px 1px 2px rgba(0,0,0,0.05)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 min-w-0 flex-1 overflow-hidden">
          {/* ── Checkbox ─────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => onTogglePurchased(item.id, !item.isPurchased)}
            className={`w-6 h-6 rounded-[6px] border flex items-center justify-center flex-shrink-0 transition-colors ${
              item.isPurchased
                ? "bg-[#99CC33] border-transparent"
                : "bg-white border-[rgba(153,204,51,0.3)] hover:border-[#99CC33]"
            }`}
            aria-label={item.isPurchased ? "Uncheck item" : "Check item"}
          >
            {item.isPurchased && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>

          {/* ── Product Image ────────────────────────────────────── */}
          {imageUrl ? (
            <a
              href={productUrl || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 block"
              onClick={(e) => {
                if (!productUrl) e.preventDefault();
                e.stopPropagation();
              }}
              title="View product"
            >
              <img
                src={imageUrl}
                alt={item.itemName}
                className="w-10 h-10 rounded-[8px] object-cover border border-[#F1F5F9]"
                onError={(e) => {
                  // On image load error, hide the img and show fallback
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </a>
          ) : (
            <div className="w-10 h-10 rounded-[8px] bg-[#F7F8F6] flex items-center justify-center flex-shrink-0 border border-[#F1F5F9]">
              <span className="text-[18px]">{fallbackEmoji}</span>
            </div>
          )}

          {/* ── Item Details (3 lines) ───────────────────────────── */}
          <div className="min-w-0 flex-1 overflow-hidden">
            {/* Line 1: Product name */}
            <p
              className={`text-[16px] font-medium leading-6 truncate ${
                item.isPurchased ? "line-through text-[#0F172A]" : "text-[#0F172A]"
              }`}
            >
              {item.itemName}
            </p>

            {/* Line 2: Quantity • Price */}
            <p className="text-[14px] leading-5 text-[#64748B]">
              {item.quantity}{item.unit ? ` ${item.unit}` : ""}
              {item.estimatedPrice != null && (
                <>
                  <span className="text-[#64748B]"> • </span>
                  <span className="font-medium text-[#99CC33]">{money(item.estimatedPrice)}</span>
                </>
              )}
            </p>

            {/* Line 3: Brand name */}
            {item.currentProductBrand && (
              <p className="text-[12px] leading-4 text-[#94A3B8] truncate mt-0.5">
                {item.substitutedProductId ? "🔄 " : ""}
                {item.currentProductBrand}
              </p>
            )}
          </div>
        </div>

        {/* ── 3-dot Menu ─────────────────────────────────────────── */}
        <div className="relative flex-shrink-0">
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
                  >
                    💰 Set Actual Price
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => { setShowSubs(!showSubs); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#0F172A] hover:bg-[#F7F8F6] transition-colors"
                >
                  🔄 {showSubs ? "Hide" : "View"} Substitutions
                </button>
                <button
                  type="button"
                  onClick={() => { onDelete(item.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-[13px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                >
                  🗑️ Delete Item
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Actual price inline input ──────────────────────────── */}
      {priceInput !== undefined && item.actualPrice != null && (
        <div className="mt-3 ml-[72px] flex items-center gap-2">
          <span className="text-[12px] text-[#64748B]">Actual:</span>
          <input
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="0.00"
            type="number"
            min="0"
            step="0.01"
            className="h-7 w-20 px-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
          />
        </div>
      )}

      {/* ── Substitutions panel ─────────────────────────────────── */}
      {showSubs && (
        <div className="mt-3 ml-[72px] rounded-[10px] bg-[#F7F8F6] p-2.5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[12px] text-[#64748B]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading substitutions...
            </div>
          ) : sortedSubs.length === 0 ? (
            <p className="text-[12px] text-[#64748B]">No substitutions available.</p>
          ) : (
            <div className="space-y-1.5">
              {sortedSubs.slice(0, 5).map((sub) => (
                <div
                  key={sub.productId}
                  className="flex items-center justify-between gap-2 rounded-[8px] bg-white border border-[#F1F5F9] px-2.5 py-1.5"
                >
                  <div>
                    <p className="text-[12px] font-medium text-[#0F172A]">
                      {sub.name}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {sub.brand || ""} {sub.category ? `· ${sub.category}` : ""} · {money(sub.price)}
                      {sub.savingsVsCurrent != null ? ` · Save $${sub.savingsVsCurrent.toFixed(2)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplySubstitution(item.id, sub.productId)}
                    className="h-6 px-2.5 rounded-full bg-[#99CC33] text-white text-[11px] font-medium hover:bg-[#88BB22] transition-colors flex-shrink-0"
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
