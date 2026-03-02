"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
    });

    useEffect(() => {
        async function load() {
            try {
                const res = await authFetch("/api/v1/me/profile");
                const data = await res.json();
                setForm({
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phone: data.phone || "",
                    dateOfBirth: data.dateOfBirth || "",
                    gender: data.gender || "",
                });
            } catch (err) {
                console.error("Failed to load profile", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setSaving(true);

        try {
            await authFetch("/api/v1/me/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    fullName: form.fullName || null,
                    email: form.email || null,
                    phone: form.phone || null,
                    dateOfBirth: form.dateOfBirth || null,
                    gender: form.gender || null,
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
        <div className="edit-profile-page">
            <div className="page-header">
                <button className="back-btn" onClick={() => router.back()}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Edit Profile</h1>
            </div>

            <form onSubmit={handleSave} className="edit-form">
                <div className="form-card">
                    <div className="form-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone</label>
                        <input
                            type="tel"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="Enter phone number"
                        />
                    </div>

                    <div className="form-row">
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
                    </div>
                </div>

                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">Profile saved! Redirecting...</div>}

                <button type="submit" className="save-btn" disabled={saving}>
                    <Save size={18} />
                    {saving ? "Saving..." : "Save Changes"}
                </button>
            </form>

            <style jsx>{`
        .edit-profile-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 0 16px 100px;
        }
        .page-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 0 24px;
        }
        .back-btn {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid #E0E0E0; background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #333;
        }
        .page-header h1 {
          margin: 0; font-size: 22px; font-weight: 700; color: #1A1A2E;
        }
        .edit-form {
          display: flex; flex-direction: column; gap: 16px;
        }
        .form-card {
          background: white; border-radius: 16px; padding: 24px;
          border: 1px solid #F0F0F0; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          display: flex; flex-direction: column; gap: 20px;
        }
        .form-group {
          display: flex; flex-direction: column; gap: 6px; flex: 1;
        }
        .form-group label {
          font-size: 13px; font-weight: 600; color: #555;
        }
        .form-group input, .form-group select {
          padding: 10px 14px; border-radius: 10px;
          border: 1px solid #E0E0E0; font-size: 14px;
          font-family: inherit; color: #333; background: #FAFAFA;
          transition: border-color 0.2s;
        }
        .form-group input:focus, .form-group select:focus {
          outline: none; border-color: #99CC33; background: white;
        }
        .form-row {
          display: flex; gap: 16px;
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
