"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { INITIAL_NOTIFICATIONS } from "@/lib/mocks/notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";

type AdminNotificationCategory = "ORDERS" | "INVENTORY" | "SYSTEM";
type AdminNotificationTab = "ALL" | AdminNotificationCategory;

interface AdminNotificationEntry {
  id: string;
  category: AdminNotificationCategory;
  severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  title: string;
  body: string;
  time: string;
  group: "Today" | "Yesterday" | "Earlier";
  read: boolean;
  referenceCode?: string;
  actionHref: string;
  actionLabel: string;
}

const NOTIFICATION_TABS: Array<{ id: AdminNotificationTab; label: string }> = [
  { id: "ALL", label: "ALL" },
  { id: "ORDERS", label: "ORDERS" },
  { id: "INVENTORY", label: "INVENTORY" },
  { id: "SYSTEM", label: "SYSTEM" },
];

const CATEGORY_BADGE_STYLES: Record<
  AdminNotificationCategory,
  { color: string; bg: string; border: string }
> = {
  ORDERS: {
    color: "#89B4FA",
    bg: "rgba(137, 180, 250, 0.12)",
    border: "rgba(137, 180, 250, 0.3)",
  },
  INVENTORY: {
    color: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.12)",
    border: "rgba(249, 226, 175, 0.3)",
  },
  SYSTEM: {
    color: "#CBA6F7",
    bg: "rgba(203, 166, 247, 0.12)",
    border: "rgba(203, 166, 247, 0.3)",
  },
};

