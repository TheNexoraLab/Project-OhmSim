"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  notificationStore,
  getUnreadNotificationsCount,
  getInitialUnreadNotificationsCount,
  syncNotificationsFromApi,
} from "@/services/notification-service";

const subscribe = (listener: () => void) => notificationStore.subscribe(listener);
const getServerSnapshot = getInitialUnreadNotificationsCount;

export function useNotificationCount() {
  const count = useSyncExternalStore(subscribe, getUnreadNotificationsCount, getServerSnapshot);

  useEffect(() => {
    // Initial sync from backend
    syncNotificationsFromApi();

    // Live polling every 10 seconds for real-time order status updates
    const interval = setInterval(() => {
      syncNotificationsFromApi();
    }, 10000);

    const onFocus = () => syncNotificationsFromApi();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return count;
}
