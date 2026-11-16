import type { NotificationItem, NotificationType } from "@/types/notification";
import { INITIAL_NOTIFICATIONS } from "@/lib/mocks/notifications";
import { toast } from "@/components/ui/toast";

type Listener = () => void;

interface ApiNotification {
  id: string;
  type: string;
  title: string;
  message?: string;
  content?: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  link?: string;
}

class NotificationStore {
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private listeners: Set<Listener> = new Set();
  private seenNotificationIds: Set<string> = new Set(INITIAL_NOTIFICATIONS.map((n) => n.id));
  private isInitialSync = true;

  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  async syncFromApi(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          const mappedNotifications: NotificationItem[] = data.notifications.map(
            (n: ApiNotification) => {
              const rawType = (n.type || "system").toLowerCase();
              const type: NotificationType =
                rawType === "order" ||
                rawType === "stock" ||
                rawType === "chat" ||
                rawType === "system"
                  ? rawType
                  : "system";

              const dateObj = new Date(n.createdAt);
              const now = new Date();
              const isToday =
                dateObj.toDateString() === now.toDateString();

              return {
                id: n.id,
                type,
                title: n.title,
                body: n.message || n.content || "",
                time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                group: isToday ? "Today" : "Earlier",
                read: Boolean(n.read),
                linkHref: n.actionUrl || n.link || undefined,
              };
            }
          );

          if (!this.isInitialSync) {
            // Find newly received unread notifications to alert the buyer
            const newlyReceived = mappedNotifications.filter(
              (n) => !n.read && !this.seenNotificationIds.has(n.id)
            );
            if (newlyReceived.length > 0) {
              const latest = newlyReceived[0];
              toast(`🔔 ${latest.title}: ${latest.body}`, "info");
            }
          }

          // Track seen IDs
          mappedNotifications.forEach((n) => this.seenNotificationIds.add(n.id));
          this.isInitialSync = false;

          if (mappedNotifications.length > 0) {
            this.notifications = mappedNotifications;
          }
          this.emit();
        }
      }
    } catch (error) {
      console.warn("Could not sync notifications from backend API:", error);
    }
  }

  markAsRead(id: string): void {
    let changed = false;
    this.notifications = this.notifications.map((n) => {
      if (n.id === id && !n.read) {
        changed = true;
        return { ...n, read: true };
      }
      return n;
    });
    if (changed) {
      this.emit();
      if (typeof window !== "undefined") {
        fetch(`/api/notifications/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: true }),
        }).catch((err) => console.warn("Failed to mark notification read on backend:", err));
      }
    }
  }

  markAllAsRead(): void {
    const hasUnread = this.notifications.some((n) => !n.read);
    if (hasUnread) {
      this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
      this.emit();
      if (typeof window !== "undefined") {
        fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: true }),
        }).catch((err) => console.warn("Failed to mark all notifications read on backend:", err));
      }
    }
  }

  dismiss(id: string): void {
    const prevLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    if (this.notifications.length !== prevLen) {
      this.emit();
      if (typeof window !== "undefined") {
        fetch(`/api/notifications/${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "include",
        }).catch((err) => console.warn("Failed to dismiss notification on backend:", err));
      }
    }
  }

  clearAll(): void {
    if (this.notifications.length > 0) {
      this.notifications = [];
      this.emit();
      if (typeof window !== "undefined") {
        fetch("/api/notifications", {
          method: "DELETE",
          credentials: "include",
        }).catch((err) => console.warn("Failed to clear notifications on backend:", err));
      }
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in notification listener:", err);
      }
    });
  }
}

export const notificationStore = new NotificationStore();

export function syncNotificationsFromApi(): Promise<void> {
  return notificationStore.syncFromApi();
}

export function getNotifications(): NotificationItem[] {
  return notificationStore.getNotifications();
}

export function getInitialUnreadNotificationsCount(): number {
  return INITIAL_NOTIFICATIONS.filter((item) => !item.read).length;
}

export function getUnreadNotificationsCount(): number {
  return notificationStore.getUnreadCount();
}

export function markNotificationAsRead(id: string): void {
  notificationStore.markAsRead(id);
}

export function markAllNotificationsAsRead(): void {
  notificationStore.markAllAsRead();
}

export function dismissNotification(id: string): void {
  notificationStore.dismiss(id);
}

export function clearAllNotifications(): void {
  notificationStore.clearAll();
}
