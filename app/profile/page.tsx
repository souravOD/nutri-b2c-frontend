"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useHouseholdMembers } from "@/hooks/use-household";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useFavorites } from "@/hooks/use-favorites";
import Link from "next/link";
import {
  Edit2,
  Users,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  Calendar,
  Trophy,
  Flame,
  Bell,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { clearAuthCookie } from "@/lib/auth-cookie";

interface ProfileData {
  fullName: string | null;
  firstName: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  age: number | null;
  dateOfBirth: string | null;
}

interface HealthData {
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  activityLevel: string | null;
  healthGoal: string | null;
  targetCalories: number | null;
  allergens: string[];
  diets: string[];
  conditions: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"account" | "activity">("account");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const { members = [] } = useHouseholdMembers();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { savedRecipes = [] } = useFavorites();

  // ── Deletion modal state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1=warning, 2=household-scope, 3=choose-primary, 4=type-DELETE, 5=processing, 6=success
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletionDate, setDeletionDate] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Household dissolution
  const [householdContext, setHouseholdContext] = useState<{
    isPrimaryAdult: boolean;
    householdType: string;
    otherMembers: { id: string; fullName: string; householdRole: string | null }[];
    secondaryAdults: { id: string; fullName: string; householdRole: string | null }[];
  } | null>(null);
  const [deleteScope, setDeleteScope] = useState<"my_account" | "entire_household">("my_account");
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, hRes] = await Promise.all([
          authFetch("/api/v1/me/profile"),
          authFetch("/api/v1/me/health"),
        ]);
        if (!pRes.ok || !hRes.ok) {
          throw new Error(`Profile load failed: ${pRes.status}/${hRes.status}`);
        }
        setProfile(await pRes.json());
        setHealth(await hRes.json());
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLogout = async () => {
    // B2C-COMPLIANCE: Log logout event before destroying Appwrite session
    try { await authFetch("/api/v1/me/logout", { method: "POST" }) } catch {}
    try {
      const { account: appwriteAccount } = await import("@/lib/appwrite");
      await appwriteAccount.deleteSession("current");
    } catch {
      // Session may already be expired — continue to redirect
    } finally {
      await clearAuthCookie(); // B2C-032: HttpOnly auth signal cookie
      window.location.href = "/login";
    }
  };

  const openDeleteModal = async () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setConfirmText("");
    setDeleteError(null);
    setDeleteScope("my_account");
    setSelectedPrimaryId(null);
    setHouseholdContext(null);

    // Fetch household context for Phase 3
    try {
      const res = await authFetch("/api/v1/me/account/pre-delete-check", { method: "POST" });
      if (res.ok) {
        setHouseholdContext(await res.json());
      }
    } catch {
      // Non-blocking — household steps will be skipped
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteStep(1);
    setConfirmText("");
    setDeleteError(null);
  };

  const proceedFromWarning = () => {
    // If primary_adult in non-individual household → show household scope step
    if (householdContext?.isPrimaryAdult && householdContext.householdType !== "individual" && householdContext.otherMembers.length > 0) {
      setDeleteStep(2); // household scope
    } else {
      setDeleteStep(4); // type DELETE
    }
  };

  const proceedFromScope = () => {
    if (deleteScope === "my_account" && householdContext && householdContext.secondaryAdults.length > 1) {
      setDeleteStep(3); // choose new primary
    } else if (deleteScope === "my_account" && householdContext && householdContext.secondaryAdults.length === 1) {
      setSelectedPrimaryId(householdContext.secondaryAdults[0].id);
      setDeleteStep(4); // type DELETE
    } else {
      setDeleteStep(4); // type DELETE
    }
  };

  const proceedFromChoosePrimary = () => {
    if (!selectedPrimaryId) return;
    setDeleteStep(4); // type DELETE
  };

  const executeDelete = async () => {
    if (confirmText !== "DELETE") return;
    setIsDeleting(true);
    setDeleteError(null);
    setDeleteStep(5); // processing

    try {
      const body: Record<string, string> = { scope: deleteScope };
      if (selectedPrimaryId) body.newPrimaryId = selectedPrimaryId;

      const res = await authFetch("/api/v1/me/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? `Deletion failed (${res.status})`);
      }

      const data = await res.json();
      setDeletionDate(data.deletionDate);
      setDeleteStep(6); // success

      // Clean up session and redirect after 5 seconds
      setTimeout(async () => {
        try {
          const { account: appwriteAccount } = await import("@/lib/appwrite");
          await appwriteAccount.deleteSession("current");
        } catch { }
        await clearAuthCookie();
        window.location.href = "/login";
      }, 5000);
    } catch (err: any) {
      setDeleteError(err?.message ?? "Failed to delete account. Please try again.");
      setDeleteStep(4); // back to type DELETE
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner" />
        <style jsx>{`
          .profile-loading { display: flex; justify-content: center; padding: 80px 0; }
          .loading-spinner {
            width: 36px; height: 36px;
            border: 3px solid #E0E0E0; border-top-color: #99CC33;
            border-radius: 50%; animation: spin 0.8s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="avatar-section">
          <div className="avatar">
            {(profile?.firstName || profile?.fullName || "U")[0].toUpperCase()}
          </div>
          <div className="user-info">
            <h1>{profile?.fullName || "User"}</h1>
            <p className="email">{profile?.email || ""}</p>
          </div>
        </div>
        <button className="edit-profile-btn" onClick={() => router.push("/profile/edit")}>
          <Edit2 size={16} />
          <span>Edit</span>
        </button>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        <button
          className={`tab ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
        <button
          className={`tab ${activeTab === "activity" ? "active" : ""}`}
          onClick={() => setActiveTab("activity")}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "account" ? (
        <div className="tab-content">
          {/* Personal Info Card */}
          <div className="info-card">
            <h3 className="card-title">Personal Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Name</span>
                <span className="value">{profile?.fullName || "—"}</span>
              </div>
              <div className="info-item">
                <span className="label">Email</span>
                <span className="value">{profile?.email || "—"}</span>
              </div>
              <div className="info-item">
                <span className="label">Phone</span>
                <span className="value">{profile?.phone || "—"}</span>
              </div>
              <div className="info-item">
                <span className="label">Gender</span>
                <span className="value" style={{ textTransform: "capitalize" }}>
                  {profile?.gender?.replace(/_/g, " ") || "—"}
                </span>
              </div>
              <div className="info-item">
                <span className="label">Age</span>
                <span className="value">{profile?.age ?? "—"}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="nav-links">
            <button className="nav-link" onClick={() => router.push("/profile/family")}>
              <div className="nav-link-icon" style={{ background: "#F0F9E8", color: "#99CC33" }}>
                <Users size={18} />
              </div>
              <div className="nav-link-text">
                <span className="nav-link-title">Manage Family Members</span>
                <span className="nav-link-subtitle">{members.length} member{members.length !== 1 ? "s" : ""}</span>
              </div>
              <ChevronRight size={18} color="#CCC" />
            </button>

            <button className="nav-link" onClick={() => router.push("/profile/edit-health")}>
              <div className="nav-link-icon" style={{ background: "#FFF0E5", color: "#FF6B35" }}>
                <Heart size={18} />
              </div>
              <div className="nav-link-text">
                <span className="nav-link-title">Health & Dietary</span>
                <span className="nav-link-subtitle">
                  {health?.allergens?.length || 0} allergens · {health?.diets?.length || 0} diets · {health?.conditions?.length || 0} conditions
                </span>
              </div>
              <ChevronRight size={18} color="#CCC" />
            </button>

            <button className="nav-link" onClick={() => router.push("/my-recipes")}>
              <div className="nav-link-icon" style={{ background: "#E8F5E9", color: "#4CAF50" }}>
                <Heart size={18} />
              </div>
              <div className="nav-link-text">
                <span className="nav-link-title">My Recipes</span>
                <span className="nav-link-subtitle">View and manage your recipes</span>
              </div>
              <ChevronRight size={18} color="#CCC" />
            </button>

            <button className="nav-link" onClick={() => router.push("/settings")}>
              <div className="nav-link-icon" style={{ background: "#F0F0FF", color: "#6C5CE7" }}>
                <Settings size={18} />
              </div>
              <div className="nav-link-text">
                <span className="nav-link-title">Settings</span>
                <span className="nav-link-subtitle">Preferences, goals, privacy</span>
              </div>
              <ChevronRight size={18} color="#CCC" />
            </button>

            <button className="nav-link" onClick={() => router.push("/notifications")}>
              <div className="nav-link-icon" style={{ background: "#FFF8E5", color: "#FFB300" }}>
                <Bell size={18} />
              </div>
              <div className="nav-link-text">
                <span className="nav-link-title">Notifications</span>
                <span className="nav-link-subtitle">
                  {unreadCount > 5 ? "5+ unread" : unreadCount ? `${unreadCount} unread` : "All caught up"}
                </span>
              </div>
              <ChevronRight size={18} color="#CCC" />
            </button>

            <button className="nav-link" onClick={() => router.push("/grocery-list/preferences")}>
              <div className="nav-link-icon" style={{ background: "#E8F8F0", color: "#2ECC71" }}>
                <ShoppingCart size={18} />
              </div>
              <div className="nav-link-text">
                <span className="nav-link-title">Grocery Preferences</span>
                <span className="nav-link-subtitle">Store, brand & shopping settings</span>
              </div>
              <ChevronRight size={18} color="#CCC" />
            </button>
          </div>

          {/* Account Actions */}
          <div className="account-actions">
            <button className="action-btn logout" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Log Out</span>
            </button>
            <button className="action-btn delete" onClick={openDeleteModal}>
              <Trash2 size={18} />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="tab-content">
          {/* Activity Tab */}
          <div className="info-card activity-card">
            <div className="activity-stat">
              <Flame size={28} color="#FF6B35" />
              <div>
                <span className="stat-value">0</span>
                <span className="stat-label">Day Streak</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3 className="card-title">
              <Trophy size={18} color="#FFD93D" />
              Achievements
            </h3>
            <div className="achievements-empty">
              <p>Start logging meals to earn achievements!</p>
            </div>
          </div>

          {/* Liked Recipes */}
          <div className="info-card">
            <div className="liked-header">
              <h3 className="card-title">
                <Heart size={18} color="#E74C3C" />
                Liked Recipes
                {savedRecipes.length > 0 && (
                  <span className="liked-count">{savedRecipes.length}</span>
                )}
              </h3>
              {savedRecipes.length > 0 && (
                <Link href="/favorites" className="see-all-link">View All</Link>
              )}
            </div>
            {savedRecipes.length === 0 ? (
              <div className="achievements-empty">
                <p>Save recipes by tapping the heart icon on any recipe card.</p>
              </div>
            ) : (
              <div className="liked-scroll">
                {savedRecipes.slice(0, 6).map((recipe) => {
                  const title = recipe.title ?? recipe.name ?? "Recipe";
                  const imgSrc = String(recipe.imageUrl || recipe.image_url || "");
                  const calories = recipe.calories ?? recipe.nutrition?.calories ?? 0;
                  const protein = recipe.protein_g ?? recipe.nutrition?.protein_g ?? 0;
                  return (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="liked-mini-card">
                      <div className="liked-mini-img-wrap">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={title}
                            className="liked-mini-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const sib = (e.target as HTMLImageElement).nextElementSibling;
                              if (sib) (sib as HTMLElement).style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="liked-mini-img-fallback" style={imgSrc ? { display: 'none' } : undefined}>
                          <span>No image</span>
                        </div>
                      </div>
                      <div className="liked-mini-body">
                        <span className="liked-mini-title">{title}</span>
                        <div className="liked-mini-meta">
                          <span className="liked-mini-stat">
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" aria-hidden="true"><path d="M4 0C4 0 1 3 1 5.5C1 7.43 2.57 9 4 9C5.43 9 7 7.43 7 5.5C7 3 4 0 4 0Z" fill="#64748B"/></svg>
                            {Math.round(Number(calories))} kcal
                          </span>
                          <span className="liked-mini-stat">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true"><circle cx="5" cy="5" r="4" stroke="#64748B" strokeWidth="1.5" fill="none"/><circle cx="5" cy="5" r="1.5" fill="#64748B"/></svg>
                            {Math.round(Number(protein))}g Protein
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="info-card">
            <h3 className="card-title">
              <Calendar size={18} color="#4ECDC4" />
              Recent Activity
            </h3>
            <div className="achievements-empty">
              <p>Your recent activity will appear here.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Deletion Modal ── */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}>
          <div className="delete-modal">

            {/* Step 1: Warning */}
            {deleteStep === 1 && (
              <div className="delete-modal-content">
                <div className="delete-modal-icon warning">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="delete-modal-title">Delete Your Account?</h2>
                <p className="delete-modal-body">
                  Your account will be scheduled for permanent deletion. After 30 days, the following will be permanently removed:
                </p>
                <ul className="delete-modal-list">
                  <li>All your recipes and meal plans</li>
                  <li>Health profile and weight history</li>
                  <li>Shopping lists and scan history</li>
                  <li>Chat history and notifications</li>
                  <li>All feedback and preferences</li>
                </ul>
                <div className="delete-modal-info">
                  <Info size={16} />
                  <span>You can recover your account within 30 days by logging back in.</span>
                </div>
                <div className="delete-modal-actions">
                  <button className="delete-modal-btn cancel" onClick={closeDeleteModal}>Cancel</button>
                  <button className="delete-modal-btn danger-outline" onClick={proceedFromWarning}>I understand, continue</button>
                </div>
              </div>
            )}

            {/* Step 2: Household scope (Phase 3) */}
            {deleteStep === 2 && householdContext && (
              <div className="delete-modal-content">
                <div className="delete-modal-icon household">
                  <Users size={32} />
                </div>
                <h2 className="delete-modal-title">You own a household</h2>
                <p className="delete-modal-body">What would you like to do?</p>

                <div className="delete-modal-radio-group">
                  <label
                    className={`delete-modal-radio-card${deleteScope === "my_account" ? " selected" : ""}`}
                    onClick={() => setDeleteScope("my_account")}
                  >
                    <input type="radio" name="scope" value="my_account" checked={deleteScope === "my_account"} onChange={() => setDeleteScope("my_account")} />
                    <div>
                      <strong>Delete only my account</strong>
                      <span>Transfer ownership to another member</span>
                    </div>
                  </label>
                  <label
                    className={`delete-modal-radio-card${deleteScope === "entire_household" ? " selected" : ""}`}
                    onClick={() => setDeleteScope("entire_household")}
                  >
                    <input type="radio" name="scope" value="entire_household" checked={deleteScope === "entire_household"} onChange={() => setDeleteScope("entire_household")} />
                    <div>
                      <strong>Delete entire household</strong>
                      <span>All members will be removed</span>
                    </div>
                  </label>
                </div>

                <div className="delete-modal-actions">
                  <button className="delete-modal-btn cancel" onClick={() => setDeleteStep(1)}>← Back</button>
                  <button className="delete-modal-btn danger-outline" onClick={proceedFromScope}>Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Choose new primary (Phase 3) */}
            {deleteStep === 3 && householdContext && (
              <div className="delete-modal-content">
                <div className="delete-modal-icon household">
                  <Users size={32} />
                </div>
                <h2 className="delete-modal-title">Choose new household owner</h2>
                <p className="delete-modal-body">Select who will manage the household after you leave:</p>

                <div className="delete-modal-radio-group">
                  {householdContext.secondaryAdults.map((member) => (
                    <label
                      key={member.id}
                      className={`delete-modal-radio-card member${selectedPrimaryId === member.id ? " selected" : ""}`}
                      onClick={() => setSelectedPrimaryId(member.id)}
                    >
                      <input type="radio" name="primary" value={member.id} checked={selectedPrimaryId === member.id} onChange={() => setSelectedPrimaryId(member.id)} />
                      <div className="member-avatar">{member.fullName?.charAt(0)?.toUpperCase() ?? "?"}</div>
                      <div>
                        <strong>{member.fullName}</strong>
                        <span>Secondary Adult</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="delete-modal-actions">
                  <button className="delete-modal-btn cancel" onClick={() => setDeleteStep(2)}>← Back</button>
                  <button className="delete-modal-btn danger-outline" onClick={proceedFromChoosePrimary} disabled={!selectedPrimaryId}>Continue</button>
                </div>
              </div>
            )}

            {/* Step 4: Type DELETE */}
            {deleteStep === 4 && (
              <div className="delete-modal-content">
                <div className="delete-modal-icon danger">
                  <Trash2 size={32} />
                </div>
                <h2 className="delete-modal-title">Confirm Account Deletion</h2>
                <p className="delete-modal-body">
                  Type <strong>DELETE</strong> below to confirm:
                </p>
                <input
                  className="delete-modal-input"
                  type="text"
                  placeholder="Type DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
                {deleteError && <p className="delete-modal-error">{deleteError}</p>}
                <div className="delete-modal-actions">
                  <button className="delete-modal-btn cancel" onClick={() => {
                    if (householdContext?.isPrimaryAdult && householdContext.householdType !== "individual" && householdContext.otherMembers.length > 0) {
                      setDeleteStep(2);
                    } else {
                      setDeleteStep(1);
                    }
                  }}>← Back</button>
                  <button
                    className="delete-modal-btn danger"
                    onClick={executeDelete}
                    disabled={confirmText !== "DELETE" || isDeleting}
                  >
                    Delete My Account
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Processing */}
            {deleteStep === 5 && (
              <div className="delete-modal-content center">
                <div className="delete-modal-spinner">
                  <Loader2 size={40} className="spinning" />
                </div>
                <h2 className="delete-modal-title">Scheduling account deletion…</h2>
                <p className="delete-modal-body">Please wait while we process your request.</p>
              </div>
            )}

            {/* Step 6: Success */}
            {deleteStep === 6 && (
              <div className="delete-modal-content center">
                <div className="delete-modal-icon success">
                  <CheckCircle2 size={40} />
                </div>
                <h2 className="delete-modal-title">Account Scheduled for Deletion</h2>
                <p className="delete-modal-body">
                  {deletionDate ? (
                    <>You have until <strong>{new Date(deletionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong> to recover your account by logging back in.</>
                  ) : (
                    <>You have 30 days to recover your account by logging back in.</>
                  )}
                </p>
                <p className="delete-modal-redirect">Redirecting to login in 5 seconds…</p>
              </div>
            )}

          </div>
        </div>
      )}

      <style jsx>{`
        .profile-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 16px 100px;
        }
        .profile-page a {
          text-decoration: none;
          color: inherit;
        }
        .profile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 0 20px;
        }
        .avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .avatar {
          width: 72px;
          height: 72px;
          border-radius: 20px;
          background: linear-gradient(135deg, #99CC33, #77AA11);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 700;
        }
        .user-info h1 {
          margin: 0 0 2px;
          font-size: 22px;
          font-weight: 700;
          color: #1A1A2E;
        }
        .email {
          margin: 0;
          font-size: 14px;
          color: #999;
        }
        .edit-profile-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          background: white;
          color: #555;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .edit-profile-btn:hover {
          border-color: #99CC33;
          color: #99CC33;
        }
        .tab-bar {
          display: flex;
          gap: 4px;
          background: #F5F5F5;
          padding: 4px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        .tab {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #999;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .tab.active {
          background: white;
          color: #1A1A2E;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .info-card {
          background: white;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #F0F0F0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .card-title {
          margin: 0 0 16px;
          font-size: 15px;
          font-weight: 600;
          color: #1A1A2E;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .label {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }
        .value {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }
        .nav-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          border: 1px solid #F0F0F0;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          font-family: inherit;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .nav-link:hover {
          border-color: #E0E0E0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .nav-link-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-link-text {
          flex: 1;
          min-width: 0;
        }
        .nav-link-title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A2E;
          margin-bottom: 2px;
        }
        .nav-link-subtitle {
          display: block;
          font-size: 12px;
          color: #999;
        }
        .account-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }
        .action-btn.logout {
          border-color: #E0E0E0;
          background: white;
          color: #666;
        }
        .action-btn.logout:hover {
          background: #F5F5F5;
        }
        .action-btn.delete {
          border-color: #FFE0E0;
          background: #FFF5F5;
          color: #E74C3C;
        }
        .action-btn.delete:hover {
          background: #FFE0E0;
        }

        /* ── Deletion Modal ── */
        .delete-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
        .delete-modal {
          background: white;
          width: 100%;
          max-width: 480px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
          animation: modalIn 0.25s ease-out;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .delete-modal-content {
          padding: 32px 28px;
        }
        .delete-modal-content.center {
          text-align: center;
        }
        .delete-modal-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .delete-modal-content.center .delete-modal-icon {
          margin: 0 auto 20px;
        }
        .delete-modal-icon.warning {
          background: #FFF3E0;
          color: #E65100;
        }
        .delete-modal-icon.danger {
          background: #FFEBEE;
          color: #E74C3C;
        }
        .delete-modal-icon.household {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .delete-modal-icon.success {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .delete-modal-title {
          font-size: 22px;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 8px;
          line-height: 28px;
          font-family: Inter, sans-serif;
        }
        .delete-modal-body {
          font-size: 14px;
          color: #475569;
          line-height: 22px;
          margin: 0 0 16px;
          font-family: Inter, sans-serif;
        }
        .delete-modal-list {
          margin: 0 0 20px;
          padding-left: 24px;
          font-size: 14px;
          color: #475569;
          line-height: 26px;
          font-family: Inter, sans-serif;
        }
        .delete-modal-list li { margin-bottom: 2px; }
        .delete-modal-info {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(153, 204, 51, 0.08);
          border: 1px solid rgba(153, 204, 51, 0.2);
          border-radius: 12px;
          margin-bottom: 24px;
          font-size: 13px;
          color: #475569;
          line-height: 20px;
          font-family: Inter, sans-serif;
        }
        .delete-modal-info svg {
          flex-shrink: 0;
          color: #99CC33;
          margin-top: 2px;
        }
        .delete-modal-input {
          width: 100%;
          height: 52px;
          padding: 0 20px;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 600;
          font-family: Inter, sans-serif;
          color: #0F172A;
          background: #F8FAFC;
          outline: none;
          transition: border-color 0.2s;
          letter-spacing: 2px;
          margin-bottom: 16px;
          box-sizing: border-box;
        }
        .delete-modal-input:focus {
          border-color: #E74C3C;
          background: white;
        }
        .delete-modal-input::placeholder {
          font-weight: 400;
          letter-spacing: 0;
          color: #94A3B8;
        }
        .delete-modal-error {
          font-size: 13px;
          color: #E74C3C;
          margin: -8px 0 16px;
          font-family: Inter, sans-serif;
        }
        .delete-modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .delete-modal-btn {
          flex: 1;
          height: 48px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
          font-family: Inter, sans-serif;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-modal-btn.cancel {
          background: white;
          border: 1.5px solid #E2E8F0;
          color: #0F172A;
        }
        .delete-modal-btn.cancel:hover { background: #F8FAFC; }
        .delete-modal-btn.danger {
          background: #E74C3C;
          color: white;
        }
        .delete-modal-btn.danger:hover { background: #D32F2F; }
        .delete-modal-btn.danger:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .delete-modal-btn.danger-outline {
          background: #FFF5F5;
          border: 1.5px solid #FFE0E0;
          color: #E74C3C;
        }
        .delete-modal-btn.danger-outline:hover { background: #FFE0E0; }
        .delete-modal-btn.danger-outline:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Radio cards */
        .delete-modal-radio-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        .delete-modal-radio-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: white;
          border: 1.5px solid #E2E8F0;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .delete-modal-radio-card:hover { border-color: #CBD5E1; }
        .delete-modal-radio-card.selected {
          border-color: #99CC33;
          background: rgba(153, 204, 51, 0.05);
        }
        .delete-modal-radio-card input[type="radio"] {
          width: 18px;
          height: 18px;
          accent-color: #99CC33;
          flex-shrink: 0;
        }
        .delete-modal-radio-card div {
          display: flex;
          flex-direction: column;
        }
        .delete-modal-radio-card strong {
          font-size: 14px;
          font-weight: 600;
          color: #0F172A;
          font-family: Inter, sans-serif;
        }
        .delete-modal-radio-card span {
          font-size: 12px;
          color: #64748B;
          font-family: Inter, sans-serif;
          margin-top: 2px;
        }
        .member-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(153, 204, 51, 0.12);
          color: #558B2F;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          font-family: Inter, sans-serif;
          flex-shrink: 0;
        }

        /* Spinner */
        .delete-modal-spinner {
          margin: 0 auto 20px;
          color: #99CC33;
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
        .delete-modal-redirect {
          font-size: 13px;
          color: #94A3B8;
          font-family: Inter, sans-serif;
        }

        /* Mobile overrides */
        @media (max-width: 640px) {
          .delete-modal-overlay {
            align-items: flex-end;
          }
          .delete-modal {
            max-width: 100%;
            border-radius: 24px 24px 0 0;
            max-height: 90vh;
            overflow-y: auto;
          }
          .delete-modal-content {
            padding: 28px 20px;
          }
          .delete-modal-btn {
            border-radius: 9999px;
          }
          .delete-modal-input {
            border-radius: 9999px;
          }
          .delete-modal-radio-card {
            border-radius: 9999px;
            padding: 14px 16px;
          }
        }

        .activity-card {
          display: flex;
          align-items: center;
        }
        .activity-stat {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-value {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #1A1A2E;
          line-height: 1;
        }
        .stat-label {
          display: block;
          font-size: 13px;
          color: #999;
          margin-top: 2px;
        }
        .achievements-empty {
          text-align: center;
          padding: 24px;
          color: #999;
          font-size: 14px;
        }
        .achievements-empty p { margin: 0; }

        /* Liked Recipes */
        .liked-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .liked-header .card-title {
          margin: 0;
        }
        .liked-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          height: 20px;
          padding: 0 6px;
          border-radius: 10px;
          background: #E74C3C;
          color: white;
          font-size: 11px;
          font-weight: 700;
          margin-left: 6px;
        }
        .see-all-link {
          font-size: 13px;
          font-weight: 600;
          color: #99CC33 !important;
          white-space: nowrap;
        }
        .liked-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
          margin: 0 -4px;
          padding-left: 4px;
          padding-right: 4px;
        }
        .liked-scroll::-webkit-scrollbar { display: none; }
        .liked-scroll { scrollbar-width: none; }
        .liked-mini-card {
          flex: 0 0 160px;
          scroll-snap-align: start;
          background: white;
          border: 1.5px solid #E2E8F0;
          border-radius: 24px;
          padding: 2px;
          text-decoration: none !important;
          color: inherit !important;
          transition: box-shadow 0.2s, transform 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .liked-mini-card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.1);
          transform: translateY(-2px);
          border-color: #CBD5E1;
        }
        .liked-mini-img-wrap {
          width: 100%;
          height: 100px;
          overflow: hidden;
          position: relative;
          border-radius: 22px 22px 0 0;
        }
        .liked-mini-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .liked-mini-img-fallback {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .liked-mini-img-fallback span {
          font-size: 12px;
          color: #94A3B8;
          font-weight: 500;
        }
        .liked-mini-body {
          padding: 10px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .liked-mini-title {
          font-size: 13px;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          font-family: Inter, sans-serif;
        }
        .liked-mini-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .liked-mini-stat {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: #64748B;
          font-family: Inter, sans-serif;
          white-space: nowrap;
        }

        @media (max-width: 480px) {
          .info-grid { grid-template-columns: 1fr; }
          .avatar { width: 60px; height: 60px; font-size: 24px; border-radius: 16px; }
          .user-info h1 { font-size: 18px; }
          .liked-mini-card { flex: 0 0 140px; }
          .liked-mini-img-wrap { height: 85px; }
          .liked-mini-body { padding: 8px 10px 10px; }
          .liked-mini-title { font-size: 12px; }
          .liked-mini-stat { font-size: 10px; }
        }
      `}</style>
    </div>
  );
}
