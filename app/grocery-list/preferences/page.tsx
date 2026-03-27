"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  useCertifications,
  useGroceryPreferences,
  useUpdateGroceryPreferences,
  useSearchBrands,
} from "@/hooks/use-grocery-preferences";
import { useToast } from "@/hooks/use-toast";
import type { Certification } from "@/lib/grocery-preferences-api";

// ── Tier 1 codes (shown by default) ────────────────────────────────────────

const TIER_1_CODES = [
  "USDA_ORGANIC",
  "NON_GMO_PROJECT",
  "NO_MSG",
  "ANIMAL_WELFARE_APPROVED",
  "GF_GFCO",
  "VEGAN_CERTIFIED",
  "FAIRTRADE",
  "DAIRY_FREE_CERTIFIED",
];

const CERT_ICONS: Record<string, string> = {
  ORGANIC: "🥬",
  NON_GMO: "🌱",
  ADDITIVE_FREE: "🚫",
  ANIMAL_WELFARE: "🐄",
  GLUTEN_FREE: "🌾",
  VEGAN: "🌿",
  SUSTAINABILITY: "🤝",
  ALLERGEN_FREE: "🥛",
  RELIGIOUS: "✡️",
  FOOD_SAFETY_SYSTEM: "🔒",
  VEGETARIAN: "🥗",
  PLANT_BASED: "🌿",
  NUTRITION_PROGRAM: "📋",
  RETAILER_SCHEME: "🏪",
};

// ── Toggle Switch ───────────────────────────────────────────────────────────

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 48, height: 28, borderRadius: 14, border: "none",
        cursor: "pointer", position: "relative", transition: "background 0.2s",
        background: checked ? "#99CC33" : "#D1D5DB", flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute", top: 3, left: checked ? 23 : 3,
          width: 22, height: 22, borderRadius: "50%", background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ── Page Component ──────────────────────────────────────────────────────────

