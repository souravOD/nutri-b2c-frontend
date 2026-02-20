"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useGrocerySubstitutions } from "@/hooks/use-grocery-list";
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
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-start gap-3">
        <Checkbox
          checked={item.isPurchased}
          onCheckedChange={(checked) => onTogglePurchased(item.id, Boolean(checked))}
          className="mt-1"
        />

        <div className="flex-1 space-y-1">
          <p className={item.isPurchased ? "text-sm line-through text-muted-foreground" : "text-sm font-medium"}>
            {item.itemName}
          </p>
          {item.currentProductName && (
            <p className="text-xs text-muted-foreground">
              {item.substitutedProductId ? "Substitute" : "Product"}:{" "}
              {item.currentProductBrand ? `${item.currentProductBrand} ` : ""}
              {item.currentProductName}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {item.quantity} {item.unit || ""} {item.category ? `· ${item.category}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Estimated: {money(item.estimatedPrice)}
          </p>
        </div>

        <div className="w-24">
          <Input
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            onBlur={handlePriceBlur}
            placeholder="Actual"
            type="number"
            min="0"
            step="0.01"
            className="h-8"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowSubs((prev) => !prev)}
          className="h-7"
        >
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Substitutions
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="h-7 text-destructive"
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {showSubs && (
        <div className="rounded-md bg-muted/40 p-2 text-xs">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading substitutions...
            </div>
          ) : sortedSubs.length === 0 ? (
            <p className="text-muted-foreground">No substitutions available.</p>
          ) : (
            <div className="space-y-1">
              {sortedSubs.slice(0, 5).map((sub) => (
                <div key={sub.productId} className="flex items-center justify-between gap-2 rounded border bg-background px-2 py-1">
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-muted-foreground">
                      {sub.brand || ""} {sub.category ? `· ${sub.category}` : ""} · {money(sub.price)}
                      {sub.savingsVsCurrent != null ? ` · Save $${sub.savingsVsCurrent.toFixed(2)}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="h-6"
                    onClick={() => onApplySubstitution(item.id, sub.productId)}
                  >
                    Apply
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

