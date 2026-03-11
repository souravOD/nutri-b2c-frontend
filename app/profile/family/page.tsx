"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useHouseholdMembers, useDeleteMember } from "@/hooks/use-household";
import { ArrowLeft, Plus, Trash2, Users } from "lucide-react";

export default function FamilyHubPage() {
  const router = useRouter();
  const { household, members, isLoading } = useHouseholdMembers();
  const deleteMember = useDeleteMember();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = (memberId: string) => {
    deleteMember.mutate(memberId, {
      onSuccess: () => setConfirmDeleteId(null),
    });
  };

  return (
    <div className="family-hub-page">
      {/* Header */}
      <div className="family-header">
        <button className="back-btn" onClick={() => router.push("/profile")}>
          <ArrowLeft size={20} />
        </button>
        <div className="header-text">
          <h1>Family Members</h1>
          <p className="subtitle">{household?.householdName || "Your Household"}</p>
        </div>
        <button
          className="add-btn"
          onClick={() => router.push("/profile/family/add")}
        >
          <Plus size={18} />
          <span>Add</span>
        </button>
      </div>

      {/* Member List */}
      <div className="members-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading family members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="empty-state">
            <Users size={48} strokeWidth={1.5} color="#CCC" />
            <h3>No family members yet</h3>
            <p>Add family members to personalize nutrition tracking for everyone.</p>
            <button
              className="add-first-btn"
              onClick={() => router.push("/profile/family/add")}
            >
              <Plus size={18} />
              Add First Member
            </button>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="member-card">
              <div className="member-avatar">
                {(member.firstName || member.fullName || "?")[0].toUpperCase()}
              </div>
              <div className="member-info">
                <h3>{member.fullName}</h3>
                <div className="member-meta">
                  {member.householdRole && (
                    <span className="role-badge">
                      {member.householdRole.replace(/_/g, " ")}
                    </span>
                  )}
                  {member.age && <span className="age">{member.age} yrs</span>}
                  {member.gender && <span className="gender">{member.gender}</span>}
                </div>
                {member.healthProfile && (
                  <div className="health-summary">
                    {member.healthProfile.targetCalories && (
                      <span>{member.healthProfile.targetCalories} cal/day</span>
                    )}
                    {member.healthProfile.allergens?.length > 0 && (
                      <span>
                        {member.healthProfile.allergens.length} allergen{member.healthProfile.allergens.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {!member.isProfileOwner && (
                <div className="member-actions">
                  {confirmDeleteId === member.id ? (
                    <div className="confirm-delete">
                      <button
                        className="confirm-yes"
                        onClick={() => handleDelete(member.id)}
                        disabled={deleteMember.isPending}
                      >
                        {deleteMember.isPending ? "..." : "Yes"}
                      </button>
                      <button
                        className="confirm-no"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      className="delete-btn"
                      onClick={() => setConfirmDeleteId(member.id)}
                      title="Remove member"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
              {member.isProfileOwner && (
                <span className="owner-badge">You</span>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .family-hub-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 16px 100px;
        }
        .family-header {
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
        .header-text {
          flex: 1;
        }
        .header-text h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1A1A2E;
        }
        .subtitle {
          margin: 2px 0 0;
          font-size: 13px;
          color: #999;
        }
        .add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: #99CC33;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s;
        }
        .add-btn:hover { background: #88BB22; }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .member-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          border: 1px solid #F0F0F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: box-shadow 0.2s;
        }
        .member-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .member-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #99CC33, #77AA11);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .member-info {
          flex: 1;
          min-width: 0;
        }
        .member-info h3 {
          margin: 0 0 4px;
          font-size: 15px;
          font-weight: 600;
          color: #1A1A2E;
        }
        .member-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .role-badge {
          font-size: 11px;
          font-weight: 500;
          color: #99CC33;
          background: #F0F9E8;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: capitalize;
        }
        .age, .gender {
          font-size: 12px;
          color: #999;
        }
        .health-summary {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 12px;
          color: #777;
        }
        .owner-badge {
          font-size: 11px;
          font-weight: 600;
          color: #99CC33;
          background: #F0F9E8;
          padding: 4px 10px;
          border-radius: 8px;
        }
        .member-actions {
          flex-shrink: 0;
        }
        .delete-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid #FFE0E0;
          background: #FFF5F5;
          color: #E74C3C;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .delete-btn:hover {
          background: #FFE0E0;
        }
        .confirm-delete {
          display: flex;
          gap: 6px;
        }
        .confirm-yes {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: #E74C3C;
          color: white;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }
        .confirm-no {
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #E0E0E0;
          background: white;
          color: #666;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }

        .empty-state, .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        .empty-state h3 {
          margin: 16px 0 8px;
          color: #666;
        }
        .empty-state p {
          font-size: 14px;
          color: #999;
          margin: 0 0 20px;
        }
        .add-first-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          border: none;
          background: #99CC33;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #E0E0E0;
          border-top-color: #99CC33;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
