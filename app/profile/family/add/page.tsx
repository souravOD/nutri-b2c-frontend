"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAddMember } from "@/hooks/use-household";
import { ArrowLeft, UserPlus } from "lucide-react";

export default function AddFamilyMemberPage() {
  const router = useRouter();
  const addMember = useAddMember();
  const [form, setForm] = useState({
    fullName: "",
    firstName: "",
    age: "",
    gender: "",
    householdRole: "secondary_adult",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.fullName.trim()) {
      setError("Full name is required");
      return;
    }

    try {
      await addMember.mutateAsync({
        fullName: form.fullName.trim(),
        firstName: form.firstName.trim() || undefined,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        householdRole: form.householdRole || undefined,
      });
      router.push("/profile/family");
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    }
  };

  return (
    <div className="add-member-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Add Family Member</h1>
      </div>

      <form onSubmit={handleSubmit} className="member-form">
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
            <label>First Name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Enter first name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="Age"
                min={0}
                max={150}
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

          <div className="form-group">
            <label>Role</label>
            <select
              value={form.householdRole}
              onChange={(e) => setForm({ ...form, householdRole: e.target.value })}
            >
              <option value="primary_adult">Primary Adult</option>
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
          {addMember.isPending ? "Adding..." : "Add Member"}
        </button>
      </form>

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
          padding: 20px 0 24px;
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
          gap: 16px;
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
      `}</style>
    </div>
  );
}
