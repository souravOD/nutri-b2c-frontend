import type {
  HouseholdMembersResponse,
  HouseholdMember,
  HouseholdInvitation,
  HouseholdInvitationDetail,
  HouseholdPreference,
  InvitationPreview,
} from "../types";
import { authFetch } from "./core";

// ── Members ────────────────────────────────────────────────────────────────

export async function apiGetHouseholdMembers(): Promise<HouseholdMembersResponse> {
  const r = await authFetch("/api/v1/households/members");
  return r.json();
}

export async function apiAddFamilyMember(data: {
  fullName: string;
  firstName?: string;
  email?: string | null;
  dateOfBirth?: string | null;
  age?: number;
  gender?: string;
  householdRole?: string;
}): Promise<{ member: HouseholdMember }> {
  const r = await authFetch("/api/v1/households/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiGetMemberDetail(memberId: string): Promise<{ member: HouseholdMember }> {
  const r = await authFetch(`/api/v1/households/members/${memberId}`);
  return r.json();
}

export async function apiUpdateMemberHealth(memberId: string, data: {
  targetCalories?: number;
  targetProteinG?: number;
  targetCarbsG?: number;
  targetFatG?: number;
  healthGoal?: string | null;
  dislikedIngredients?: string[];
  allergenIds?: string[];
  dietIds?: string[];
  conditionIds?: string[];
  cuisineIds?: string[];
}): Promise<{ member: HouseholdMember }> {
  const r = await authFetch(`/api/v1/households/members/${memberId}/health`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiDeleteHouseholdMember(memberId: string): Promise<void> {
  await authFetch(`/api/v1/households/members/${memberId}`, { method: "DELETE" });
}

export async function apiUpdateMemberBasicInfo(memberId: string, data: {
  fullName?: string;
  firstName?: string;
  age?: number;
  gender?: string;
  householdRole?: string;
}): Promise<{ member: HouseholdMember }> {
  const r = await authFetch(`/api/v1/households/members/${memberId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

// ── Invitations ────────────────────────────────────────────────────────────

export async function apiCreateInvitation(data: {
  role?: string;
  invitedEmail?: string;
}): Promise<{ invitation: HouseholdInvitation; inviteUrl: string; expiresAt: string; emailSent: boolean }> {
  const r = await authFetch("/api/v1/households/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiListInvitations(): Promise<{ invitations: HouseholdInvitation[] }> {
  const r = await authFetch("/api/v1/households/invitations");
  return r.json();
}

export async function apiRevokeInvitation(id: string): Promise<void> {
  await authFetch(`/api/v1/households/invitations/${id}`, { method: "DELETE" });
}

export async function apiGetInvitationByToken(token: string): Promise<HouseholdInvitationDetail> {
  const r = await authFetch(`/api/v1/invitations/${token}`);
  if (!r.ok) {
    const body = await r.json().catch(() => ({ detail: `Error ${r.status}` }));
    const err = new Error(body.detail || `invitation-details ${r.status}`);
    (err as unknown as Record<string, unknown>).status = r.status;
    throw err;
  }
  return r.json();
}

/**
 * Unauthenticated invitation preview — uses plain fetch (no JWT).
 * Returns display-safe fields only.
 */
export async function apiGetInvitationPreview(token: string): Promise<InvitationPreview> {
  // Use empty string for relative URL — goes through Next.js rewrites (same as authFetch)
  const res = await fetch(`/api/v1/invitations/${token}/preview`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
    const err = new Error(body.detail || `preview ${res.status}`);
    (err as unknown as Record<string, unknown>).status = res.status;
    throw err;
  }
  return res.json();
}

export async function apiAcceptInvitation(token: string): Promise<{ success: boolean; householdId: string }> {
  const r = await authFetch(`/api/v1/invitations/${token}/accept`, { method: "POST" });
  if (!r.ok) {
    const body = await r.json().catch(() => ({ detail: `Error ${r.status}` }));
    const err = new Error(body.detail || `accept-invitation ${r.status}`);
    (err as unknown as Record<string, unknown>).status = r.status;
    throw err;
  }
  return r.json();
}

// ── Preferences ────────────────────────────────────────────────────────────

export async function apiGetHouseholdPreferences(): Promise<{ preferences: HouseholdPreference[] }> {
  const r = await authFetch("/api/v1/households/preferences");
  return r.json();
}

export async function apiSetHouseholdPreference(data: {
  preferenceType: string;
  preferenceValue: string;
  priority?: number;
}): Promise<{ preference: HouseholdPreference }> {
  const r = await authFetch("/api/v1/households/preferences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiDeleteHouseholdPreference(id: string): Promise<void> {
  await authFetch(`/api/v1/households/preferences/${id}`, { method: "DELETE" });
}
