"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INITIAL_NOTIFICATIONS } from "@/lib/mocks/notifications";
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

  useEffect(() => {
    let isMounted = true;
    async function fetchAdminNotifs() {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.notifications) && data.notifications.length > 0) {
            interface ApiAdminNotif {
              id: string;
              type: string;
              title: string;
              message?: string;
              content?: string;
              createdAt: string;
              read?: boolean;
            }

            const liveAlerts: AdminNotificationEntry[] = data.notifications.map(
              (n: ApiAdminNotif) => {
                const category: AdminNotificationCategory =
                  n.type === "ORDER"
                    ? "ORDERS"
                    : n.type === "STOCK"
                    ? "INVENTORY"
                    : "SYSTEM";

                const dateObj = new Date(n.createdAt);
                const isToday =
                  dateObj.toDateString() === new Date().toDateString();

                return {
                  id: `live-${n.id}`,
                  category,
                  severity: "INFO",
                  title: n.title,
                  body: n.message || n.content || "",
                  time: dateObj.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  group: isToday ? "Today" : "Earlier",
                  read: Boolean(n.read),
                  actionHref:
                    category === "ORDERS"
                      ? "/admin/orders"
                      : category === "INVENTORY"
                      ? "/admin/inventory"
                      : "/admin/chat",
                  actionLabel:
                    category === "ORDERS"
                      ? "Inspect Order"
                      : category === "INVENTORY"
                      ? "Adjust Stock"
                      : "Open Support",
                };
              }
            );

            if (isMounted) {
              setNotifications((prev) => {
                const liveIds = new Set(liveAlerts.map((la) => la.id));
                const filteredFixtures = prev.filter((p) => !liveIds.has(p.id));
                return [...liveAlerts, ...filteredFixtures];
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch admin notifications from backend:", err);
      }
    }

    fetchAdminNotifs();
    return () => {
      isMounted = false;
    };
  }, []);

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
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-5"
    >
      {/* Header */}
      <div className="admin-page-header flex flex-col gap-4 border-b border-[#313244] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Notifications Log
          </h1>
          {unreadCount > 0 ? (
            <span className="rounded-full bg-[#313244] px-2.5 py-0.5 font-mono text-xs font-medium text-[#89B4FA]">
              {unreadCount} unread
            </span>
          ) : (
            <span className="rounded-full bg-[#181825] px-2.5 py-0.5 font-mono text-xs text-[#6C7086]">
              All caught up
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowUnreadOnly((prev) => !prev)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              showUnreadOnly
                ? "border-[#45475A] bg-[#313244] text-[#CDD6F4]"
                : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:text-[#CDD6F4]"
            }`}
          >
            {showUnreadOnly ? "Showing Unread" : "Show Unread Only"}
          </button>

          <Button
            type="button"
            variant="outline"
            size="small"
            disabled={unreadCount === 0}
            onClick={handleMarkAllAsRead}
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs (ALL, ORDERS, INVENTORY, SYSTEM) */}
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
              className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-[#45475A] bg-[#313244] text-[#CDD6F4]"
                  : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 font-mono text-[10px] ${
                  isActive
                    ? "bg-[#181825] text-[#CDD6F4]"
                    : "bg-[#11111B] text-[#6C7086]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

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
            return (
              <Surface
                key={item.id}
                variant="panel"
                className={`border p-4 transition-colors ${
                  item.read
                    ? "border-[#313244]/60 bg-[#181825]/60 hover:border-[#313244]"
                    : "border-[#313244] bg-[#1E1E2E] hover:border-[#45475A]"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        item.read ? "bg-transparent" : "bg-[#89B4FA]"
                      }`}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded border border-[#313244] bg-[#181825] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#BAC2DE]">
                          {item.category}
                        </span>
                        {item.referenceCode && (
                          <span className="font-mono text-xs text-[#A6ADC8]">
                            {item.referenceCode}
                          </span>
                        )}
                        <span className="font-mono text-xs text-[#6C7086]">
                          • {item.time} • {item.group}
                        </span>
                      </div>

                      <h2
                        className={`mt-1.5 text-sm font-semibold ${
                          item.read ? "text-[#BAC2DE]" : "text-[#CDD6F4]"
                        }`}
                      >
                        {item.title}
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-[#A6ADC8]">
                        {item.body}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Individual Read Toggle + Deep Link */}
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleToggleRead(item.id)}
                      className="rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-[#6C7086] transition-colors hover:border-[#313244] hover:text-[#BAC2DE]"
                    >
                      {item.read ? "Mark Unread" : "Mark Read"}
                    </button>

                    <Link
                      href={item.actionHref}
                      prefetch={false}
                      className="rounded-lg border border-[#313244] bg-[#181825] px-3 py-1.5 text-xs font-medium text-[#BAC2DE] transition-colors hover:border-[#45475A] hover:bg-[#313244]/50 hover:text-[#CDD6F4]"
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

