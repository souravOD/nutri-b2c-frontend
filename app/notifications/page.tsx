"use client";

import { useState } from "react";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { NotificationFilters } from "@/components/notifications/notification-filters";
import { ArrowLeft, CheckCheck, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("");
  const { data, isLoading } = useNotifications({
    type: activeFilter || undefined,
    limit: 10,
  });
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
  const notifications = (data?.notifications ?? [])
    .filter((n) => {
      // Always show unread
      if (!n.isRead) return true;
      // Keep read notifications for 2 hours after they were read
      if (n.readAt) return Date.now() - new Date(n.readAt).getTime() < TWO_HOURS_MS;
      // Fallback: keep if created within the last 2 hours
      return Date.now() - new Date(n.createdAt).getTime() < TWO_HOURS_MS;
    })
    .slice(0, 10);
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="notifications-page">
      {/* Header */}
      <div className="notifications-header">
        <button className="back-btn" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </button>
        <h1>Notifications</h1>
        {hasUnread && (
          <button
            className="mark-all-btn"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <CheckCheck size={16} />
            <span>Read all</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="filters-container">
        <NotificationFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Notification List */}
      <div className="notifications-list">
        {isLoading ? (
          <div className="empty-state">
            <div className="loading-spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} strokeWidth={1.5} color="#CCC" />
            <h3>No notifications</h3>
            <p>You&apos;re all caught up! We&apos;ll notify you when something important happens.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .notifications-page {
          max-width: 680px;
          margin: 0 auto;
          padding: 0 16px 100px;
        }
        .notifications-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 0 16px;
          position: sticky;
          top: 0;
          background: white;
          z-index: 10;
        }
        .notifications-header h1 {
          flex: 1;
          font-size: 22px;
          font-weight: 700;
          color: #1A1A2E;
          margin: 0;
        }
        .back-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid #E0E0E0;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #333;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: #F5F5F5;
        }
        .mark-all-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: none;
          background: #99CC33;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .mark-all-btn:hover {
          background: #88BB22;
        }
        .mark-all-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .filters-container {
          margin-bottom: 16px;
        }
        .notifications-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 60px 20px;
          color: #999;
        }
        .empty-state h3 {
          margin: 16px 0 8px;
          color: #666;
          font-size: 16px;
        }
        .empty-state p {
          font-size: 14px;
          color: #999;
          margin: 0;
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #E0E0E0;
          border-top-color: #99CC33;
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
