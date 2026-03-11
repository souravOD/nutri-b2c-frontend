"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Budget, BudgetPeriod } from "@/lib/types";

interface SetBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingBudget: Budget | null;
  isSaving: boolean;
  onSave: (payload: { amount: number; period: BudgetPeriod }) => void;
}

export function SetBudgetModal({
  open,
  onOpenChange,
  existingBudget,
  isSaving,
  onSave,
}: SetBudgetModalProps) {
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<BudgetPeriod>("weekly");

  useEffect(() => {
    if (!open) return;
    setAmount(existingBudget ? String(existingBudget.amount) : "");
    setPeriod(existingBudget?.period ?? "weekly");
  }, [open, existingBudget]);

  const handleSubmit = () => {
    const parsed = Number.parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    onSave({ amount: parsed, period });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingBudget ? "Update Budget" : "Set Budget"}</DialogTitle>
          <DialogDescription>
            Configure your household grocery budget for weekly or monthly tracking (USD only).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="budget-amount">Budget amount (USD)</Label>
            <Input
              id="budget-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 150"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget-period">Period</Label>
            <Select value={period} onValueChange={(value) => setPeriod(value as BudgetPeriod)}>
              <SelectTrigger id="budget-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : existingBudget ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
