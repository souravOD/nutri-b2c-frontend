"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Recipe } from "@/lib/types";

interface RecipeCardHomeProps {
    recipe: Recipe;
    isSaved?: boolean;
    onAddToLog: (recipe: Recipe) => void;
    onDismiss: (recipeId: string) => void;
    onToggleSave: (recipeId: string) => void;
}

export function RecipeCardHome({
    recipe,
    isSaved = false,
    onAddToLog,
    onDismiss,
    onToggleSave,
}: RecipeCardHomeProps) {
    const title = recipe.title ?? recipe.name ?? "Recipe";
    const imageUrl = String(recipe.imageUrl || recipe.image_url || "");
    const calories = recipe.calories ?? recipe.nutrition?.calories ?? 0;
    const protein = recipe.protein_g ?? recipe.nutrition?.protein_g ?? 0;

    return (
        <div
            className="relative bg-white border border-[#F1F5F9] rounded-[48px] lg:rounded-[16px] p-[2px] overflow-hidden w-full"
            style={{ boxShadow: "0px 1px 2px 0px rgba(0,0,0,0.05)" }}
        >
            {/* Image */}
            <Link href={`/recipes/${recipe.id}`} className="block">
                <div className="relative w-full h-[192px] lg:h-[160px] overflow-hidden rounded-t-[46px] lg:rounded-t-[14px]">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    ) : (
                        <div className="w-full h-full bg-[#F1F5F9] flex items-center justify-center">
                            <span className="text-[#94A3B8] text-sm">No image</span>
                        </div>
                    )}
                    {/* Heart/Save button */}
                    <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(recipe.id); }}
                        className="absolute top-4 right-6 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                            backdropFilter: "blur(6px)",
                            backgroundColor: "rgba(255,255,255,0.2)",
                        }}
                        aria-label={isSaved ? "Unsave recipe" : "Save recipe"}
                    >
                        <Heart
                            className={`w-5 h-5 ${isSaved ? "fill-red-500 text-red-500" : "text-white"}`}
                            strokeWidth={2}
                        />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1 p-4">
                    {/* Title */}
                    <h4
                        className="text-[18px] font-bold text-[#0F172A] leading-7"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        {title}
                    </h4>

                    {/* Meta: kcal + protein */}
                    <div className="flex gap-3 h-[21px] items-center">
                        <div className="flex gap-1 items-center">
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" aria-hidden="true">
                                <path
                                    d="M4 0C4 0 1 3 1 5.5C1 7.43 2.57 9 4 9C5.43 9 7 7.43 7 5.5C7 3 4 0 4 0Z"
                                    fill="#64748B"
                                />
                            </svg>
                            <span
                                className="text-[14px] font-normal text-[#64748B] leading-5"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {Math.round(calories)} kcal
                            </span>
                        </div>
                        <div className="flex gap-1 items-center">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                <circle cx="5" cy="5" r="4" stroke="#64748B" strokeWidth="1.5" fill="none" />
                                <circle cx="5" cy="5" r="1.5" fill="#64748B" />
                            </svg>
                            <span
                                className="text-[14px] font-normal text-[#64748B] leading-5"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {Math.round(protein)}g Protein
                            </span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Action buttons */}
            <div className="flex gap-2 items-center justify-center pt-3 px-4 pb-4 w-full">
                <button
                    type="button"
                    onClick={() => onAddToLog(recipe)}
                    className="flex-1 py-2 rounded-full bg-[#99CC33] text-[14px] font-bold text-[#1A1A1A] leading-5 text-center"
                    style={{
                        fontFamily: "Inter, sans-serif",
                        boxShadow: "0px 4px 6px -1px rgba(153,204,51,0.2), 0px 2px 4px -2px rgba(153,204,51,0.2)",
                    }}
                >
                    Add to Log
                </button>
                <button
                    type="button"
                    onClick={() => onDismiss(recipe.id)}
                    className="flex-1 py-2 rounded-full bg-[#F0F7E6] text-[14px] font-bold text-[#538100] leading-5 text-center"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    Not for me
                </button>
            </div>
        </div>
    );
}
