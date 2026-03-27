"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useHouseholdPreferences, useSetPreference, useDeletePreference } from "@/hooks/use-household";
import { useToast } from "@/hooks/use-toast";

const PREFERENCE_TYPES = [
  { section: "Shopping Preferences", items: [
    { type: "prefer_organic", label: "Prefer Organic" },
    { type: "prefer_local", label: "Prefer Local" },
    { type: "budget_conscious", label: "Budget Conscious" },
  ]},
  { section: "Meal Preferences", items: [
    { type: "quick_meals", label: "Quick Meals (<30 min)" },
    { type: "batch_cooking", label: "Batch Cooking" },
    { type: "leftovers_friendly", label: "Leftovers Friendly" },
  ]},
  { section: "Cooking Style", items: [
    { type: "minimal_ingredients", label: "Minimal Ingredients" },
    { type: "kid_friendly", label: "Kid Friendly" },
    { type: "meal_prep", label: "Meal Prep Ready" },
  ]},
];

export default function PreferencesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { preferences, isLoading } = useHouseholdPreferences();
  const setPref = useSetPreference();
  const deletePref = useDeletePreference();

  const isEnabled = (type: string) =>
    preferences.some((p) => p.preferenceType === type && p.preferenceValue === "true");

  const prefId = (type: string) =>
    preferences.find((p) => p.preferenceType === type)?.id;

  const handleToggle = async (type: string) => {
    try {
      if (isEnabled(type)) {
        const id = prefId(type);
        if (id) await deletePref.mutateAsync(id);
      } else {
        await setPref.mutateAsync({ preferenceType: type, preferenceValue: "true" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update preference", variant: "destructive" });
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <button onClick={() => router.push("/profile/family")} style={backBtnStyle}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>Household Preferences</h1>
      </div>
      <p style={{ color: "#999", fontSize: 14, marginBottom: 24, paddingLeft: 48 }}>
        These preferences apply to everyone in your household.
      </p>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 48 }}>
          <div style={{ width: 36, height: 36, border: "3px solid #99CC33", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : (
        PREFERENCE_TYPES.map((section) => (
          <div key={section.section} style={{ ...cardStyle, marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1A1A2E", marginBottom: 12, marginTop: 0 }}>
              {section.section}
            </h3>
            {section.items.map((item) => (
              <div key={item.type} style={toggleRowStyle}>
                <span style={{ fontSize: 14, color: "#333" }}>{item.label}</span>
                <button
                  onClick={() => handleToggle(item.type)}
                  disabled={setPref.isPending || deletePref.isPending}
                  style={{
                    ...toggleStyle,
                    background: isEnabled(item.type) ? "#99CC33" : "#E0E0E0",
                    justifyContent: isEnabled(item.type) ? "flex-end" : "flex-start",
                  }}
                >
                  <div style={toggleKnobStyle} />
                </button>
              </div>
            ))}
          </div>
        ))
      )}

      <p style={{ textAlign: "center", color: "#999", fontSize: 12, marginTop: 8 }}>
        Changes are saved automatically.
      </p>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const backBtnStyle: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#1A1A2E", padding: 4 };
const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: 20, border: "1px solid #F0F0F0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const toggleRowStyle: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "12px 0", borderBottom: "1px solid #F5F5F5",
};
const toggleStyle: React.CSSProperties = {
  width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
  display: "flex", alignItems: "center", padding: "0 3px", transition: "all 0.2s",
};
const toggleKnobStyle: React.CSSProperties = {
  width: 20, height: 20, borderRadius: "50%", background: "white",
  boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "all 0.2s",
};