export default function GroceryPreferencesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Quality & Brands state
  const [selectedCertIds, setSelectedCertIds] = useState<Set<string>>(new Set());
  const [brandQuery, setBrandQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [showAllCerts, setShowAllCerts] = useState(false);
  const [activeFreqControl, setActiveFreqControl] = useState<"meals" | "days">("meals");

  // Data hooks
  const { certifications, isLoading: certsLoading } = useCertifications();
  const { preferences, isLoading: prefsLoading } = useGroceryPreferences();
  const updatePrefs = useUpdateGroceryPreferences();
  const { brands: brandSuggestions, isLoading: brandsLoading } = useSearchBrands(brandQuery);

  // Load existing preferences into state
  const [initialized, setInitialized] = useState(false);
  if (preferences && !initialized) {
    setSelectedCertIds(new Set(preferences.certificationIds));
    setSelectedBrands(preferences.brands.map((b) => b.name));
    setMealsPerDay(preferences.mealsPerDay);
    setDaysPerWeek(preferences.daysPerWeek);
    setInitialized(true);
  }

  // Separate Tier 1 vs Tier 2
  const { tier1, tier2 } = useMemo(() => {
    const t1: Certification[] = [];
    const t2: Certification[] = [];
    for (const cert of certifications) {
      if (TIER_1_CODES.includes(cert.code)) t1.push(cert);
      else t2.push(cert);
    }
    t1.sort((a, b) => TIER_1_CODES.indexOf(a.code) - TIER_1_CODES.indexOf(b.code));
    return { tier1: t1, tier2: t2 };
  }, [certifications]);

  const displayedCerts = showAllCerts ? [...tier1, ...tier2] : tier1;

  // Handlers
  const toggleCert = (id: string) => {
    setSelectedCertIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addBrand = (brand: string) => {
    if (!selectedBrands.includes(brand)) {
      setSelectedBrands((prev) => [...prev, brand]);
    }
    setBrandQuery("");
  };

  const removeBrand = (brand: string) => {
    setSelectedBrands((prev) => prev.filter((b) => b !== brand));
  };

  const handleSave = async () => {
    try {
      await updatePrefs.mutateAsync({
        certificationIds: Array.from(selectedCertIds),
        brands: selectedBrands.map((name, i) => ({ name, priority: i + 1 })),
        mealsPerDay,
        daysPerWeek,
      });
      toast({ title: "Preferences saved!", description: "Your grocery preferences have been updated." });
      router.push("/grocery-list");
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    }
  };

  // Slider values
  const sliderValue = activeFreqControl === "meals" ? mealsPerDay : daysPerWeek;
  const sliderMax = activeFreqControl === "meals" ? 5 : 7;
  const sliderLabels =
    activeFreqControl === "meals"
      ? ["1 Meal", "3 Meals", "5 Meals"]
      : ["1 Day", "4 Days", "7 Days"];

  if (certsLoading || prefsLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] flex flex-col items-center justify-center gap-3">
        <div
          className="w-8 h-8 border-[3px] border-[#E2E8F0] border-t-[#99CC33] rounded-full animate-spin"
        />
        <p className="text-[14px] text-[#64748B]" style={{ fontFamily: "Inter, sans-serif" }}>
          Loading preferences...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F6] pb-[140px] lg:pb-8">
      <div className="w-full max-w-[600px] mx-auto px-4 md:px-6">

        {/* ── Header (matches meal-plan pattern) ───────────────────── */}
        <header className="flex items-center gap-3 pt-6 pb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-full hover:bg-[#F1F5F9] transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-[#0F172A]" />
          </button>
          <h1
            className="text-[20px] lg:text-[24px] font-bold text-[#0F172A]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Quality & Brands
          </h1>
        </header>

        {/* ── Ingredient Quality (Toggle switches) ────────────────── */}
        <section className="mb-7">
          <h3
            className="text-[15px] font-bold text-[#0F172A] flex items-center gap-1.5 mb-4"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            🏷️ Ingredient Quality
          </h3>

          <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
            {displayedCerts.map((cert, idx) => {
              const isSelected = selectedCertIds.has(cert.id);
              const icon = CERT_ICONS[cert.category ?? ""] || "🏷️";
              return (
                <div
                  key={cert.id}
                  className="flex items-center justify-between px-4 py-3.5"
                  style={{
                    borderBottom: idx < displayedCerts.length - 1
                      ? "1px solid #F1F5F9" : "none",
                    background: isSelected ? "rgba(153,204,51,0.05)" : "#fff",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[18px]">{icon}</span>
                    <span
                      className="text-[14px] font-medium text-[#0F172A]"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {cert.name}
                    </span>
                  </div>
                  <ToggleSwitch checked={isSelected} onChange={() => toggleCert(cert.id)} />
                </div>
              );
            })}
          </div>

          {/* Show More / Less */}
          {!showAllCerts && tier2.length > 0 && (
            <button
              onClick={() => setShowAllCerts(true)}
              className="w-full mt-2.5 py-2.5 bg-transparent border-2 border-dashed border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B] hover:border-[#99CC33] hover:text-[#6B8F24] transition-colors cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Show More + ({tier2.length} more)
            </button>
          )}
          {showAllCerts && (
            <button
              onClick={() => setShowAllCerts(false)}
              className="w-full mt-2.5 py-2.5 bg-transparent border-2 border-dashed border-[#E2E8F0] rounded-xl text-[13px] text-[#64748B] hover:border-[#99CC33] hover:text-[#6B8F24] transition-colors cursor-pointer"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Show Less −
            </button>
          )}
        </section>

        {/* ── Preferred Brands ─────────────────────────────────────── */}
        <section className="mb-7 pb-5 border-b border-[#F1F5F9]">
          <h3
            className="text-[15px] font-bold text-[#0F172A] flex items-center gap-1.5 mb-3"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            🏪 Preferred Brands
          </h3>

          <div className="relative mb-3">
            <div className="flex items-center gap-2 px-3.5 py-2.5 border border-[#E2E8F0] rounded-xl bg-white">
              <span className="text-[14px] text-[#94A3B8]">🔍</span>
              <input
                type="text"
                placeholder="Search brands (e.g. Annie's, Horizon)"
                value={brandQuery}
                onChange={(e) => setBrandQuery(e.target.value)}
                className="flex-1 border-none outline-none text-[14px] text-[#0F172A] bg-transparent placeholder:text-[#94A3B8]"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {brandQuery.length >= 2 && brandSuggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-[#E2E8F0] rounded-xl mt-1 p-1 list-none max-h-[200px] overflow-y-auto z-10 shadow-md">
                {brandSuggestions
                  .filter((b) => !selectedBrands.includes(b))
                  .slice(0, 8)
                  .map((brand) => (
                    <li
                      key={brand}
                      onClick={() => addBrand(brand)}
                      className="px-3 py-2 rounded-lg cursor-pointer text-[14px] text-[#374151] hover:bg-[rgba(153,204,51,0.08)]"
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      {brand}
                    </li>
                  ))}
              </ul>
            )}
            {brandQuery.length >= 2 && !brandsLoading && brandSuggestions.length === 0 && (
              <p className="text-[13px] text-[#94A3B8] mt-2">No brands found.</p>
            )}
          </div>

          {selectedBrands.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedBrands.map((brand) => (
                <span
                  key={brand}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F7F8F6] border border-[#E2E8F0] rounded-full text-[13px] text-[#0F172A] font-medium"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {brand}
                  <button
                    onClick={() => removeBrand(brand)}
                    className="bg-transparent border-none text-[15px] text-[#94A3B8] cursor-pointer p-0 leading-none hover:text-[#ef4444]"
                  >
                    ×
                  </button>
                </span>
              ))}
              <span
                className="inline-flex items-center px-3 py-1.5 bg-transparent border border-dashed border-[#E2E8F0] rounded-full text-[13px] text-[#64748B] cursor-pointer"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                + View More
              </span>
            </div>
          )}
        </section>

        {/* ── Meal Frequency ───────────────────────────────────────── */}
        <section className="mb-7 pb-5 border-b border-[#F1F5F9]">
          <h3
            className="text-[15px] font-bold text-[#0F172A] flex items-center gap-1.5 mb-2"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            🍽️ Meal Frequency
          </h3>
          <p className="text-[13px] text-[#64748B] mb-3.5" style={{ fontFamily: "Inter, sans-serif" }}>
            How many meals are you planning for?
          </p>

          {/* Box selectors — both clickable */}
          <div className="grid grid-cols-2 gap-3 mb-3.5">
            <button
              type="button"
              onClick={() => setActiveFreqControl("meals")}
              className="py-4 px-3 rounded-xl text-center transition-all cursor-pointer"
              style={{
                border: activeFreqControl === "meals" ? "2px solid #99CC33" : "1px solid #E2E8F0",
                background: activeFreqControl === "meals" ? "rgba(153,204,51,0.08)" : "#fff",
              }}
            >
              <div
                className="text-[28px] font-bold leading-tight"
                style={{
                  color: activeFreqControl === "meals" ? "#99CC33" : "#475569",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {mealsPerDay}
              </div>
              <div className="text-[12px] text-[#64748B] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                Meals / Day
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActiveFreqControl("days")}
              className="py-4 px-3 rounded-xl text-center transition-all cursor-pointer"
              style={{
                border: activeFreqControl === "days" ? "2px solid #99CC33" : "1px solid #E2E8F0",
                background: activeFreqControl === "days" ? "rgba(153,204,51,0.08)" : "#fff",
              }}
            >
              <div
                className="text-[28px] font-bold leading-tight"
                style={{
                  color: activeFreqControl === "days" ? "#99CC33" : "#475569",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {daysPerWeek}
              </div>
              <div className="text-[12px] text-[#64748B] font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
                Days / Week
              </div>
            </button>
          </div>

          {/* Slider controls the active box */}
          <div className="relative">
            <input
              type="range"
              min={1}
              max={sliderMax}
              value={sliderValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (activeFreqControl === "meals") setMealsPerDay(val);
                else setDaysPerWeek(val);
              }}
              className="w-full"
              style={{ accentColor: "#99CC33", height: 6 }}
            />
            <div className="flex justify-between mt-0.5">
              {sliderLabels.map((label) => (
                <span
                  key={label}
                  className="text-[11px] text-[#94A3B8] font-medium uppercase"
                  style={{ fontFamily: "Inter, sans-serif" }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Save Preferences CTA ─────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSave}
          disabled={updatePrefs.isPending}
          className="w-full py-4 rounded-xl text-[16px] font-bold text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            fontFamily: "Inter, sans-serif",
            background: updatePrefs.isPending ? "#c4c4c4" : "#99CC33",
            boxShadow: "0 2px 10px rgba(153,204,51,0.3)",
          }}
          onMouseEnter={(e) => {
            if (!updatePrefs.isPending) e.currentTarget.style.background = "#6B8F24";
          }}
          onMouseLeave={(e) => {
            if (!updatePrefs.isPending) e.currentTarget.style.background = "#99CC33";
          }}
        >
          {updatePrefs.isPending ? "Saving..." : "Save Preferences ✓"}
        </button>

      </div>
    </div>
  );
}
