"use client";

import { authFetch } from "./api";

// ── Types ───────────────────────────────────────────────────────────────────

export interface Notification {
    id: string;
    customerId: string;
    type: "meal" | "nutrition" | "grocery" | "budget" | "family" | "system";
    title: string;
    body: string | null;
    icon: string | null;
    actionUrl: string | null;
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
}

export interface NotificationsResponse {
    notifications: Notification[];
    total: number;
}

export interface UnreadCountResponse {
    count: number;
}

// ── API Functions ───────────────────────────────────────────────────────────

export async function fetchNotifications(params?: {
    type?: string;
    limit?: number;
    offset?: number;
}): Promise<NotificationsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.offset) searchParams.set("offset", String(params.offset));

    const qs = searchParams.toString();
    const url = `/api/v1/notifications${qs ? `?${qs}` : ""}`;
    const res = await authFetch(url);
    return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
    const res = await authFetch("/api/v1/notifications/unread-count");
    const data: UnreadCountResponse = await res.json();
    return data.count;
}

export async function markNotificationAsRead(
    id: string
): Promise<Notification> {
    const res = await authFetch(`/api/v1/notifications/${id}/read`, {
        method: "PATCH",
    });
    const data = await res.json();
    return data.notification;
}

export async function markAllNotificationsAsRead(): Promise<number> {
    const res = await authFetch("/api/v1/notifications/read-all", {
        method: "POST",
    });
    const data = await res.json();
    return data.markedCount;
}
