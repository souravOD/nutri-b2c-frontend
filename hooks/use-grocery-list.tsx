"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiAddGroceryItem,
  apiDeleteGroceryItem,
  apiGenerateGroceryList,
  apiGetGroceryListDetail,
  apiGetGroceryLists,
  apiGetGrocerySubstitutions,
  apiUpdateGroceryListStatus,
  apiUpdateGroceryItem,
} from "@/lib/api";
import type {
  GenerateGroceryListPayload,
  GroceryListDetailResponse,
  GrocerySubstitutionCandidate,
  ShoppingList,
  UpdateGroceryItemPayload,
} from "@/lib/types";

export function useGroceryLists(status?: string) {
  const { data, isLoading, error, refetch } = useQuery<{ lists: ShoppingList[] }>({
    queryKey: ["grocery-lists", status],
    queryFn: () => apiGetGroceryLists(status),
    staleTime: 15_000,
    refetchInterval: status === "active" || !status ? 15_000 : false,
  });

  return {
    lists: data?.lists ?? [],
    isLoading,
    error,
    refetch,
  };
}

export function useGroceryListDetail(listId: string | null) {
  const { data, isLoading, error, refetch } = useQuery<GroceryListDetailResponse>({
    queryKey: ["grocery-list", listId],
    queryFn: () => apiGetGroceryListDetail(listId!),
    enabled: Boolean(listId),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  return {
    list: data?.list ?? null,
    items: data?.items ?? [],
    estimatedTotal: data?.estimatedTotal ?? 0,
    summary: data?.summary ?? null,
    isLoading,
    error,
    refetch,
  };
}

export function useGenerateGroceryList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateGroceryListPayload) => apiGenerateGroceryList(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["grocery-lists"] });
      qc.setQueryData(["grocery-list", data.list.id], {
        list: data.list,
        items: data.items,
        estimatedTotal: data.estimatedTotal,
        summary: {
          totalItems: data.items.length,
          purchasedItems: data.items.filter((i) => i.isPurchased).length,
          estimatedTotal: data.estimatedTotal,
          purchasedActualTotal: data.items
            .filter((i) => i.isPurchased)
            .reduce((sum, i) => sum + Number(i.actualPrice || 0), 0),
        },
      } as GroceryListDetailResponse);
    },
  });
}

export function useUpdateGroceryItem(listId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: UpdateGroceryItemPayload }) =>
      apiUpdateGroceryItem(listId!, itemId, payload),
    onMutate: async ({ itemId, payload }) => {
      if (!listId) return;
      await qc.cancelQueries({ queryKey: ["grocery-list", listId] });
      const previous = qc.getQueryData<GroceryListDetailResponse>(["grocery-list", listId]);

      if (previous) {
        qc.setQueryData<GroceryListDetailResponse>(["grocery-list", listId], {
          ...previous,
          items: previous.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  ...(payload.isPurchased !== undefined ? { isPurchased: payload.isPurchased } : {}),
                  ...(payload.actualPrice !== undefined ? { actualPrice: payload.actualPrice } : {}),
                  ...(payload.substitutedProductId ? { substitutedProductId: payload.substitutedProductId } : {}),
                }
              : item
          ),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous && listId) {
        qc.setQueryData(["grocery-list", listId], ctx.previous);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grocery-list", listId] });
      qc.invalidateQueries({ queryKey: ["grocery-lists"] });
    },
  });
}

export function useAddGroceryItem(listId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      itemName: string;
      quantity: number;
      unit?: string;
      category?: string;
      estimatedPrice?: number;
    }) => apiAddGroceryItem(listId!, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grocery-list", listId] });
      qc.invalidateQueries({ queryKey: ["grocery-lists"] });
    },
  });
}

export function useDeleteGroceryItem(listId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => apiDeleteGroceryItem(listId!, itemId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grocery-list", listId] });
      qc.invalidateQueries({ queryKey: ["grocery-lists"] });
    },
  });
}

export function useUpdateGroceryListStatus(listId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (status: "active" | "purchased") =>
      apiUpdateGroceryListStatus(listId!, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grocery-list", listId] });
      qc.invalidateQueries({ queryKey: ["grocery-lists"] });
    },
  });
}

export function useGrocerySubstitutions(listId: string | null, itemId: string | null, enabled = true) {
  const { data, isLoading, error, refetch } = useQuery<{ substitutions: GrocerySubstitutionCandidate[] }>({
    queryKey: ["grocery-substitutions", listId, itemId],
    queryFn: () => apiGetGrocerySubstitutions(listId!, itemId!),
    enabled: Boolean(enabled && listId && itemId),
    staleTime: 60_000,
  });

  return {
    substitutions: data?.substitutions ?? [],
    isLoading,
    error,
    refetch,
  };
}

