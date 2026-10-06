import type { NotificationItem } from "@/types/notification";
import { INITIAL_NOTIFICATIONS } from "@/lib/mocks/notifications";

type Listener = () => void;

class NotificationStore {
  private notifications: NotificationItem[] = [...INITIAL_NOTIFICATIONS];
  private listeners: Set<Listener> = new Set();

  getNotifications(): NotificationItem[] {
    return [...this.notifications];
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
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
    if (changed) this.emit();
  }

  markAllAsRead(): void {
    const hasUnread = this.notifications.some((n) => !n.read);
    if (hasUnread) {
      this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
      this.emit();
    }
  }

  dismiss(id: string): void {
    const prevLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    if (this.notifications.length !== prevLen) {
      this.emit();
    }
  }

  clearAll(): void {
    if (this.notifications.length > 0) {
      this.notifications = [];
      this.emit();
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
