"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Notification } from "@/lib/notification-api";

interface NotificationItemProps {
    notification: Notification;
    onMarkRead: (id: string) => void;
}

const TYPE_ICONS: Record<string, string> = {
    meal: "🍽️",
    nutrition: "📊",
    grocery: "🛒",
    budget: "💰",
    family: "👨‍👩‍👧‍👦",
    system: "⚙️",
};

const TYPE_COLORS: Record<string, string> = {
    meal: "#FF6B35",
    nutrition: "#99CC33",
    grocery: "#4ECDC4",
    budget: "#FFD93D",
    family: "#6C5CE7",
    system: "#A8A8A8",
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export function NotificationItem({
    notification,
    onMarkRead,
}: NotificationItemProps) {
    const router = useRouter();

    const handleClick = () => {
        // Mark as read
        if (!notification.isRead) {
            onMarkRead(notification.id);
        }

        // Navigate to action URL if present
        if (notification.actionUrl) {
            // Internal paths start with /
            if (notification.actionUrl.startsWith("/")) {
                router.push(notification.actionUrl);
            } else {
                window.open(notification.actionUrl, "_blank");
            }
        }
    };

    return (
        <div
            className={`notification-item ${notification.isRead ? "read" : "unread"}`}
            onClick={handleClick}
            style={{ cursor: notification.actionUrl || !notification.isRead ? "pointer" : "default" }}
        >
            <div className="notification-icon-wrapper">
                <div
                    className="notification-type-icon"
                    style={{
                        backgroundColor: `${TYPE_COLORS[notification.type] || "#A8A8A8"}15`,
                        color: TYPE_COLORS[notification.type] || "#A8A8A8",
                    }}
                >
                    {TYPE_ICONS[notification.type] || "📌"}
                </div>
                {!notification.isRead && <div className="unread-dot" />}
            </div>

            <div className="notification-content">
                <h4 className="notification-title">{notification.title}</h4>
                {notification.body && (
                    <p className="notification-body">{notification.body}</p>
                )}
                <span className="notification-time">{timeAgo(notification.createdAt)}</span>
            </div>

            <style jsx>{`
        .notification-item {
          display: flex;
          gap: 12px;
          padding: 16px;
          border-radius: 12px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .notification-item.unread {
          background: #F0F9E8;
          border-color: #E0F0D0;
        }
        .notification-item.unread:hover {
          background: #E8F5DE;
        }
        .notification-item.read {
          background: #FAFAFA;
        }
        .notification-icon-wrapper {
          position: relative;
          flex-shrink: 0;
        }
        .notification-type-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .unread-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          background: #99CC33;
          border-radius: 50%;
          border: 2px solid white;
        }
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        .notification-title {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 600;
          color: #1A1A2E;
          line-height: 1.3;
        }
        .notification-body {
          margin: 0 0 6px;
          font-size: 13px;
          color: #666;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .notification-time {
          font-size: 12px;
          color: #999;
        }
      `}</style>
        </div>
    );
}
