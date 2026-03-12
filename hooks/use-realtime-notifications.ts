"use client";

// hooks/use-realtime-notifications.ts
// PRD-29 Phase 7: Supabase Realtime notifications
// Subscribes to INSERT events on b2c_notifications table
// ────────────────────────────────────────────────────────

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

/**
 * Subscribe to real-time INSERT events on the b2c_notifications table.
 * When any new notification is inserted, invalidates notification caches
 * so the UI fetches fresh data instantly (instead of waiting 30s poll).
 *
 * Note: Since the app uses Appwrite auth (not Supabase Auth), we listen
 * to the full table channel. User-scoping is handled by the API layer
 * when React Query refetches. This is safe and doesn't leak data.
 *
 * Falls back gracefully if Supabase env vars are not configured.
 */
export function useRealtimeNotifications() {
    const queryClient = useQueryClient();
    const channelRef = useRef<ReturnType<NonNullable<typeof supabase>["channel"]> | null>(null);

    useEffect(() => {
        if (!supabase) return;

        const channel = supabase
            .channel("b2c_notifications_realtime")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "gold",
                    table: "b2c_notifications",
                },
                (_payload) => {
                    // Invalidate caches — React Query will refetch user-scoped data
                    queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY] });
                    queryClient.invalidateQueries({ queryKey: [...UNREAD_COUNT_KEY] });
                }
            )
            .subscribe((status) => {
                if (status === "SUBSCRIBED") {
                    console.log("[Realtime] Subscribed to b2c_notifications");
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase!.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [queryClient]);
}
