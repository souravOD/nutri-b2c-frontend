"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGetInvitationByToken, apiAcceptInvitation } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Users, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

type PageState = "loading" | "valid" | "expired" | "already-accepted" | "revoked" | "error" | "accepted";

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
  const token = searchParams.get("token");

  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const { data: invitation, error: fetchError } = useQuery({
    queryKey: ["invitation-details", token],
    queryFn: () => apiGetInvitationByToken(token!),
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => apiAcceptInvitation(token!),
    onSuccess: () => {
      setPageState("accepted");
      qc.invalidateQueries({ queryKey: ["household-members"] });
      toast({ title: "Welcome!", description: "You've joined the household" });
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to accept invitation";
      if (err?.status === 409 && msg.includes("already a member")) {
        setPageState("error");
        setErrorMessage("You are already a member of this household.");
      } else if (err?.status === 409 && msg.includes("Cannot leave")) {
        setPageState("error");
        setErrorMessage(msg);
      } else {
        setPageState("error");
        setErrorMessage(msg);
      }
    },
  });

  useEffect(() => {
    if (!token) {
      setPageState("error");
      setErrorMessage("No invitation token found in the URL.");
      return;
    }
    if (invitation) {
      setPageState("valid");
    }
    if (fetchError) {
      const err = fetchError as any;
      const msg = err?.message || "";
      if (err?.status === 410) {
        if (msg.includes("already been accepted")) setPageState("already-accepted");
        else if (msg.includes("cancelled")) setPageState("revoked");
        else setPageState("expired");
      } else {
        setPageState("error");
        setErrorMessage(msg || "Could not load invitation.");
      }
    }
  }, [token, invitation, fetchError]);

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

  // ── Valid invitation — show accept UI ─────────────────────────────────

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ ...iconCircleStyle, background: "#F0F9E8" }}>
          <Users size={40} color="#99CC33" />
        </div>

        <h2 style={titleStyle}>You&apos;re Invited!</h2>
        <p style={subtitleStyle}>
          <strong>{invitation?.invitedByName}</strong> invited you to join their household.
        </p>

        <div style={detailBoxStyle}>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Household</span>
            <span style={{ fontWeight: 600 }}>{invitation?.householdName}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Type</span>
            <span style={{ textTransform: "capitalize" }}>{invitation?.householdType}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Current Members</span>
            <span>{invitation?.totalMembers}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Your Role</span>
            <span style={{ textTransform: "capitalize" }}>{invitation?.role?.replace(/_/g, " ")}</span>
          </div>
          <div style={detailRowStyle}>
            <span style={{ color: "#999" }}>Expires</span>
            <span>{invitation?.expiresAt ? new Date(invitation.expiresAt).toLocaleDateString() : "—"}</span>
          </div>
        </div>

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
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  background: "linear-gradient(135deg, #F0F9E8 0%, #E8F5E0 100%)",
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 20,
  padding: "40px 28px",
  maxWidth: 420,
  width: "100%",
  textAlign: "center",
  boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
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
};

const detailRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  padding: "8px 0",
  borderBottom: "1px solid #F0F0F0",
  fontSize: 14,
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 0",
  borderRadius: 12,
  border: "none",
  background: "#99CC33",
  color: "white",
  fontSize: 16,
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  borderRadius: 12,
  border: "1px solid #E0E0E0",
  background: "transparent",
  color: "#999",
  fontSize: 14,
  cursor: "pointer",
  marginTop: 12,
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
