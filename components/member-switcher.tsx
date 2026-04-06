"use client";

import type { HouseholdMember } from "@/lib/types";

interface MemberSwitcherProps {
  members: HouseholdMember[];
  activeId: string;
  onChange: (memberId: string) => void;
}

export function MemberSwitcher({ members, activeId, onChange }: MemberSwitcherProps) {
  if (members.length <= 1) return null;

  return (
    <div style={containerStyle}>
      {members.map((member) => {
        const isActive = member.id === activeId;
        const initial = (member.firstName || member.fullName || "?")[0].toUpperCase();
        return (
          <button
            key={member.id}
            onClick={() => onChange(member.id)}
            style={{
              ...chipStyle,
              background: isActive ? "var(--accent)" : "#F5F5F5",
              color: isActive ? "var(--accent-foreground)" : "#666",
              border: isActive ? "2px solid var(--accent)" : "2px solid transparent",
              fontWeight: isActive ? 700 : 500,
            }}
          >
            <span style={{
              ...avatarStyle,
              background: isActive ? "rgba(255,255,255,0.3)" : "#E0E0E0",
              color: isActive ? "white" : "#999",
            }}>
              {initial}
            </span>
            <span>{member.firstName || member.fullName?.split(" ")[0] || "?"}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  overflowX: "auto",
  padding: "8px 0",
  marginBottom: 16,
};

const chipStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  borderRadius: 24,
  fontSize: 14,
  cursor: "pointer",
  transition: "all 0.15s",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const avatarStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 12,
  fontWeight: 700,
};
