"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/lib/notification-api";

// ── Query Keys ──────────────────────────────────────────────────────────────

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useNotifications(params?: {
    type?: string;
    limit?: number;
    offset?: number;
}) {
    return useQuery({
        queryKey: [...NOTIFICATIONS_KEY, params],
        queryFn: () => fetchNotifications(params),
        staleTime: 30_000,
    });
}

export function useUnreadCount() {
    return useQuery({
        queryKey: UNREAD_COUNT_KEY,
        queryFn: fetchUnreadCount,
        refetchInterval: 30_000, // Poll every 30 seconds
        staleTime: 10_000,
    });
}

export function useMarkAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        },
    });
}

export function useMarkAllAsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
            queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
        },
    });
}
