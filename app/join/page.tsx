"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetInvitationPreview, apiAcceptInvitation } from "@/lib/api/household";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import type { InvitationPreview } from "@/lib/types";
import { Users, CheckCircle, XCircle, Clock, AlertTriangle, LogIn, UserPlus, ShieldAlert } from "lucide-react";

type PageState = "loading" | "valid" | "expired" | "already-accepted" | "revoked" | "email-mismatch" | "error" | "accepted";

// Wrapper with Suspense boundary (required for useSearchParams in Next.js App Router)
export default function JoinPageWrapper() {
  return (
    <Suspense
      fallback={
        <div style={containerStyle}>
          <div style={cardStyle}>
            <div style={spinnerStyle} />
            <p style={{ color: "#999", marginTop: 16 }}>Loading…</p>
          </div>
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { isAuthed, loading: authLoading, signOut } = useUser();
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [preview, setPreview] = useState<InvitationPreview | null>(null);

  // ── Phase 1: Unauthenticated preview fetch ────────────────────────────
  const loadPreview = useCallback(async () => {
    if (!token) {
      setPageState("error");
      setErrorMessage("No invitation token found in the URL.");
      return;
    }
    try {
      const data = await apiGetInvitationPreview(token);
      setPreview(data);
      setPageState("valid");
    } catch (err: unknown) {
      const e = err as { message?: string; status?: number };
      const msg = e?.message || "";
      if (e?.status === 410) {
        if (msg.includes("already been accepted")) setPageState("already-accepted");
        else if (msg.includes("cancelled")) setPageState("revoked");
        else setPageState("expired");
      } else {
        setPageState("error");
        setErrorMessage(msg || "Could not load invitation.");
      }
    }
  }, [token]);

  useEffect(() => { loadPreview(); }, [loadPreview]);

  // ── Phase 2: Authenticated accept ─────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: () => apiAcceptInvitation(token!),
    onSuccess: () => {
      setPageState("accepted");
      qc.invalidateQueries({ queryKey: ["household-members"] });
      toast({ title: "Welcome!", description: "You've joined the household" });
    },
    onError: (err: unknown) => {
      const e = err as { message?: string; status?: number };
      const msg = e?.message || "Failed to accept invitation";
      if (e?.status === 403) {
        setPageState("email-mismatch");
        setErrorMessage(msg);
      } else {
        setPageState("error");
        setErrorMessage(msg);
      }
    },
  });

  // ── Auth navigation helpers ───────────────────────────────────────────
  const joinPath = `/join?token=${token}`;
  const goLogin = () => router.push(`/login?next=${encodeURIComponent(joinPath)}`);
  const goRegister = () => router.push(`/register?next=${encodeURIComponent(joinPath)}`);

  // ── Render different states ───────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={spinnerStyle} />
          <p style={{ color: "#999", marginTop: 16 }}>Loading invitation…</p>
        </div>
      </div>
    );
  }

  if (pageState === "accepted") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconCircleStyle, background: "#F0F9E8" }}>
            <CheckCircle size={40} color="#99CC33" />
          </div>
          <h2 style={titleStyle}>You&apos;re In!</h2>
          <p style={subtitleStyle}>You have successfully joined the household.</p>
          <button onClick={() => router.push("/profile/family")} style={primaryBtnStyle}>
            View Your Family →
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "expired") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconCircleStyle, background: "#FFF5F5" }}>
            <Clock size={40} color="#E74C3C" />
          </div>
          <h2 style={titleStyle}>Invitation Expired</h2>
          <p style={subtitleStyle}>This invitation has expired. Ask the sender for a new one.</p>
          <button onClick={() => router.push("/")} style={secondaryBtnStyle}>Go Home</button>
        </div>
      </div>
    );
  }

  if (pageState === "already-accepted") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconCircleStyle, background: "#FFF5F5" }}>
            <XCircle size={40} color="#E74C3C" />
          </div>
          <h2 style={titleStyle}>Already Accepted</h2>
          <p style={subtitleStyle}>This invitation has already been used by someone.</p>
          <button onClick={() => router.push("/")} style={secondaryBtnStyle}>Go Home</button>
        </div>
      </div>
    );
  }

  if (pageState === "revoked") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconCircleStyle, background: "#FFF5F5" }}>
            <XCircle size={40} color="#E74C3C" />
          </div>
          <h2 style={titleStyle}>Invitation Cancelled</h2>
          <p style={subtitleStyle}>The sender has cancelled this invitation.</p>
          <button onClick={() => router.push("/")} style={secondaryBtnStyle}>Go Home</button>
        </div>
      </div>
    );
  }

  if (pageState === "email-mismatch") {
    const handleSwitchAccount = async () => {
      // Sign out first so RouteGuard doesn't bounce us away from /login
      try { await signOut(); } catch { /* signOut may do its own redirect */ }
      const returnPath = `/join?token=${token}`;
      window.location.href = `/login?next=${encodeURIComponent(returnPath)}`;
    };
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconCircleStyle, background: "#FFF8E1" }}>
            <ShieldAlert size={40} color="#F59E0B" />
          </div>
          <h2 style={titleStyle}>Wrong Account</h2>
          <p style={{ ...subtitleStyle, marginBottom: 16 }}>
            This invitation was sent to a specific email address, but you&apos;re signed in with a different account.
          </p>
          <div style={emailMismatchTipStyle}>
            <strong>What to do:</strong>
            <br />
            Sign out and sign in (or register) with the email address that received this invitation.
          </div>
          <button onClick={handleSwitchAccount} style={primaryBtnStyle}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <LogIn size={18} /> Switch Account
            </span>
          </button>
          <button onClick={() => { setPageState("valid"); }} style={{ ...secondaryBtnStyle, marginTop: 8 }}>
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconCircleStyle, background: "#FFF5F5" }}>
            <AlertTriangle size={40} color="#E74C3C" />
          </div>
          <h2 style={titleStyle}>Something went wrong</h2>
          <p style={subtitleStyle}>{errorMessage}</p>
          <button onClick={() => router.push("/")} style={secondaryBtnStyle}>Go Home</button>
        </div>
      </div>
    );
  }

  // ── Valid invitation — show preview + auth-aware CTAs ──────────────────

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ ...iconCircleStyle, background: "#F0F9E8" }}>
          <Users size={40} color="#99CC33" />
        </div>

        <h2 style={titleStyle}>You&apos;re Invited!</h2>
        <p style={subtitleStyle}>
          <strong>{preview?.invitedByName}</strong> invited you to join their household.
        </p>

        {/* Invitation details */}
        <div style={detailBoxStyle}>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Household</span>
            <span style={{ fontWeight: 600 }}>{preview?.householdName}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Type</span>
            <span style={{ textTransform: "capitalize" }}>{preview?.householdType}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Current Members</span>
            <span>{preview?.totalMembers}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Your Role</span>
            <span style={{ textTransform: "capitalize" }}>{preview?.role?.replace(/_/g, " ")}</span>
          </div>
          <div style={{ ...detailRowStyle, borderBottom: "none" }}>
            <span style={{ color: "#999" }}>Expires</span>
            <span>{preview?.expiresAt ? new Date(preview.expiresAt).toLocaleDateString() : "—"}</span>
          </div>
        </div>

        {/* Email enforcement notice */}
        {preview?.requiresSpecificEmail && (
          <div style={emailNoticeStyle}>
            <AlertTriangle size={14} color="#B8860B" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>This invitation was sent to a specific email. You must sign in with that email to accept.</span>
          </div>
        )}

        {/* Auth-aware CTAs */}
        {authLoading ? (
          <div style={{ padding: "16px 0" }}>
            <div style={spinnerStyle} />
          </div>
        ) : isAuthed ? (
          /* ── Logged in: show Accept & Decline ── */
          <>
            <button
              disabled={acceptMutation.isPending}
              onClick={() => acceptMutation.mutate()}
              style={primaryBtnStyle}
            >
              {acceptMutation.isPending ? "Joining…" : "Accept & Join Household"}
            </button>
            <button onClick={() => router.push("/")} style={{ ...secondaryBtnStyle, marginTop: 8 }}>
              Decline
            </button>
          </>
        ) : (
          /* ── Not logged in: show Sign Up & Log In ── */
          <>
            <button onClick={goRegister} style={primaryBtnStyle}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <UserPlus size={18} /> Sign Up to Join
              </span>
            </button>
            <button onClick={goLogin} style={{ ...secondaryBtnStyle, marginTop: 8 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <LogIn size={16} /> Already have an account? Log in
              </span>
            </button>
          </>
        )}
      </div>

      {/* Branding footer */}
      <p style={brandingStyle}>
        <img src="/images/logo.png" alt="" width={20} height={20} style={{ verticalAlign: "middle", marginRight: 6 }} />
        NutriSmarts
      </p>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "linear-gradient(135deg, #F0F9E8 0%, #E8F5E0 100%)",
  fontFamily: "Inter, sans-serif",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  padding: "40px 28px",
  maxWidth: 420,
  width: "100%",
  textAlign: "center",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
  color: "#1A1A2E",
};

const iconCircleStyle: React.CSSProperties = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px",
};

const titleStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: "#1A1A2E",
  marginBottom: 8,
};

const subtitleStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#666",
  marginBottom: 24,
  lineHeight: 1.5,
};

const detailBoxStyle: React.CSSProperties = {
  background: "#FAFAFA",
  borderRadius: 12,
  padding: 16,
  marginBottom: 24,
  textAlign: "left",
  color: "#1A1A2E",
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #F0F0F0",
  fontSize: 14,
  color: "#1A1A2E",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 0",
  borderRadius: 12,
  border: "none",
  background: "#99CC33",
  color: "#0F172A",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(153,204,51,0.25)",
  transition: "opacity 0.15s",
};

const secondaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  borderRadius: 12,
  border: "1px solid #E0E0E0",
  background: "transparent",
  color: "#666",
  fontSize: 14,
  cursor: "pointer",
  marginTop: 12,
  transition: "border-color 0.15s",
};

const emailNoticeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  padding: "10px 14px",
  background: "#FFF8E1",
  border: "1px solid #FFE082",
  borderRadius: 10,
  marginBottom: 20,
  fontSize: 12,
  color: "#8B6914",
  textAlign: "left",
  lineHeight: 1.4,
};

const emailMismatchTipStyle: React.CSSProperties = {
  padding: "14px 16px",
  background: "#FFFBEB",
  border: "1px solid #FDE68A",
  borderRadius: 12,
  marginBottom: 20,
  fontSize: 13,
  color: "#92400E",
  textAlign: "left",
  lineHeight: 1.6,
};

const brandingStyle: React.CSSProperties = {
  marginTop: 24,
  fontSize: 13,
  color: "#999",
  fontWeight: 500,
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  border: "3px solid #99CC33",
  borderTopColor: "transparent",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
  margin: "0 auto",
};
