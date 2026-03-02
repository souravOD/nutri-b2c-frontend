"use client";

import { useState } from "react";
import { X } from "lucide-react";

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

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 bottom-4 top-auto lg:inset-auto lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-50 w-auto lg:max-w-[420px] lg:w-full">
        <div
          className="bg-white rounded-[20px] p-5 lg:p-6"
          style={{ boxShadow: "0px 8px 32px rgba(0,0,0,0.16)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-[18px] font-bold text-[#0F172A]"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Add Custom Item
            </h3>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center hover:bg-[#E2E8F0] transition-colors"
            >
              <X className="w-4 h-4 text-[#64748B]" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label
                htmlFor="add-item-name"
                className="block text-[12px] font-medium text-[#64748B] mb-1"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Item name
              </label>
              <input
                id="add-item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Paper towels"
                className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="add-item-qty"
                  className="block text-[12px] font-medium text-[#64748B] mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Quantity
                </label>
                <input
                  id="add-item-qty"
                  type="number"
                  step="0.01"
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label
                  htmlFor="add-item-unit"
                  className="block text-[12px] font-medium text-[#64748B] mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Unit
                </label>
                <input
                  id="add-item-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs / kg"
                  className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="add-item-cat"
                  className="block text-[12px] font-medium text-[#64748B] mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Category
                </label>
                <input
                  id="add-item-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Other"
                  className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
              <div>
                <label
                  htmlFor="add-item-price"
                  className="block text-[12px] font-medium text-[#64748B] mb-1"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  Est. price
                </label>
                <input
                  id="add-item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 px-3 rounded-[10px] border border-[#E2E8F0] bg-white text-[14px] text-[#0F172A] focus:outline-none focus:border-[#99CC33] focus:ring-1 focus:ring-[#99CC33]/20"
                  style={{ fontFamily: "Inter, sans-serif" }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-full border border-[#E2E8F0] text-[#64748B] text-[14px] font-medium hover:bg-[#F7F8F6] transition-colors"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !itemName.trim()}
              className="flex-1 h-10 rounded-full bg-[#99CC33] text-white text-[14px] font-semibold hover:bg-[#88BB22] transition-colors disabled:opacity-50"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
