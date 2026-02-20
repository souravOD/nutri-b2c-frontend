"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    itemName: string;
    quantity: number;
    unit?: string;
    category?: string;
    estimatedPrice?: number;
  }) => void;
  isSubmitting?: boolean;
}

export function AddItemModal({ open, onOpenChange, onSubmit, isSubmitting }: AddItemModalProps) {
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState("");

  const handleSubmit = () => {
    const qty = Number.parseFloat(quantity);
    if (!itemName.trim() || !Number.isFinite(qty) || qty <= 0) return;

    const price = Number.parseFloat(estimatedPrice);

    onSubmit({
      itemName: itemName.trim(),
      quantity: qty,
      ...(unit.trim() ? { unit: unit.trim() } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(Number.isFinite(price) && price >= 0 ? { estimatedPrice: price } : {}),
    });

    setItemName("");
    setQuantity("1");
    setUnit("");
    setCategory("");
    setEstimatedPrice("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="grocery-item-name">Item name</Label>
            <Input
              id="grocery-item-name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Paper towels"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="grocery-item-quantity">Quantity</Label>
              <Input
                id="grocery-item-quantity"
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="grocery-item-unit">Unit</Label>
              <Input
                id="grocery-item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs / kg / bottle"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="grocery-item-category">Category</Label>
              <Input
                id="grocery-item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Other"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="grocery-item-estimated-price">Estimated price</Label>
              <Input
                id="grocery-item-estimated-price"
                type="number"
                step="0.01"
                min="0"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !itemName.trim()}>
            Add Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

