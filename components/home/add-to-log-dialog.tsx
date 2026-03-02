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
import type { Recipe, MealType } from "@/lib/types";

interface AddToLogDialogProps {
    recipe: Recipe | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (recipeId: string, mealType: MealType, servings: number) => void;
    loading?: boolean;
}

const MEAL_TYPES: { value: MealType; label: string }[] = [
    { value: "breakfast", label: "Breakfast" },
    { value: "lunch", label: "Lunch" },
    { value: "dinner", label: "Dinner" },
    { value: "snack", label: "Snack" },
];

export function AddToLogDialog({
    recipe,
    open,
    onOpenChange,
    onConfirm,
    loading = false,
}: AddToLogDialogProps) {
    const [mealType, setMealType] = useState<MealType>("lunch");
    const [servings, setServings] = useState(1);

    if (!recipe) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[360px] rounded-3xl">
                <DialogHeader>
                    <DialogTitle
                        className="text-[18px] font-bold text-[#0F172A]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Add to Meal Log
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    {/* Recipe name */}
                    <p
                        className="text-[14px] text-[#64748B]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {recipe.title}
                    </p>

                    {/* Meal type picker */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-[12px] font-medium text-[#0F172A] uppercase tracking-wider"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Meal Type
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {MEAL_TYPES.map((mt) => (
                                <button
                                    key={mt.value}
                                    type="button"
                                    onClick={() => setMealType(mt.value)}
                                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${mealType === mt.value
                                        ? "bg-[#99CC33] text-[#1A1A1A]"
                                        : "bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]"
                                        }`}
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {mt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Servings */}
                    <div className="flex flex-col gap-2">
                        <label
                            className="text-[12px] font-medium text-[#0F172A] uppercase tracking-wider"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Servings
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setServings(Math.max(0.5, servings - 0.5))}
                                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#0F172A] font-bold flex items-center justify-center hover:bg-[#E2E8F0]"
                            >
                                −
                            </button>
                            <span
                                className="text-[18px] font-bold text-[#0F172A] w-8 text-center"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {servings}
                            </span>
                            <button
                                type="button"
                                onClick={() => setServings(servings + 0.5)}
                                className="w-8 h-8 rounded-full bg-[#F1F5F9] text-[#0F172A] font-bold flex items-center justify-center hover:bg-[#E2E8F0]"
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-center">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 rounded-full"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onConfirm(recipe.id, mealType, servings)}
                        disabled={loading}
                        className="flex-1 rounded-full bg-[#99CC33] text-[#1A1A1A] font-bold hover:bg-[#8ABB2A]"
                    >
                        {loading ? "Adding..." : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
