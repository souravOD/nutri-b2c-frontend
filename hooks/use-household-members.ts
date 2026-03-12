"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGetHouseholdMembers } from "@/lib/api";
import type { HouseholdMember } from "@/lib/types";

/**
 * React Query hook for fetching household members.
 * Returns members list and current user's b2c_customer_id.
 * Used by MemberSwitcher on feed/search/chat pages.
 */
export function useHouseholdMembers() {
  return useQuery<HouseholdMember[]>({
    queryKey: ["household-members"],
    queryFn: async () => {
      try {
        const res = await apiGetHouseholdMembers();
        return res.members ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 min — household doesn't change often
  });
}
