"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { displayLabel } from "@/lib/taxonomy";
import { ArrowLeft, Save, X } from "lucide-react";

interface HealthForm {
    heightCm: string;
    weightKg: string;
    activityLevel: string;
    healthGoal: string;
    targetCalories: string;
    dateOfBirth: string;
    gender: string;
}

interface TaxonomyItem {
    gold_id: string;
    code: string;
    name: string;
}

export default function EditHealthPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState<HealthForm>({
        heightCm: "",
        weightKg: "",
        activityLevel: "",
        healthGoal: "",
        targetCalories: "",
        dateOfBirth: "",
        gender: "",
    });

    // Current tags (string names displayed)
    const [currentAllergens, setCurrentAllergens] = useState<string[]>([]);
    const [currentDiets, setCurrentDiets] = useState<string[]>([]);
    const [currentConditions, setCurrentConditions] = useState<string[]>([]);

    // Taxonomy lists
    const [allergenList, setAllergenList] = useState<TaxonomyItem[]>([]);
    const [dietList, setDietList] = useState<TaxonomyItem[]>([]);
    const [conditionList, setConditionList] = useState<TaxonomyItem[]>([]);

    useEffect(() => {
        async function load() {
            try {
                const [hRes, aRes, dRes, cRes] = await Promise.all([
                    authFetch("/api/v1/me/health"),
                    authFetch("/api/v1/taxonomy/allergens"),
                    authFetch("/api/v1/taxonomy/dietary-preferences"),
                    authFetch("/api/v1/taxonomy/health-conditions"),
                ]);

                const health = await hRes.json();
                setForm({
                    heightCm: health.heightCm?.toString() || "",
                    weightKg: health.weightKg?.toString() || "",
                    activityLevel: health.activityLevel || "",
                    healthGoal: health.healthGoal || "",
                    targetCalories: health.targetCalories?.toString() || "",
                    dateOfBirth: health.dateOfBirth || "",
                    gender: health.gender || "",
                });

                setCurrentAllergens(health.allergens || []);
                setCurrentDiets(health.diets || []);
                setCurrentConditions(health.conditions || []);

                setAllergenList(await aRes.json());
                setDietList(await dRes.json());
                setConditionList(await cRes.json());
            } catch (err) {
                console.error("Failed to load health data", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const toggleTag = (
        list: string[],
        setList: React.Dispatch<React.SetStateAction<string[]>>,
        code: string
    ) => {
        setList((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setSaving(true);

        try {
            await authFetch("/api/v1/me/health", {
                method: "PATCH",
                body: JSON.stringify({
                    heightCm: form.heightCm ? parseFloat(form.heightCm) : null,
                    weightKg: form.weightKg ? parseFloat(form.weightKg) : null,
                    activityLevel: form.activityLevel || null,
                    healthGoal: form.healthGoal || null,
                    targetCalories: form.targetCalories ? parseInt(form.targetCalories) : null,
                    dateOfBirth: form.dateOfBirth || null,
                    gender: form.gender || null,
                    allergens: currentAllergens,
                    diets: currentDiets,
                    conditions: currentConditions,
                }),
            });
            setSuccess(true);
            setTimeout(() => router.push("/profile"), 1000);
        } catch (err: any) {
            setError(err.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
                <div style={{
                    width: 36, height: 36, border: "3px solid #E0E0E0",
                    borderTopColor: "#99CC33", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                }} />
            </div>
        );
    }

    return (
        <div className="edit-health-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Health & Dietary</h1>
            </div>

            <form onSubmit={handleSave} className="edit-form">
                {/* Body Metrics */}
                <div className="form-card">
                    <h3 className="card-title">Body Metrics</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Height (cm)</label>
                            <input type="number" step="0.1" value={form.heightCm}
                                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
                                placeholder="170" />
                        </div>
                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input type="number" step="0.1" value={form.weightKg}
                                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                                placeholder="70" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Activity Level</label>
                            <select value={form.activityLevel}
                                onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}>
                                <option value="">Select...</option>
                                <option value="sedentary">Sedentary</option>
                                <option value="lightly_active">Lightly Active</option>
                                <option value="moderately_active">Moderately Active</option>
                                <option value="very_active">Very Active</option>
                                <option value="extra_active">Extra Active</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Calorie Target</label>
                            <input type="number" value={form.targetCalories}
                                onChange={(e) => setForm({ ...form, targetCalories: e.target.value })}
                                placeholder="2000" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Health Goal</label>
                        <input type="text" value={form.healthGoal}
                            onChange={(e) => setForm({ ...form, healthGoal: e.target.value })}
                            placeholder="e.g., Lose weight, Build muscle" />
                    </div>
                </div>

                {/* Allergens */}
                <div className="form-card">
                    <h3 className="card-title">Allergens</h3>
                    <div className="tag-grid">
                        {allergenList.map((a) => (
                            <button
                                key={a.code}
                                type="button"
                                className={`tag-pill ${currentAllergens.includes(a.code) ? "active" : ""}`}
                                onClick={() => toggleTag(currentAllergens, setCurrentAllergens, a.code)}
                            >
                                {displayLabel(a.name)}
                                {currentAllergens.includes(a.code) && <X size={12} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dietary Preferences */}
                <div className="form-card">
                    <h3 className="card-title">Dietary Preferences</h3>
                    <div className="tag-grid">
                        {dietList.map((d) => (
                            <button
                                key={d.code}
                                type="button"
                                className={`tag-pill ${currentDiets.includes(d.code) ? "active" : ""}`}
                                onClick={() => toggleTag(currentDiets, setCurrentDiets, d.code)}
                            >
                                {displayLabel(d.name)}
                                {currentDiets.includes(d.code) && <X size={12} />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Health Conditions */}
                <div className="form-card">
                    <h3 className="card-title">Health Conditions</h3>
                    <div className="tag-grid">
                        {conditionList.map((c) => (
                            <button
                                key={c.code}
                                type="button"
                                className={`tag-pill ${currentConditions.includes(c.code) ? "active" : ""}`}
                                onClick={() => toggleTag(currentConditions, setCurrentConditions, c.code)}
                            >
                                {displayLabel(c.name)}
                                {currentConditions.includes(c.code) && <X size={12} />}
                            </button>
                        ))}
                    </div>
                </div>

                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">Health profile saved! Redirecting...</div>}

                <button type="submit" className="save-btn" disabled={saving}>
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </form>

            <style jsx>{`
        .edit-health-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 16px 100px;
        }
        .page-header {
          display: flex; align-items: center; gap: 12px; padding: 20px 0 24px;
        }
        .back-btn {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid #E0E0E0; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #333;
        }
        .page-header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #1A1A2E; }
        .edit-form {
          display: flex; flex-direction: column; gap: 16px;
        }
        .form-card {
          background: white; border-radius: 16px; padding: 20px;
          border: 1px solid #F0F0F0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex; flex-direction: column; gap: 16px;
        }
        .card-title {
          margin: 0; font-size: 15px; font-weight: 600; color: #1A1A2E;
        }
        .form-group {
          display: flex; flex-direction: column; gap: 6px; flex: 1;
        }
        .form-group label { font-size: 13px; font-weight: 600; color: #555; }
        .form-group input, .form-group select {
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid #E0E0E0; font-size: 14px;
          font-family: inherit; color: #333; background: #FAFAFA;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none; border-color: #99CC33; background: white;
        }
        .form-row { display: flex; gap: 16px; }
        .tag-grid {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .tag-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 20px;
          border: 1px solid #E0E0E0; background: white;
          color: #666; font-size: 13px; font-weight: 500;
          cursor: pointer; font-family: inherit; transition: all 0.2s;
        }
        .tag-pill:hover { border-color: #99CC33; color: #99CC33; }
        .tag-pill.active {
          background: #99CC33; border-color: #99CC33; color: white;
        }
        .error-msg {
          padding: 10px 14px; border-radius: 10px;
          background: #FFF5F5; border: 1px solid #FFE0E0;
          color: #E74C3C; font-size: 13px;
        }
        .success-msg {
          padding: 10px 14px; border-radius: 10px;
          background: #F0F9E8; border: 1px solid #D0E8B0;
          color: #5A8F1A; font-size: 13px;
        }
        .save-btn {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; width: 100%; padding: 14px; border-radius: 12px;
          border: none; background: #99CC33; color: white;
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.2s;
        }
        .save-btn:hover:not(:disabled) { background: #88BB22; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
        </div>
    );
}
