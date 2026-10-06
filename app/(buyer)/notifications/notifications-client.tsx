"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem, NotificationType } from "@/types/notification";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  dismissNotification,
  clearAllNotifications,
  notificationStore,
} from "@/services/notification-service";
import { toast } from "@/components/ui/toast";

const NOTIF_ICONS: Record<
  NotificationType,
  { color: string; bg: string; icon: React.ReactNode }
> = {
  order: {
    color: "#89B4FA",
    bg: "rgba(137, 180, 250, 0.12)",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  stock: {
    color: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.12)",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  chat: {
    color: "#CBA6F7",
    bg: "rgba(203, 166, 247, 0.12)",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  system: {
    color: "#A6ADC8",
    bg: "rgba(166, 173, 200, 0.12)",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  promo: {
    color: "#F5C2E7",
    bg: "rgba(245, 194, 231, 0.12)",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 12 20 22 4 22 4 12" />
        <rect x="2" y="7" width="20" height="5" />
        <line x1="12" y1="22" x2="12" y2="7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
};

export function NotificationsClient() {
  const router = useRouter();
  const allFilterRef = useRef<HTMLButtonElement>(null);
  const [notifs, setNotifs] = useState<NotificationItem[]>(() => getNotifications());
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    return notificationStore.subscribe(() => {
      setNotifs(getNotifications());
    });
  }, []);

  const unreadCount = useMemo(() => notifs.filter((n) => !n.read).length, [notifs]);

  const visibleNotifs = useMemo(() => {
    return filter === "unread" ? notifs.filter((n) => !n.read) : notifs;
  }, [notifs, filter]);

  // Activity: order, chat, system
  const activityItems = useMemo(
    () => visibleNotifs.filter((n) => ["order", "chat", "system"].includes(n.type)),
    [visibleNotifs]
  );

  // Alerts: stock, promo
  const alertItems = useMemo(
    () => visibleNotifs.filter((n) => ["stock", "promo"].includes(n.type)),
    [visibleNotifs]
  );

  const handleCardClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    if (item.linkHref) {
      router.push(item.linkHref);
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const index = visibleNotifs.findIndex((item) => item.id === id);
    const nextId = visibleNotifs[index + 1]?.id ?? visibleNotifs[index - 1]?.id;
    dismissNotification(id);
    requestAnimationFrame(() => {
      const nextButton = nextId ? document.getElementById(`notification-open-${nextId}`) : null;
      (nextButton ?? allFilterRef.current)?.focus();
    });
    toast("Notification dismissed", "info");
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    toast("All notifications marked as read", "success");
  };

  const handleClearAll = () => {
    clearAllNotifications();
    toast("All notifications cleared", "info");
  };

  const renderNotifCard = (item: NotificationItem) => {
    const meta = NOTIF_ICONS[item.type];
    return (
      <div key={item.id} data-notification-id={item.id} data-read={item.read}
        className={`p-3 rounded-2xl border flex items-start gap-2 ${item.read ? "bg-mocha-panel border-mocha-border" : "bg-mocha-panel-raised border-mocha-accent/40"}`}>
        <button type="button" id={`notification-open-${item.id}`} onClick={() => handleCardClick(item)}
          aria-label={`${item.read ? "" : "Unread: "}${item.title}`}
          className="flex-1 min-w-0 min-h-[44px] text-left flex items-start gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
            style={{ background: meta.bg, color: meta.color, borderColor: `${meta.color}40` }}>{meta.icon}</span>
          <span className="flex-1 min-w-0">
            <span className="block text-xs font-bold text-mocha-text">{item.title}</span>
            <span className="block text-[11px] text-mocha-text-muted leading-relaxed mt-1">{item.body}</span>
            <span className="block text-[10px] font-mono text-mocha-text-subtle mt-2">{item.time} {item.linkHref && " · View →"}</span>
          </span>
        </button>
        <button type="button" onClick={(e) => handleDismiss(e, item.id)} aria-label={`Dismiss notification: ${item.title}`}
          className="w-11 h-11 shrink-0 rounded-xl text-mocha-text-muted hover:text-mocha-danger hover:bg-mocha-danger/10 flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent">✕</button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-mocha-bg">
      <div className="max-w-[1100px] w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-mocha-border mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-mocha-text tracking-tight flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-mocha-accent/15 text-mocha-accent border border-mocha-accent/30">
                  {unreadCount} new
                </span>
              )}
            </h1>
            <p className="text-xs text-mocha-text-muted mt-0.5">
              Order status changes, inventory restocks, and support updates
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-mocha-panel border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
              >
                Mark all read
              </button>
            )}
            {notifs.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-mocha-text-muted hover:text-mocha-danger hover:bg-mocha-danger/10 transition-colors min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-danger"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setFilter("all")}
            ref={allFilterRef}
            aria-pressed={filter === "all"}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent ${
              filter === "all"
                ? "bg-mocha-accent text-mocha-bg shadow-sm"
                : "bg-mocha-panel border border-mocha-border text-mocha-text-muted hover:text-mocha-text"
            }`}
          >
            All ({notifs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            aria-pressed={filter === "unread"}
            className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent ${
              filter === "unread"
                ? "bg-mocha-accent text-mocha-bg shadow-sm"
                : "bg-mocha-panel border border-mocha-border text-mocha-text-muted hover:text-mocha-text"
            }`}
          >
            Unread only ({unreadCount})
          </button>
        </div>

        {/* Content Section: 2 Columns on Desktop */}
        {visibleNotifs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center border border-mocha-border rounded-2xl bg-mocha-panel/30">
            <div className="w-16 h-16 rounded-2xl bg-mocha-panel border border-mocha-border flex items-center justify-center mb-3 text-mocha-text-muted">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-mocha-text">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </h2>
            <p className="text-xs text-mocha-text-muted mt-1 max-w-sm">
              {filter === "unread"
                ? "You're all caught up! Switch to 'All' to review previous updates."
                : "You currently have no notifications. Updates regarding orders and components will appear here."}
            </p>
            {filter === "unread" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-mocha-panel border border-mocha-border text-mocha-accent hover:border-mocha-accent transition-colors min-h-[44px]"
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-20 md:pb-6">
            {/* Column 1: Activity (Orders, Chat, System) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-mocha-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-mocha-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-mocha-blue" />
                  Activity & Orders
                </h2>
                <span className="text-[10px] font-mono text-mocha-text-muted">
                  {activityItems.length} items
                </span>
              </div>

              {activityItems.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-mocha-panel/30 border border-mocha-border text-xs text-mocha-text-muted">
                  No activity updates in this view.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {activityItems.map(renderNotifCard)}
                </div>
              )}
            </div>

            {/* Column 2: Alerts (Stock, Promo) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-mocha-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-mocha-text flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-mocha-yellow" />
                  Inventory & Promos
                </h2>
                <span className="text-[10px] font-mono text-mocha-text-muted">
                  {alertItems.length} items
                </span>
              </div>

              {alertItems.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-mocha-panel/30 border border-mocha-border text-xs text-mocha-text-muted">
                  No inventory or promotional alerts in this view.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {alertItems.map(renderNotifCard)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
