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
} from "lucide-react";

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
    try {
      const { account: appwriteAccount } = await import("@/lib/appwrite");
      await appwriteAccount.deleteSession("current");
    } catch {
      // Session may already be expired — continue to redirect
    } finally {
      // Hard redirect to clear all React state/context
      window.location.href = "/login";
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      await authFetch("/api/v1/me/account", { method: "DELETE" });
      // Backend deletes Supabase data + Appwrite docs + Appwrite user
      // Just clear the local session and hard redirect
      try {
        const { account: appwriteAccount } = await import("@/lib/appwrite");
        await appwriteAccount.deleteSession("current");
      } catch {
        // Session cleanup is best-effort since user is already deleted server-side
      }
      window.location.href = "/login";
    } catch (err) {
      console.error("Delete account failed", err);
      alert("Failed to delete account. Please try again.");
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
                  {unreadCount ? `${unreadCount} unread` : "All caught up"}
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
            <button className="action-btn delete" onClick={handleDeleteAccount}>
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
              <div className="liked-grid">
                {savedRecipes.slice(0, 6).map((recipe) => (
                  <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="liked-card">
                    <div className="liked-card-img-wrap">
                      <img
                        src={recipe.imageUrl || "/placeholder-recipe.jpg"}
                        alt={recipe.title}
                        className="liked-card-img"
                      />
                    </div>
                    <span className="liked-card-name">{recipe.title}</span>
                  </Link>
                ))}
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
        .liked-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .liked-card {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .liked-card-img-wrap {
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 14px;
          overflow: hidden;
        }
        .liked-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .liked-card-name {
          font-size: 13px;
          font-weight: 600;
          color: #1A1A2E;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.3;
        }

        @media (max-width: 480px) {
          .info-grid { grid-template-columns: 1fr; }
          .avatar { width: 60px; height: 60px; font-size: 24px; border-radius: 16px; }
          .user-info h1 { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
