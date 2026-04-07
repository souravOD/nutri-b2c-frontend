"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useHouseholdMembers, useUpdateMemberHealth } from "@/hooks/use-household";
import { useTaxonomyAllergens, useTaxonomyDiets, useTaxonomyConditions } from "@/hooks/use-taxonomy";
import { useToast } from "@/hooks/use-toast";
import { displayLabel } from "@/lib/taxonomy";

export default function EditHealthPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const memberId = params.memberId as string;

  const { members, isLoading: membersLoading } = useHouseholdMembers();
  const updateHealth = useUpdateMemberHealth();
  const { data: allergens = [] } = useTaxonomyAllergens();
  const { data: diets = [] } = useTaxonomyDiets();
  const { data: conditions = [] } = useTaxonomyConditions();

  const member = members.find((m) => m.id === memberId);
  const hp = member?.healthProfile;

  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (hp) {
      setCalories(hp.targetCalories?.toString() ?? "");
      setProtein(hp.targetProteinG?.toString() ?? "");
      setCarbs(hp.targetCarbsG?.toString() ?? "");
      setFat(hp.targetFatG?.toString() ?? "");
      setSelectedAllergens(hp.allergens?.map((a: any) => a.id || a.gold_id) ?? []);
      setSelectedDiets(hp.diets?.map((d: any) => d.id || d.gold_id) ?? []);
      setSelectedConditions(hp.conditions?.map((c: any) => c.id || c.gold_id) ?? []);
    }
  }, [hp]);

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    id: string
  ) => {
    setDirty(true);
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleSave = async () => {
    try {
      await updateHealth.mutateAsync({
        memberId,
        data: {
          targetCalories: calories ? parseInt(calories, 10) : undefined,
          targetProteinG: protein ? parseFloat(protein) : undefined,
          targetCarbsG: carbs ? parseFloat(carbs) : undefined,
          targetFatG: fat ? parseFloat(fat) : undefined,
          allergenIds: selectedAllergens.length > 0 ? selectedAllergens : undefined,
          dietIds: selectedDiets.length > 0 ? selectedDiets : undefined,
          conditionIds: selectedConditions.length > 0 ? selectedConditions : undefined,
        },
      });
      setDirty(false);
      toast({ title: "Saved", description: "Health profile updated" });
      router.push(`/profile/family/${memberId}`);
    } catch {
      toast({ title: "Error", description: "Failed to save health profile", variant: "destructive" });
    }
  };

  if (membersLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ width: 36, height: 36, border: "3px solid #99CC33", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!member) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <h2 style={{ color: "#1A1A2E", fontSize: 20 }}>Member not found</h2>
        <button onClick={() => router.push("/profile/family")} style={{ color: "#99CC33", background: "none", border: "none", cursor: "pointer", marginTop: 12 }}>
          ← Back to Family
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push(`/profile/family/${memberId}`)} style={backBtnStyle}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E", margin: 0 }}>Edit Health Profile</h1>
          <p style={{ fontSize: 13, color: "#999", margin: 0 }}>for {member.fullName}</p>
        </div>
      </div>

      {/* Nutrition Targets */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>Nutrition Targets</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px" }}>
          <div>
            <label style={labelStyle}>Daily Calories</label>
            <div style={inputGroupStyle}>
              <input style={inputStyle} type="number" value={calories} onChange={(e) => { setCalories(e.target.value); setDirty(true); }} />
              <span style={unitStyle}>cal</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Protein</label>
            <div style={inputGroupStyle}>
              <input style={inputStyle} type="number" value={protein} onChange={(e) => { setProtein(e.target.value); setDirty(true); }} />
              <span style={unitStyle}>g</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Carbs</label>
            <div style={inputGroupStyle}>
              <input style={inputStyle} type="number" value={carbs} onChange={(e) => { setCarbs(e.target.value); setDirty(true); }} />
              <span style={unitStyle}>g</span>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Fat</label>
            <div style={inputGroupStyle}>
              <input style={inputStyle} type="number" value={fat} onChange={(e) => { setFat(e.target.value); setDirty(true); }} />
              <span style={unitStyle}>g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Allergens */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={cardTitleStyle}>Allergens</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {allergens.map((a: any) => {
            const id = a.gold_id || a.id;
            const selected = selectedAllergens.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleItem(selectedAllergens, setSelectedAllergens, id)}
                style={{
                  ...chipStyle,
                  background: selected ? "#99CC33" : "#F5F5F5",
                  color: selected ? "white" : "#333",
                  border: selected ? "1px solid #99CC33" : "1px solid #E0E0E0",
                }}
              >
                {displayLabel(a.name)}
              </button>
            );
          })}
          {allergens.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Loading allergens…</p>}
        </div>
      </div>

      {/* Dietary Preferences */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={cardTitleStyle}>Dietary Preferences</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {diets.map((d: any) => {
            const id = d.gold_id || d.id;
            const selected = selectedDiets.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleItem(selectedDiets, setSelectedDiets, id)}
                style={{
                  ...chipStyle,
                  background: selected ? "#99CC33" : "#F5F5F5",
                  color: selected ? "white" : "#333",
                  border: selected ? "1px solid #99CC33" : "1px solid #E0E0E0",
                }}
              >
                {displayLabel(d.name)}
              </button>
            );
          })}
          {diets.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Loading diets…</p>}
        </div>
      </div>

      {/* Health Conditions */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={cardTitleStyle}>Health Conditions</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {conditions.map((c: any) => {
            const id = c.gold_id || c.id;
            const selected = selectedConditions.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleItem(selectedConditions, setSelectedConditions, id)}
                style={{
                  ...chipStyle,
                  background: selected ? "#99CC33" : "#F5F5F5",
                  color: selected ? "white" : "#333",
                  border: selected ? "1px solid #99CC33" : "1px solid #E0E0E0",
                }}
              >
                {displayLabel(c.name)}
              </button>
            );
          })}
          {conditions.length === 0 && <p style={{ color: "#999", fontSize: 13 }}>Loading conditions…</p>}
        </div>
      </div>

      {/* Save */}
      <button
        disabled={!dirty || updateHealth.isPending}
        onClick={handleSave}
        style={{
          ...saveBtnStyle,
          opacity: dirty ? 1 : 0.5,
          cursor: dirty ? "pointer" : "not-allowed",
          marginTop: 24,
        }}
      >
        {updateHealth.isPending ? "Saving…" : <><Save size={16} /> Save Health Profile</>}
      </button>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const backBtnStyle: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#1A1A2E", padding: 4 };
const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: 20, border: "1px solid #F0F0F0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const cardTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#1A1A2E", marginBottom: 16, marginTop: 0 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 500, color: "#999", marginBottom: 4 };
const inputGroupStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 6 };
const inputStyle: React.CSSProperties = {
  flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #E0E0E0",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const unitStyle: React.CSSProperties = { fontSize: 13, color: "#999", minWidth: 24 };
const chipStyle: React.CSSProperties = {
  padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
  cursor: "pointer", transition: "all 0.15s",
};
const saveBtnStyle: React.CSSProperties = {
  width: "100%", padding: "14px 0", borderRadius: 12, border: "none",
  background: "#99CC33", color: "white", fontSize: 15, fontWeight: 600,
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
