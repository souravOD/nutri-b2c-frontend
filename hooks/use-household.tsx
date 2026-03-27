"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetHouseholdMembers,
  apiAddFamilyMember,
  apiUpdateMemberHealth,
  apiUpdateMemberBasicInfo,
  apiDeleteHouseholdMember,
  apiCreateInvitation,
  apiListInvitations,
  apiRevokeInvitation,
  apiGetHouseholdPreferences,
  apiSetHouseholdPreference,
  apiDeleteHouseholdPreference,
} from "@/lib/api";
import type { HouseholdMembersResponse } from "@/lib/types";

export function useHouseholdMembers() {
  const { data, isLoading, error, refetch } = useQuery<HouseholdMembersResponse>({
    queryKey: ["household-members"],
    queryFn: () => apiGetHouseholdMembers(),
    staleTime: 60_000,
  });

  return {
    household: data?.household ?? null,
    members: data?.members ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useAddMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      fullName: string;
      firstName?: string;
      email?: string | null;
      dateOfBirth?: string | null;
      age?: number;
      gender?: string;
      householdRole?: string;
    }) => apiAddFamilyMember(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useUpdateMemberBasicInfo() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: {
        fullName?: string;
        firstName?: string;
        age?: number;
        gender?: string;
        householdRole?: string;
      };
    }) => apiUpdateMemberBasicInfo(memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useUpdateMemberHealth() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: {
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
      };
    }) => apiUpdateMemberHealth(memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => apiDeleteHouseholdMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}

// ── Invitation Hooks ────────────────────────────────────────────────────────

export function useCreateInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { role?: string; invitedEmail?: string }) =>
      apiCreateInvitation(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-invitations"] });
    },
  });
}

export function useListInvitations() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["household-invitations"],
    queryFn: () => apiListInvitations(),
    staleTime: 30_000,
  });

  return {
    invitations: data?.invitations ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useRevokeInvitation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiRevokeInvitation(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-invitations"] });
    },
  });
}

// ── Household Preferences Hooks ─────────────────────────────────────────────

export function useHouseholdPreferences() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["household-preferences"],
    queryFn: () => apiGetHouseholdPreferences(),
    staleTime: 60_000,
  });

  return {
    preferences: data?.preferences ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useSetPreference() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      preferenceType: string;
      preferenceValue: string;
      priority?: number;
    }) => apiSetHouseholdPreference(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-preferences"] });
    },
  });
}

export function useDeletePreference() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDeleteHouseholdPreference(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-preferences"] });
    },
  });
}
