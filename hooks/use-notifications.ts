"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import {
    fetchNotifications,
    fetchUnreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    evaluateNotifications,
} from "@/lib/notification-api";
import { useEffect, useRef } from "react";

// ── Query Keys ──────────────────────────────────────────────────────────────

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useNotifications(params?: {
    type?: string;
    limit?: number;
    offset?: number;
}) {
    const { isAuthed } = useUser();
    return useQuery({
        queryKey: [...NOTIFICATIONS_KEY, params],
        queryFn: () => fetchNotifications(params),
        staleTime: 30_000,
        enabled: isAuthed,
    });
}

export function useUnreadCount() {
    const { isAuthed } = useUser();
    return useQuery({
        queryKey: UNREAD_COUNT_KEY,
        queryFn: fetchUnreadCount,
        refetchInterval: isAuthed ? 60_000 : false, // Poll every 60s only when authed; Realtime handles instant updates
        staleTime: 10_000,
        enabled: isAuthed, // Disable entirely when not authenticated to prevent 401 spam
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

export function useEvaluateNotifications() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: evaluateNotifications,
        onSuccess: (data) => {
            if (data.dispatched > 0) {
                queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
                queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
            }
        },
    });
}

/**
 * Fire-once hook: evaluates notification triggers on first mount.
 * Uses a ref to ensure it runs exactly once per page load / app mount.
 */
export function useAutoEvaluate() {
    const evaluated = useRef(false);
    const { mutate } = useEvaluateNotifications();

    useEffect(() => {
        if (evaluated.current) return;
        evaluated.current = true;
        mutate();
    }, [mutate]);
}
