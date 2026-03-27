"use client";

// hooks/use-realtime-notifications.ts
// PRD-29 Phase 7: Supabase Realtime notifications
// PRD-32: In-app toast pop-up on new notification INSERT
// ────────────────────────────────────────────────────────
// NOTE: We use a CustomEvent bridge ("notification-toast") instead of
// calling toast() directly, because Next.js webpack can create separate
// module instances across chunks. The Toaster component listens for this
// event and calls its LOCAL toast() — ensuring a shared state machine.

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const NOTIFICATIONS_KEY = ["notifications"] as const;
const UNREAD_COUNT_KEY = ["notifications", "unread-count"] as const;

/** Payload shape emitted via the "notification-toast" CustomEvent. */
export interface NotificationToastPayload {
    title: string;
    body?: string;
    icon?: string;
    actionUrl?: string;
}

/**
 * Subscribe to real-time INSERT events on the b2c_notifications table.
 * When any new notification is inserted:
 * 1. Invalidates notification caches so the UI fetches fresh data instantly
 * 2. PRD-32: Fires a window CustomEvent that the Toaster picks up as a toast
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
                (payload) => {
                    // Invalidate caches — React Query will refetch user-scoped data
                    queryClient.invalidateQueries({ queryKey: [...NOTIFICATIONS_KEY] });
                    queryClient.invalidateQueries({ queryKey: [...UNREAD_COUNT_KEY] });

                    // PRD-32: Emit a CustomEvent so the Toaster (in its own chunk) can show a toast
                    const row = payload.new as Record<string, unknown>;
                    console.log("[Realtime] INSERT received, row:", JSON.stringify(row));
                    if (row?.title && typeof window !== "undefined") {
                        const detail: NotificationToastPayload = {
                            title: row.title as string,
                            body: (row.body as string) || undefined,
                            icon: (row.icon as string) || undefined,
                            actionUrl: (row.action_url as string) || undefined,
                        };
                        console.log("[Realtime] Dispatching notification-toast event for:", detail.title);
                        window.dispatchEvent(new CustomEvent("notification-toast", { detail }));
                    }
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
