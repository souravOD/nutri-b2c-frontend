"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeftRight } from "lucide-react";
import type { MealPlanItem } from "@/lib/types";

interface SwapModalProps {
  item: MealPlanItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmSwap: (itemId: string, reason?: string) => void;
  isSwapping: boolean;
}

export function SwapModal({ item, open, onOpenChange, onConfirmSwap, isSwapping }: SwapModalProps) {
  const [reason, setReason] = useState("");

  if (!item) return null;

  const handleConfirm = () => {
    onConfirmSwap(item.id, reason.trim() || undefined);
    setReason("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Swap Meal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Current meal:</p>
            <p className="text-sm text-muted-foreground">
              {item.recipe?.title || "Recipe"} ({item.mealDate}, {item.mealType})
            </p>
            {item.caloriesPerServing && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.caloriesPerServing * (item.servings || 1)} calories
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="swap-reason">Reason for swap (optional)</Label>
            <Textarea
              id="swap-reason"
              placeholder="e.g., Too time-consuming, not in the mood, missing ingredients..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            AI will find the best alternative that matches your dietary needs and nutrition goals.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSwapping}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSwapping}>
            {isSwapping ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Finding alternative...
              </>
            ) : (
              "Find Alternative"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
