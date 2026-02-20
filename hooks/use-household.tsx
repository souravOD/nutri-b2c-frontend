"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetHouseholdMembers,
  apiAddFamilyMember,
  apiUpdateMemberHealth,
} from "@/lib/api";
import type { HouseholdMembersResponse, HouseholdMember } from "@/lib/types";

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
      age?: number;
      gender?: string;
      householdRole?: string;
    }) => apiAddFamilyMember(data),
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
        allergenIds?: string[];
        dietIds?: string[];
        conditionIds?: string[];
      };
    }) => apiUpdateMemberHealth(memberId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["household-members"] });
    },
  });
}
