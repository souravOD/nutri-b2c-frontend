"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, Trash2, UserPlus, Clock, Share2, Download, Mail } from "lucide-react";
import { useCreateInvitation, useListInvitations, useRevokeInvitation } from "@/hooks/use-household";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

const ROLE_OPTIONS = [
  { value: "secondary_adult", label: "Adult" },
  { value: "child", label: "Child" },
  { value: "dependent", label: "Dependent" },
];

export default function InvitePage() {
  const router = useRouter();
  const { toast } = useToast();

  const createInvite = useCreateInvitation();
  const { invitations, isLoading } = useListInvitations();
  const revokeInvite = useRevokeInvitation();

  const [selectedRole, setSelectedRole] = useState("secondary_adult");
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [emailWasQueued, setEmailWasQueued] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      const result = await createInvite.mutateAsync({
        role: selectedRole,
        invitedEmail: inviteEmail || undefined,
      });
      setGeneratedUrl(result.inviteUrl);
      const queued = !!(result as any).emailQueued;
      setEmailWasQueued(queued);
      const emailMsg = queued
        ? `Invitation email sent to ${inviteEmail}`
        : "Share the link below";
      toast({ title: "Invite Created", description: emailMsg });
    } catch {
      toast({ title: "Error", description: "Failed to create invitation", variant: "destructive" });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    toast({ title: "Copied!", description: "Invite link copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }

    // Try to share QR image as a file along with the link
    try {
      const svgEl = document.getElementById("invite-qr-svg")?.querySelector("svg");
      let files: File[] = [];
      if (svgEl) {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const blob = await new Promise<Blob | null>((resolve) => {
            const img = new Image();
            img.onload = () => {
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, 512, 512);
              ctx.drawImage(img, 0, 0, 512, 512);
              canvas.toBlob((b) => resolve(b), "image/png");
            };
            img.onerror = () => resolve(null);
            img.src = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svgEl));
          });
          if (blob) {
            files = [new File([blob], "nutrismarts-invite-qr.png", { type: "image/png" })];
          }
        }
      }

      const shareData: ShareData = {
        title: "Join my household on NutriSmarts",
        text: `You've been invited to join my household on NutriSmarts!\n${generatedUrl}`,
      };
      // Attach QR image if browser supports file sharing
      if (files.length > 0 && navigator.canShare?.({ files })) {
        shareData.files = files;
      }

      await navigator.share(shareData);
    } catch (e) {
      if ((e as Error).name !== "AbortError") handleCopy();
    }
  };

  const handleDownloadQR = () => {
    const svgEl = document.getElementById("invite-qr-svg")?.querySelector("svg");
    if (!svgEl) return;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = "nutrismarts-invite-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Downloaded", description: "QR code saved as PNG" });
    };
    img.src = "data:image/svg+xml;base64," + btoa(new XMLSerializer().serializeToString(svgEl));
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeInvite.mutateAsync(id);
      toast({ title: "Revoked", description: "Invitation has been cancelled" });
    } catch {
      toast({ title: "Error", description: "Failed to revoke", variant: "destructive" });
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.push("/profile/family")} style={backBtnStyle}>
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E" }}>Invite to Household</h1>
      </div>
      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginTop: -16, marginBottom: 16 }}>
        Invite someone who has their own Nutri account.
        To add children or dependents without an account, use <strong>Add Member</strong> instead.
      </p>

      {/* Generate Invite Card */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <UserPlus size={20} color="#99CC33" />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E" }}>Create Invitation</h3>
        </div>

        <label style={labelStyle}>Role for invitee</label>
        <select style={inputStyle} value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <label style={labelStyle}>Email (optional)</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="their@email.com"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />

        <button
          disabled={createInvite.isPending}
          onClick={handleGenerate}
          style={{ ...generateBtnStyle, opacity: createInvite.isPending ? 0.7 : 1 }}
        >
          {createInvite.isPending ? "Generating…" : "Generate Invite Link"}
        </button>

        {generatedUrl && (
          <div style={{ marginTop: 20 }}>
            {/* QR Code Card */}
            <div id="invite-qr-svg" style={{ textAlign: "center", padding: "20px 0 12px" }}>
              <QRCodeSVG
                value={generatedUrl}
                size={180}
                level="M"
                bgColor="transparent"
                fgColor="#1A1A2E"
                style={{ margin: "0 auto" }}
              />
              <p style={{ fontSize: 13, color: "#999", marginTop: 12 }}>
                Scan to join · Expires in 7 days
              </p>
            </div>

            {/* Link Box */}
            <div style={linkBoxStyle}>
              <code style={{ fontSize: 12, wordBreak: "break-all", flex: 1 }}>{generatedUrl}</code>
              <button onClick={handleCopy} style={copyBtnStyle} title="Copy link">
                {copied ? <Check size={16} color="#99CC33" /> : <Copy size={16} />}
              </button>
            </div>

            {/* Share & Download buttons */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleCopy} style={actionBtnStyle}>
                <Copy size={14} /> Copy Link
              </button>
              <button onClick={handleShare} style={actionBtnStyle}>
                <Share2 size={14} /> Share
              </button>
              <button onClick={handleDownloadQR} style={actionBtnStyle}>
                <Download size={14} /> Save QR
              </button>
            </div>

            {/* Email sent confirmation */}
            {emailWasQueued && inviteEmail && (
              <div style={emailConfirmStyle}>
                <Mail size={14} color="#7AB52E" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Email invitation sent to <strong>{inviteEmail}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Clock size={20} color="#999" />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E" }}>Pending Invitations</h3>
        </div>

        {isLoading ? (
          <p style={{ color: "#999", fontSize: 14 }}>Loading…</p>
        ) : invitations.length === 0 ? (
          <p style={{ color: "#999", fontSize: 14 }}>No pending invitations</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {invitations.map((inv) => (
              <div key={inv.id} style={inviteRowStyle}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {inv.invitedEmail || "Anyone with link"}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {inv.role.replace(/_/g, " ")} · Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  disabled={revokeInvite.isPending}
                  style={revokeBtnStyle}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const backBtnStyle: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "#1A1A2E", padding: 4 };
const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, padding: 20, border: "1px solid #F0F0F0",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 500, color: "#666", marginBottom: 4, marginTop: 12 };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E0E0E0",
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const generateBtnStyle: React.CSSProperties = {
  marginTop: 20, width: "100%", padding: "12px 0", borderRadius: 12, border: "none",
  background: "#99CC33", color: "white", fontSize: 15, fontWeight: 600, cursor: "pointer",
};
const linkBoxStyle: React.CSSProperties = {
  marginTop: 16, padding: "12px 14px", background: "#F9FFF0", border: "1px dashed #99CC33",
  borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
};
const copyBtnStyle: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0,
};
const inviteRowStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
  background: "#FAFAFA", borderRadius: 10,
};
const revokeBtnStyle: React.CSSProperties = {
  background: "none", border: "1px solid #E74C3C", borderRadius: 8,
  color: "#E74C3C", padding: 6, cursor: "pointer", flexShrink: 0,
};
const actionBtnStyle: React.CSSProperties = {
  flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
  padding: "10px 0", borderRadius: 10, border: "1px solid #E0E0E0",
  background: "white", fontSize: 13, fontWeight: 500, color: "#444", cursor: "pointer",
  transition: "border-color 0.15s, background 0.15s",
};
const emailConfirmStyle: React.CSSProperties = {
  display: "flex", alignItems: "flex-start", gap: 8, marginTop: 12,
  padding: "10px 14px", background: "#F0F9E8", border: "1px solid #D4EDAA",
  borderRadius: 10, fontSize: 13, color: "#3D6B10", lineHeight: 1.4,
};
