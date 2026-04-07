"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAddMember, useUpdateMemberHealth } from "@/hooks/use-household";
import { useTaxonomyAllergens, useTaxonomyDiets, useTaxonomyConditions, useTaxonomyCuisines } from "@/hooks/use-taxonomy";
import { useToast } from "@/hooks/use-toast";
import { displayLabel } from "@/lib/taxonomy";
import { ArrowLeft, UserPlus, Heart, Check, X } from "lucide-react";

const HEALTH_GOALS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "maintain_weight", label: "Maintain Weight" },
  { value: "gain_weight", label: "Gain Weight" },
  { value: "build_muscle", label: "Build Muscle" },
  { value: "improve_health", label: "Improve Overall Health" },
  { value: "manage_condition", label: "Manage Health Condition" },
];

export default function AddFamilyMemberPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addMember = useAddMember();
  const updateHealth = useUpdateMemberHealth();

  // Taxonomy data for Step 2
  const { data: allergenOptions = [] } = useTaxonomyAllergens();
  const { data: dietOptions = [] } = useTaxonomyDiets();
  const { data: conditionOptions = [] } = useTaxonomyConditions();
  const { data: cuisineOptions = [] } = useTaxonomyCuisines();

  // Wizard state
  const [wizardStep, setWizardStep] = useState(1);
  const [newMemberId, setNewMemberId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");

  // Step 1 — Basic info
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    householdRole: "secondary_adult",
  });
  const [error, setError] = useState("");

  // Step 2 — Health profile
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [healthGoal, setHealthGoal] = useState("");
  const [dislikedInput, setDislikedInput] = useState("");
  const [dislikedList, setDislikedList] = useState<string[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedDiets, setSelectedDiets] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const addDisliked = () => {
    const trimmed = dislikedInput.trim();
    if (trimmed && !dislikedList.includes(trimmed)) {
      setDislikedList([...dislikedList, trimmed]);
    }
    setDislikedInput("");
  };

  const removeDisliked = (item: string) => {
    setDislikedList(dislikedList.filter((d) => d !== item));
  };

  // Step 1 submit
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    try {
      const result = await addMember.mutateAsync({
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender || undefined,
        householdRole: form.householdRole || undefined,
      });
      const memberId = (result as any)?.member?.id || (result as any)?.id;
      setNewMemberId(memberId || null);
      setNewMemberName(form.fullName.trim());
      setWizardStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    }
  };

  // Step 2 submit
  const handleStep2Save = async () => {
    if (!newMemberId) {
      toast({ title: "Error", description: "Member ID not found", variant: "destructive" });
      router.push("/profile/family");
      return;
    }

    try {
      await updateHealth.mutateAsync({
        memberId: newMemberId,
        data: {
          targetCalories: calories ? parseInt(calories, 10) : undefined,
          targetProteinG: protein ? parseFloat(protein) : undefined,
          targetCarbsG: carbs ? parseFloat(carbs) : undefined,
          targetFatG: fat ? parseFloat(fat) : undefined,
          healthGoal: healthGoal || undefined,
          dislikedIngredients: dislikedList.length > 0 ? dislikedList : undefined,
          allergenIds: selectedAllergens.length > 0 ? selectedAllergens : undefined,
          dietIds: selectedDiets.length > 0 ? selectedDiets : undefined,
          conditionIds: selectedConditions.length > 0 ? selectedConditions : undefined,
          cuisineIds: selectedCuisines.length > 0 ? selectedCuisines : undefined,
        },
      });
      toast({ title: "Member added", description: `${newMemberName}'s health profile saved.` });
    } catch {
      toast({ title: "Warning", description: "Member added but health profile save failed. You can edit it later.", variant: "destructive" });
    }
    router.push("/profile/family");
  };

  const handleSkip = () => {
    toast({ title: "Member added", description: `${newMemberName} added. You can set up their health profile later.` });
    router.push("/profile/family");
  };

  return (
    <div className="add-member-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => wizardStep === 1 ? router.back() : setWizardStep(1)}>
          <ArrowLeft size={20} />
        </button>
        <h1>{wizardStep === 1 ? "Add Family Member" : "Health Profile"}</h1>
      </div>

      {/* Progress indicator */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: wizardStep === 1 ? "50%" : "100%" }} />
      </div>
      <p className="step-indicator">Step {wizardStep} of 2</p>

      {/* ═══════ Step 1: Basic Info ═══════ */}
      {wizardStep === 1 && (
        <>
          <p className="helper-text">
            Use this to add children or dependents who don&apos;t have their own account.
            To add an adult with their own account, use <strong>Invite</strong> instead.
          </p>

          <form onSubmit={handleStep1Submit} className="member-form">
            <div className="form-card">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Enter full name"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="form-group">
                  <label>Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={form.householdRole}
                  onChange={(e) => setForm({ ...form, householdRole: e.target.value })}
                >
                  <option value="secondary_adult">Secondary Adult</option>
                  <option value="child">Child</option>
                  <option value="dependent">Dependent</option>
                </select>
              </div>
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button
              type="submit"
              className="submit-btn"
              disabled={addMember.isPending || !form.fullName.trim()}
            >
              <UserPlus size={18} />
              {addMember.isPending ? "Adding..." : "Next — Set Health Profile"}
            </button>
          </form>
        </>
      )}

      {/* ═══════ Step 2: Health Profile ═══════ */}
      {wizardStep === 2 && (
        <div className="member-form">
          <p className="helper-text">
            Set up <strong>{newMemberName}</strong>&apos;s health profile for personalized recommendations.
          </p>

          {/* Health Goals */}
          <div className="form-card">
            <h3 className="card-title">Health Goal</h3>
            <div className="form-group">
              <select
                value={healthGoal}
                onChange={(e) => setHealthGoal(e.target.value)}
              >
                <option value="">Select a goal...</option>
                {HEALTH_GOALS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Nutrition Targets */}
          <div className="form-card">
            <h3 className="card-title">Nutrition Targets</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Daily Calories</label>
                <div className="input-with-unit">
                  <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="2000" />
                  <span className="unit">cal</span>
                </div>
              </div>
              <div className="form-group">
                <label>Protein</label>
                <div className="input-with-unit">
                  <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="100" />
                  <span className="unit">g</span>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Carbs</label>
                <div className="input-with-unit">
                  <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="200" />
                  <span className="unit">g</span>
                </div>
              </div>
              <div className="form-group">
                <label>Fat</label>
                <div className="input-with-unit">
                  <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="60" />
                  <span className="unit">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Preferred Cuisines */}
          <div className="form-card">
            <h3 className="card-title">Preferred Cuisines</h3>
            <div className="chip-grid">
              {cuisineOptions.map((c: any) => {
                const id = c.gold_id || c.id;
                const selected = selectedCuisines.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`chip ${selected ? "chip-selected" : ""}`}
                    onClick={() => toggleItem(selectedCuisines, setSelectedCuisines, id)}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                    {c.name}
                  </button>
                );
              })}
              {cuisineOptions.length === 0 && <p className="loading-text">Loading cuisines…</p>}
            </div>
          </div>

          {/* Allergens */}
          <div className="form-card">
            <h3 className="card-title">Allergens</h3>
            <div className="chip-grid">
              {allergenOptions.map((a: any) => {
                const id = a.gold_id || a.id;
                const selected = selectedAllergens.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`chip ${selected ? "chip-selected" : ""}`}
                    onClick={() => toggleItem(selectedAllergens, setSelectedAllergens, id)}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                    {a.name && displayLabel(a.name)}
                  </button>
                );
              })}
              {allergenOptions.length === 0 && <p className="loading-text">Loading allergens…</p>}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="form-card">
            <h3 className="card-title">Dietary Preferences</h3>
            <div className="chip-grid">
              {dietOptions.map((d: any) => {
                const id = d.gold_id || d.id;
                const selected = selectedDiets.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`chip ${selected ? "chip-selected" : ""}`}
                    onClick={() => toggleItem(selectedDiets, setSelectedDiets, id)}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                    {d.name && displayLabel(d.name)}
                  </button>
                );
              })}
              {dietOptions.length === 0 && <p className="loading-text">Loading diets…</p>}
            </div>
          </div>

          {/* Health Conditions */}
          <div className="form-card">
            <h3 className="card-title">Health Conditions</h3>
            <div className="chip-grid">
              {conditionOptions.map((c: any) => {
                const id = c.gold_id || c.id;
                const selected = selectedConditions.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    className={`chip ${selected ? "chip-selected" : ""}`}
                    onClick={() => toggleItem(selectedConditions, setSelectedConditions, id)}
                  >
                    {selected && <Check size={14} strokeWidth={3} />}
                    {c.name && displayLabel(c.name)}
                  </button>
                );
              })}
              {conditionOptions.length === 0 && <p className="loading-text">Loading conditions…</p>}
            </div>
          </div>

          {/* Disliked Ingredients */}
          <div className="form-card">
            <h3 className="card-title">Disliked Ingredients</h3>
            <div className="disliked-input-row">
              <input
                type="text"
                value={dislikedInput}
                onChange={(e) => setDislikedInput(e.target.value)}
                placeholder="e.g. cilantro, olives..."
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDisliked(); } }}
              />
              <button type="button" className="add-disliked-btn" onClick={addDisliked}>Add</button>
            </div>
            {dislikedList.length > 0 && (
              <div className="chip-grid" style={{ marginTop: 10 }}>
                {dislikedList.map((item) => (
                  <span key={item} className="chip chip-selected disliked-chip">
                    {item}
                    <button type="button" className="remove-chip" onClick={() => removeDisliked(item)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* CTAs */}
          <button
            type="button"
            className="submit-btn"
            onClick={handleStep2Save}
            disabled={updateHealth.isPending}
          >
            <Heart size={18} />
            {updateHealth.isPending ? "Saving..." : "Save Health Profile"}
          </button>

          <button
            type="button"
            className="skip-btn"
            onClick={handleSkip}
          >
            Skip for now
          </button>
        </div>
      )}

      <style jsx>{`
        .add-member-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 0 16px 100px;
        }
        .page-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 0 12px;
        }
        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #333;
        }
        .page-header h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1A1A2E;
        }
        .progress-bar-container {
          height: 4px;
          background: #E2E8F0;
          border-radius: 4px;
          margin-bottom: 4px;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: #99CC33;
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .step-indicator {
          font-size: 12px;
          color: #94A3B8;
          font-weight: 600;
          margin: 0 0 16px;
        }
        .member-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #F0F0F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .card-title {
          font-size: 15px;
          font-weight: 700;
          color: #1A1A2E;
          margin: 0;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .form-group label {
          font-size: 13px;
          font-weight: 600;
          color: #555;
        }
        .form-group input,
        .form-group select {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          font-size: 14px;
          font-family: inherit;
          color: #333;
          background: #FAFAFA;
          transition: border-color 0.2s;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #99CC33;
          background: white;
        }
        .form-row {
          display: flex;
          gap: 12px;
          overflow: hidden;
        }
        .form-row .form-group {
          min-width: 0;
        }
        .input-with-unit {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }
        .input-with-unit input {
          flex: 1;
          min-width: 0;
          padding: 10px 8px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          font-size: 14px;
          font-family: inherit;
          color: #333;
          background: #FAFAFA;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-with-unit input:focus {
          border-color: #99CC33;
          background: white;
        }
        .unit {
          font-size: 12px;
          color: #999;
          min-width: 16px;
          flex-shrink: 0;
        }
        .chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          border: 1px solid #E0E0E0;
          background: #F5F5F5;
          color: #333;
          font-family: inherit;
        }
        .chip:hover {
          border-color: #99CC33;
        }
        .chip-selected {
          background: #99CC33;
          color: white;
          border-color: #99CC33;
        }
        .disliked-chip {
          cursor: default;
        }
        .disliked-chip:hover {
          background: #88BB22;
        }
        .remove-chip {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 0;
          margin-left: 2px;
          opacity: 0.8;
        }
        .remove-chip:hover {
          opacity: 1;
        }
        .disliked-input-row {
          display: flex;
          gap: 8px;
        }
        .disliked-input-row input {
          flex: 1;
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          font-size: 14px;
          font-family: inherit;
          color: #333;
          background: #FAFAFA;
          outline: none;
          transition: border-color 0.2s;
        }
        .disliked-input-row input:focus {
          border-color: #99CC33;
          background: white;
        }
        .add-disliked-btn {
          padding: 10px 18px;
          border-radius: 10px;
          border: 1px solid #99CC33;
          background: white;
          color: #99CC33;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .add-disliked-btn:hover {
          background: #99CC33;
          color: white;
        }
        .loading-text {
          color: #999;
          font-size: 13px;
          margin: 0;
        }
        .error-msg {
          padding: 10px 14px;
          border-radius: 10px;
          background: #FFF5F5;
          border: 1px solid #FFE0E0;
          color: #E74C3C;
          font-size: 13px;
        }
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: #99CC33;
          color: white;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .submit-btn:hover:not(:disabled) { background: #88BB22; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .skip-btn {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          background: white;
          color: #64748B;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .skip-btn:hover {
          border-color: #CBD5E1;
          color: #334155;
        }
        .helper-text {
          font-size: 13px;
          color: #888;
          line-height: 1.5;
          margin: -4px 0 8px;
          padding: 0 4px;
        }
      `}</style>
    </div>
  );
}
