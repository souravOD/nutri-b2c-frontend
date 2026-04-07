"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Heart } from "lucide-react";
import { useHouseholdMembers, useUpdateMemberBasicInfo } from "@/hooks/use-household";
import { useToast } from "@/hooks/use-toast";
import { displayLabel } from "@/lib/taxonomy";

// primary_adult is excluded — it can only be set via admin reassignment
const ROLE_OPTIONS = [
  { value: "secondary_adult", label: "Secondary Adult" },
  { value: "child", label: "Child" },
  { value: "dependent", label: "Dependent" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function calcAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const memberId = params.memberId as string;

  const { members, isLoading } = useHouseholdMembers();
  const updateBasic = useUpdateMemberBasicInfo();

  const member = members.find((m) => m.id === memberId);

  const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [manualAge, setManualAge] = useState<string>("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [dirty, setDirty] = useState(false);

  // Auto-calculate age from dateOfBirth
  const computedAge = useMemo(() => calcAge(member?.dateOfBirth), [member?.dateOfBirth]);
  const hasDoB = !!member?.dateOfBirth;

  useEffect(() => {
    if (member) {
      setFullName(member.fullName || "");
      setFirstName(member.firstName || "");
      setManualAge(
        hasDoB
          ? "" // age is auto-calculated
          : member.age != null
          ? String(member.age)
          : ""
      );
      setGender(member.gender || "");
      setRole(member.householdRole || "");
    }
  }, [member, hasDoB]);

  const displayAge = hasDoB ? computedAge : manualAge ? parseInt(manualAge, 10) : null;

  const handleFieldChange = (setter: (v: string) => void) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setter(e.target.value);
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateBasic.mutateAsync({
        memberId,
        data: {
          fullName: fullName || undefined,
          firstName: firstName || undefined,
          age: !hasDoB && manualAge ? parseInt(manualAge, 10) : undefined,
          gender: gender || undefined,
          householdRole: role || undefined,
        },
      });
      setDirty(false);
      toast({ title: "Saved", description: "Member info updated" });
    } catch {
      toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
    }
  };

  // Edit health: own profile → /profile/edit-health, others → /profile/family/{id}/edit-health
  const handleEditHealth = () => {
    if (member?.isProfileOwner) {
      router.push("/profile/edit-health");
    } else {
      router.push(`/profile/family/${memberId}/edit-health`);
    }
  };

  if (isLoading) {
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
        <button onClick={() => router.push("/profile/family")} style={linkStyle}>
          ← Back to Family
        </button>
      </div>
    );
  }

  const hp = member.healthProfile;
  const initials = (member.fullName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push("/profile/family")} style={backBtnStyle}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>Member Profile</h1>
      </div>

      {/* Avatar + Name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={avatarStyle}>{initials}</div>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E" }}>{member.fullName}</h2>
          <span style={roleBadgeStyle}>{member.householdRole?.replace(/_/g, " ")}</span>
          {displayAge != null && <span style={{ color: "#999", marginLeft: 8 }}>· {displayAge} yrs</span>}
        </div>
      </div>

      {/* Basic Info Card */}
      <div style={cardStyle}>
        <h3 style={cardTitleStyle}>Basic Information</h3>

        <label style={labelStyle}>Full Name</label>
        <input style={inputStyle} value={fullName} onChange={handleFieldChange(setFullName)} />

        <label style={labelStyle}>First Name</label>
        <input style={inputStyle} value={firstName} onChange={handleFieldChange(setFirstName)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Age {hasDoB && <span style={{ color: "#99CC33", fontSize: 11 }}>(auto)</span>}</label>
            {hasDoB ? (
              <div style={{ ...inputStyle, background: "#F9F9F9", color: "#666" }}>
                {computedAge ?? "—"} yrs (from DOB)
              </div>
            ) : (
              <input style={inputStyle} type="number" min="0" max="120" value={manualAge} onChange={handleFieldChange(setManualAge)} />
            )}
          </div>
          <div>
            <label style={labelStyle}>Gender</label>
            <select style={inputStyle} value={gender} onChange={handleFieldChange(setGender)}>
              <option value="">Select…</option>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <label style={labelStyle}>Role</label>
        {member.householdRole === "primary_adult" ? (
          <div style={{ ...inputStyle, background: "#F9F9F9", color: "#666" }}>
            Primary Adult (cannot change)
          </div>
        ) : (
          <select style={inputStyle} value={role} onChange={handleFieldChange(setRole)}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}

        <button disabled={!dirty || updateBasic.isPending} onClick={handleSave} style={{
          ...saveBtnStyle,
          opacity: dirty ? 1 : 0.5,
          cursor: dirty ? "pointer" : "not-allowed",
        }}>
          {updateBasic.isPending ? "Saving…" : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {/* Health Profile Card */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <h3 style={cardTitleStyle}>Health Profile</h3>
        {hp ? (
          <>
            {/* Body Metrics */}
            {(hp.heightCm || hp.weightKg || hp.activityLevel || hp.healthGoal) && (
              <div style={sectionStyle}>
                <div style={sectionLabel}>Body Metrics</div>
                <div style={gridStyle}>
                  {hp.heightCm && <div><span style={metaLabel}>Height</span><br />{hp.heightCm} cm</div>}
                  {hp.weightKg && <div><span style={metaLabel}>Weight</span><br />{hp.weightKg} kg</div>}
                  {hp.activityLevel && <div><span style={metaLabel}>Activity</span><br />{hp.activityLevel}</div>}
                  {hp.healthGoal && <div><span style={metaLabel}>Goal</span><br />{hp.healthGoal.replace(/_/g, " ")}</div>}
                </div>
              </div>
            )}

            {/* Nutrition Targets */}
            <div style={sectionStyle}>
              <div style={sectionLabel}>Nutrition Targets</div>
              <div style={gridStyle}>
                <div><span style={metaLabel}>Calories</span><br />{hp.targetCalories ?? "—"} cal/day</div>
                <div><span style={metaLabel}>Protein</span><br />{hp.targetProteinG ?? "—"} g</div>
                <div><span style={metaLabel}>Carbs</span><br />{hp.targetCarbsG ?? "—"} g</div>
                <div><span style={metaLabel}>Fat</span><br />{hp.targetFatG ?? "—"} g</div>
                {hp.targetFiberG && <div><span style={metaLabel}>Fiber</span><br />{hp.targetFiberG} g</div>}
                {hp.targetSugarG && <div><span style={metaLabel}>Sugar</span><br />{hp.targetSugarG} g</div>}
              </div>
            </div>

            {/* Allergens */}
            {hp.allergens?.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionLabel}>Allergens</div>
                <div style={chipContainerStyle}>
                  {hp.allergens.map((a) => (
                    <span key={a.id} style={chipStyle}>{displayLabel(a.name)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Diets */}
            {hp.diets?.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionLabel}>Dietary Preferences</div>
                <div style={chipContainerStyle}>
                  {hp.diets.map((d) => (
                    <span key={d.id} style={chipGreenStyle}>{displayLabel(d.name)}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Conditions */}
            {hp.conditions?.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionLabel}>Health Conditions</div>
                <div style={chipContainerStyle}>
                  {hp.conditions.map((c) => (
                    <span key={c.id} style={chipStyle}>{displayLabel(c.name)}</span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: "#999", fontSize: 14 }}>No health profile yet</p>
        )}
        <button onClick={handleEditHealth} style={editHealthBtnStyle}>
          <Heart size={16} /> Edit Health Profile →
        </button>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const linkStyle: React.CSSProperties = { color: "#99CC33", textDecoration: "none", marginTop: 12, display: "inline-block" };
const backBtnStyle: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#1A1A2E", padding: 4 };
const avatarStyle: React.CSSProperties = {
  width: 56, height: 56, borderRadius: "50%", background: "#F0F9E8", color: "#99CC33",
  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20,
};
const roleBadgeStyle: React.CSSProperties = {
  background: "#F0F9E8", color: "#99CC33", padding: "2px 10px", borderRadius: 20,
  fontSize: 12, fontWeight: 600, textTransform: "capitalize",
};
const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: 20, border: "1px solid #F0F0F0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const cardTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#1A1A2E", marginBottom: 16, marginTop: 0 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, color: "#666", marginBottom: 4, marginTop: 12 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0E0E0",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const saveBtnStyle: React.CSSProperties = {
  marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
  background: "#99CC33", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
const editHealthBtnStyle: React.CSSProperties = {
  marginTop: 16, width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid #99CC33",
  background: "transparent", color: "#99CC33", fontSize: 14, fontWeight: 600, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
};
const sectionStyle: React.CSSProperties = { marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid #F5F5F5" };
const sectionLabel: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#999", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 14 };
const metaLabel: React.CSSProperties = { color: "#999", fontSize: 12 };
const chipContainerStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 6 };
const chipStyle: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 16, background: "#FFF3E0", color: "#E65100",
  fontSize: 12, fontWeight: 500,
};
const chipGreenStyle: React.CSSProperties = {
  padding: "4px 10px", borderRadius: 16, background: "#F0F9E8", color: "#558B2F",
  fontSize: 12, fontWeight: 500,
};