function buildAdminNotifications(): AdminNotificationEntry[] {
  const fromFixture: AdminNotificationEntry[] = INITIAL_NOTIFICATIONS.map(
    (item) => {
      if (item.type === "order") {
        return {
          id: `adm-${item.id}`,
          category: "ORDERS",
          severity: item.read ? "SUCCESS" : "INFO",
          title: item.title,
          body: item.body,
          time: item.time,
          group: item.group,
          read: item.read,
          referenceCode: item.orderNumber ? `#${item.orderNumber}` : undefined,
          actionHref: "/admin/orders",
          actionLabel: "Inspect Order",
        };
      }
      if (item.type === "stock") {
        return {
          id: `adm-${item.id}`,
          category: "INVENTORY",
          severity: "WARNING",
          title: item.title,
          body: item.body,
          time: item.time,
          group: item.group,
          read: item.read,
          referenceCode:
            item.productId === "6"
              ? "DHT22-SENSOR-MOD"
              : "OLED-096-I2C-BLU",
          actionHref: "/admin/inventory",
          actionLabel: "Adjust Stock",
        };
      }
      if (item.type === "chat") {
        return {
          id: `adm-${item.id}`,
          category: "SYSTEM",
          severity: "INFO",
          title: "Customer Chat Ping — ESP32 VIN Regulation",
          body: "Alex Rivera sent a follow-up question in Support Chat regarding #OHM-2026-089.",
          time: item.time,
          group: item.group,
          read: false,
          referenceCode: "#OHM-2026-089",
          actionHref: "/admin/chat",
          actionLabel: "Open Support Chat",
        };
      }
      return {
        id: `adm-${item.id}`,
        category: "SYSTEM",
        severity: "INFO",
        title: item.title,
        body: item.body,
        time: item.time,
        group: item.group,
        read: item.read,
        actionHref: "/admin/settings",
        actionLabel: "Review Settings",
      };
    },
  );

  const extraAdminAlerts: AdminNotificationEntry[] = [
    {
      id: "adm-extra-1",
      category: "ORDERS",
      severity: "WARNING",
      title: "New Order Placed — Campus Lab Pickup",
      body: "Engr. Camille Santos placed order #OHM-2026-092 (8 units • ₱1,740.00) for Building 3, Room 204 pickup.",
      time: "4m ago",
      group: "Today",
      read: false,
      referenceCode: "#OHM-2026-092",
      actionHref: "/admin/orders",
      actionLabel: "Confirm Order",
    },
    {
      id: "adm-extra-2",
      category: "INVENTORY",
      severity: "CRITICAL",
      title: "Out of Stock Trigger — NE555-DIP8-TIMER",
      body: "NE555 Precision Timer IC (DIP-8) reached 0 units in warehouse bin C-14. Immediate restock required.",
      time: "35m ago",
      group: "Today",
      read: false,
      referenceCode: "NE555-DIP8-TIMER",
      actionHref: "/admin/inventory",
      actionLabel: "Restock SKU",
    },
  ];

  return [...extraAdminAlerts, ...fromFixture];
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<AdminNotificationEntry[]>(
    () => buildAdminNotifications(),
  );
  const [activeTab, setActiveTab] = useState<AdminNotificationTab>("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const tabCounts = useMemo<Record<AdminNotificationTab, number>>(() => {
    const counts: Record<AdminNotificationTab, number> = {
      ALL: notifications.length,
      ORDERS: 0,
      INVENTORY: 0,
      SYSTEM: 0,
    };
    for (const item of notifications) {
      counts[item.category] += 1;
    }
    return counts;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab !== "ALL" && item.category !== activeTab) return false;
      if (showUnreadOnly && item.read) return false;
      return true;
    });
  }, [notifications, activeTab, showUnreadOnly]);

  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast("All operational notifications marked as read.", "success");
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  };

  return (
    <div
      data-testid="admin-notifications-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F9E2AF]/30 bg-[#F9E2AF]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#F9E2AF] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F9E2AF]" />
              OPERATIONAL ALERTS &amp; EVENT LOG
            </span>
            {unreadCount > 0 ? (
              <Badge variant="warning" className="font-mono">
                {unreadCount} UNREAD
              </Badge>
            ) : (
              <Badge variant="success" className="font-mono">
                ALL CAUGHT UP
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Notifications Log
          </h1>
          <p className="mt-0.5 text-xs text-[#BAC2DE] sm:text-sm">
            Real-time system feed for low stock warnings, new order placements,
            Region III courier dispatches, and support chat pings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowUnreadOnly((prev) => !prev)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              showUnreadOnly
                ? "border-[#89B4FA] bg-[#89B4FA]/14 text-[#89B4FA]"
                : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:text-[#CDD6F4]"
            }`}
          >
            {showUnreadOnly ? "Unread Only" : "Show Unread Only"}
          </button>

          <Button
            type="button"
            variant="accent"
            size="small"
            disabled={unreadCount === 0}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs (ALL, ORDERS, INVENTORY, SYSTEM) */}
      <Surface
        variant="panel"
        className="border border-[#313244] bg-[#1E1E2E] p-4"
      >
        <div
          role="tablist"
          aria-label="Filter notifications by category"
          className="flex flex-wrap items-center gap-2"
        >
          {NOTIFICATION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={
                  isActive
                    ? {
                        color: "#89B4FA",
                        backgroundColor: "rgba(137, 180, 250, 0.14)",
                        borderColor: "rgba(137, 180, 250, 0.45)",
                      }
                    : undefined
                }
                className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "shadow-xs"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] ${
                    isActive
                      ? "bg-[#89B4FA]/20 text-[#89B4FA]"
                      : "bg-[#313244]/70 text-[#BAC2DE]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Surface>

      {/* Operational Alerts Feed */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Surface
            variant="panel"
            className="border border-[#313244] bg-[#1E1E2E] p-12 text-center"
          >
            <p className="text-sm font-semibold text-[#CDD6F4]">
              No notifications in this category
            </p>
            <p className="mt-1 text-xs text-[#A6ADC8]">
              Switch tabs or disable the Unread Only filter to view earlier
              events.
            </p>
          </Surface>
        ) : (
          filteredNotifications.map((item) => {
            const catStyle = CATEGORY_BADGE_STYLES[item.category];
            const severityDotColor =
              item.severity === "CRITICAL"
                ? "#F38BA8"
                : item.severity === "WARNING"
                  ? "#F9E2AF"
                  : item.severity === "SUCCESS"
                    ? "#A6E3A1"
                    : "#89B4FA";

            return (
              <Surface
                key={item.id}
                variant="panel"
                className={`border p-4 transition-colors ${
                  item.read
                    ? "border-[#313244] bg-[#1E1E2E]/75"
                    : "border-[#89B4FA]/45 bg-[#1E1E2E]"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: severityDotColor }}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2 py-0.5 font-mono text-[10px] font-bold"
                          style={{
                            color: catStyle.color,
                            backgroundColor: catStyle.bg,
                            border: `1px solid ${catStyle.border}`,
                          }}
                        >
                          {item.category}
                        </span>
                        {item.referenceCode && (
                          <span className="rounded border border-[#313244] bg-[#181825] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#94E2D5]">
                            {item.referenceCode}
                          </span>
                        )}
                        {!item.read && (
                          <span className="rounded-full bg-[#89B4FA]/20 px-2 py-0.2 font-mono text-[10px] font-bold text-[#89B4FA]">
                            NEW
                          </span>
                        )}
                        <span className="font-mono text-xs text-[#A6ADC8]">
                          {item.time} • {item.group}
                        </span>
                      </div>

                      <h2 className="mt-1.5 text-sm font-bold text-[#CDD6F4]">
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#BAC2DE]">
                        {item.body}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Individual Read Toggle + Deep Link */}
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(item.id)}
                      className="rounded-lg border border-[#313244] bg-[#181825] px-2.5 py-1.5 text-xs font-medium text-[#BAC2DE] transition-colors hover:border-[#45475A] hover:text-[#CDD6F4]"
                    >
                      {item.read ? "Mark Unread" : "Mark Read"}
                    </button>

                    <Link
                      href={item.actionHref}
                      prefetch={false}
                      className="rounded-lg border border-[#89B4FA]/40 bg-[#89B4FA]/12 px-3 py-1.5 text-xs font-semibold text-[#89B4FA] transition-colors hover:bg-[#89B4FA]/20"
                    >
                      {item.actionLabel} →
                    </Link>
                  </div>
                </div>
              </Surface>
            );
          })
        )}
      </div>
    </div>
  );
}

