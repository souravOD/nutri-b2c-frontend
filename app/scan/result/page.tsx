"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Share2, Users, Plus, Loader2 } from "lucide-react";
import Image from "next/image";

import { apiScanLookup } from "@/lib/scan-api";
import { apiAddMealItem } from "@/lib/api";
import { AllergenAlert } from "@/components/scan/allergen-alert";
import { DietBadges } from "@/components/scan/diet-badges";
import { HealthCheckTable } from "@/components/scan/health-check-table";
import { MealTypeSheet } from "@/components/scan/meal-type-sheet";
import { Button } from "@/components/ui/button";

// ── Inner component that reads searchParams ─────────────────────────────────

function ScanResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const barcode = searchParams.get("barcode") ?? "";

    const { data: result, isLoading, error } = useQuery({
        queryKey: ["scan-result", barcode],
        queryFn: () => apiScanLookup(barcode),
        enabled: !!barcode,
        staleTime: 60_000,
    });

    // ── Add to Meal state (MUST be before any conditional returns) ───
    const [showMealSheet, setShowMealSheet] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[100dvh] bg-[#F7F8F6] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#538100]" />
                <p className="text-[15px] text-[#64748B] mt-4" style={{ fontFamily: "Inter, sans-serif" }}>
                    Loading product details...
                </p>
            </div>
        );
    }

    // Error / not found
    if (error || !result?.product) {
        return (
            <div className="min-h-[100dvh] bg-[#F7F8F6] px-4">
                <header className="flex items-center gap-3 pt-6 pb-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
                    </button>
                    <h1 className="text-[18px] font-bold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                        Scan Result
                    </h1>
                </header>
                <div className="flex flex-col items-center justify-center py-20">
                    <p className="text-[16px] font-semibold text-[#0F172A]" style={{ fontFamily: "Inter, sans-serif" }}>
                        Product not found
                    </p>
                    <p className="text-[14px] text-[#64748B] mt-2 text-center" style={{ fontFamily: "Inter, sans-serif" }}>
                        We couldn&apos;t find barcode <span className="font-mono">{barcode}</span> in our database.
                    </p>
                    <Button
                        className="mt-6 bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl"
                        onClick={() => router.push("/scan")}
                    >
                        Scan Another Product
                    </Button>
                </div>
            </div>
        );
    }

    const product = result.product;
    const nutrition = product.nutrition;

    const handleAddToMeal = async (mealType: "breakfast" | "lunch" | "dinner" | "snack", servings: number) => {
        setIsAdding(true);
        try {
            await apiAddMealItem({
                date: new Date().toISOString().slice(0, 10),
                mealType,
                productId: product.id,
                customName: product.name,
                servings,
                servingSize: product.servingSize ?? undefined,
                source: "scan",
                nutrition: {
                    calories: nutrition.calories ?? undefined,
                    proteinG: nutrition.protein_g ?? undefined,
                    carbsG: nutrition.carbs_g ?? undefined,
                    fatG: nutrition.fat_g ?? undefined,
                    fiberG: nutrition.fiber_g ?? undefined,
                    sugarG: nutrition.sugar_g ?? undefined,
                    sodiumMg: nutrition.sodium_mg ?? undefined,
                },
            });
            setShowMealSheet(false);
            // Navigate to meal log page to confirm the item was logged
            router.push(`/meal-log?date=${new Date().toISOString().slice(0, 10)}`);
        } catch (err) {
            console.error("[ScanResult] Add to meal failed:", err);
            alert("Failed to add to meal. Please try again.");
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="min-h-[100dvh] bg-[#F7F8F6] pb-[100px]">
            <div className="w-full max-w-[600px] mx-auto px-4">

                {/* ── Header ────────────────────────────────────────────────────── */}
                <header className="flex items-center justify-between pt-6 pb-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
                    </button>
                    <h1
                        className="text-[17px] font-semibold text-[#0F172A]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Scan Result
                    </h1>
                    <button
                        type="button"
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm"
                        aria-label="Share"
                    >
                        <Share2 className="w-5 h-5 text-[#0F172A]" />
                    </button>
                </header>

                {/* ── Family Safety Check ───────────────────────────────────────── */}
                {result.allergenWarnings.length > 0 && (
                    <div className="flex items-center gap-2 mt-3 mb-2 px-1">
                        <Users className="w-4 h-4 text-[#538100]" />
                        <span
                            className="text-[13px] font-semibold text-[#538100]"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Family Safety Check
                        </span>
                        <span className="ml-auto text-[12px] text-[#EF4444] font-semibold">
                            {result.allergenWarnings.length} alert{result.allergenWarnings.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}

                {/* ── Product Hero Card ─────────────────────────────────────────── */}
                <section
                    className="bg-white rounded-[24px] border border-[#F1F5F9] overflow-hidden mt-3"
                    style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.06)" }}
                >
                    {product.imageUrl && (
                        <div className="relative w-full aspect-[16/9] bg-[#F8FAFC]">
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-contain p-4"
                                unoptimized
                            />
                        </div>
                    )}
                    <div className="px-5 py-4">
                        <h2
                            className="text-[18px] font-bold text-[#0F172A] leading-6"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {product.name}
                        </h2>
                        {product.brand && (
                            <p
                                className="text-[14px] text-[#64748B] mt-0.5"
                                style={{ fontFamily: "Inter, sans-serif" }}
                            >
                                {product.brand}
                            </p>
                        )}
                        {product.servingSize && (
                            <p className="text-[12px] text-[#94A3B8] mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                                Serving: {product.servingSize}
                            </p>
                        )}
                    </div>
                </section>

                {/* ── Nutrition Facts (per 100g) ───────────────────────────────── */}
                {(() => {
                    // Safely extract numeric value from potentially complex objects
                    const safeNum = (v: unknown): number | null => {
                        if (v == null) return null;
                        if (typeof v === "number") return v;
                        if (typeof v === "object" && v !== null && "amount" in v) {
                            return typeof (v as { amount: unknown }).amount === "number" ? (v as { amount: number }).amount : null;
                        }
                        const n = Number(v);
                        return isNaN(n) ? null : n;
                    };

                    const allFacts = [
                        { label: "Protein", value: safeNum(nutrition.protein_g), unit: "g", color: "#99CC33" },
                        { label: "Total Carbs", value: safeNum(nutrition.carbs_g), unit: "g", color: "#60A5FA" },
                        { label: "Total Fat", value: safeNum(nutrition.fat_g), unit: "g", color: "#FB923C" },
                        { label: "Saturated Fat", value: safeNum(nutrition.saturatedFat), unit: "g", color: undefined },
                        { label: "Trans Fat", value: safeNum(nutrition.transFat), unit: "g", color: undefined },
                        { label: "Dietary Fiber", value: safeNum(nutrition.fiber_g), unit: "g", color: undefined },
                        { label: "Total Sugars", value: safeNum(nutrition.sugar_g), unit: "g", color: undefined },
                        { label: "Cholesterol", value: safeNum(nutrition.cholesterol), unit: "mg", color: undefined },
                        { label: "Sodium", value: safeNum(nutrition.sodium_mg), unit: "mg", color: undefined },
                    ].filter(f => f.value != null);

                    return (
                        <section
                            className="bg-white rounded-[24px] border border-[#F1F5F9] p-5 mt-4"
                            style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
                        >
                            {/* Section header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3
                                    className="text-[14px] font-bold text-[#0F172A]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    Nutrition Facts
                                </h3>
                                <span
                                    className="text-[12px] font-medium text-white bg-[#538100] rounded-full px-2.5 py-0.5"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    per 100g
                                </span>
                            </div>

                            {/* Calories — prominent display */}
                            <div className="flex items-center justify-between bg-[#F7F8F6] rounded-2xl px-4 py-3 mb-4">
                                <span
                                    className="text-[14px] font-semibold text-[#0F172A]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    Calories
                                </span>
                                <span
                                    className="text-[22px] font-bold text-[#0F172A]"
                                    style={{ fontFamily: "Inter, sans-serif" }}
                                >
                                    {nutrition.calories ?? 0}
                                    <span className="text-[13px] font-normal text-[#94A3B8] ml-1">kcal</span>
                                </span>
                            </div>

                            {/* All nutrition rows */}
                            <div className="divide-y divide-[#F1F5F9]">
                                {allFacts.map((f) => (
                                    <div key={f.label} className="flex items-center justify-between py-3">
                                        <div className="flex items-center gap-2">
                                            {f.color && (
                                                <span
                                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: f.color }}
                                                />
                                            )}
                                            <span
                                                className={`text-[13px] ${f.color ? "font-semibold text-[#0F172A]" : "text-[#64748B]"}`}
                                                style={{ fontFamily: "Inter, sans-serif" }}
                                            >
                                                {f.label}
                                            </span>
                                        </div>
                                        <span
                                            className="text-[13px] font-semibold text-[#0F172A]"
                                            style={{ fontFamily: "Inter, sans-serif" }}
                                        >
                                            {f.value}{f.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })()}

                {/* ── Allergen Alert ────────────────────────────────────────────── */}
                {result.allergenWarnings.length > 0 && (
                    <div className="mt-4">
                        <AllergenAlert warnings={result.allergenWarnings} />
                    </div>
                )}

                {/* ── Diet Compatibility ────────────────────────────────────────── */}
                {product.dietTags && product.dietTags.length > 0 && (
                    <div className="mt-4">
                        <DietBadges tags={product.dietTags} />
                    </div>
                )}

                {/* ── Health Condition Check ────────────────────────────────────── */}
                {result.healthWarnings.length > 0 && (
                    <div className="mt-4">
                        <HealthCheckTable warnings={result.healthWarnings} />
                    </div>
                )}

                {/* ── Ingredients ───────────────────────────────────────────────── */}
                {product.ingredientText && (
                    <section
                        className="bg-white rounded-[24px] border border-[#F1F5F9] p-5 mt-4"
                        style={{ boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.04)" }}
                    >
                        <h3
                            className="text-[14px] font-bold text-[#0F172A] mb-2"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            Ingredients
                        </h3>
                        <p
                            className="text-[13px] text-[#64748B] leading-5"
                            style={{ fontFamily: "Inter, sans-serif" }}
                        >
                            {product.ingredientText}
                        </p>
                    </section>
                )}
            </div>

            {/* ── Fixed Bottom CTA (mobile) ─────────────────────────────────── */}
            <div className="fixed bottom-[72px] left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-t border-[#F1F5F9] px-6 py-4 lg:hidden">
                <Button
                    onClick={() => setShowMealSheet(true)}
                    className="w-full h-[52px] bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl text-[16px] font-semibold"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Meal
                </Button>
            </div>

            {/* ── Inline CTA (desktop) ───────────────────────────────────────── */}
            <div className="hidden lg:block w-full max-w-[600px] mx-auto px-4 mt-6 pb-8">
                <Button
                    onClick={() => setShowMealSheet(true)}
                    className="w-full h-[52px] bg-[#538100] hover:bg-[#466e00] text-white rounded-2xl text-[16px] font-semibold shadow-lg shadow-[#538100]/20 transition-all hover:shadow-xl hover:shadow-[#538100]/30"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add to Meal Log
                </Button>
            </div>

            {/* ── Meal Type Sheet ──────────────────────────────────────────────── */}
            <MealTypeSheet
                isOpen={showMealSheet}
                onClose={() => setShowMealSheet(false)}
                onSelect={handleAddToMeal}
                isLoading={isAdding}
                servingSizeLabel={product.servingSize}
            />
        </div>
    );
}

// ── Page wrapper with Suspense for useSearchParams ──────────────────────────

export default function ScanResultPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-[100dvh] bg-[#F7F8F6] flex items-center justify-center">
                    <Loader2 className="w-10 h-10 animate-spin text-[#538100]" />
                </div>
            }
        >
            <ScanResultContent />
        </Suspense>
    );
}
