"use client";

import { useSyncExternalStore } from "react";
import { notificationStore, getUnreadNotificationsCount, getInitialUnreadNotificationsCount } from "@/services/notification-service";

const subscribe = (listener: () => void) => notificationStore.subscribe(listener);
const getServerSnapshot = getInitialUnreadNotificationsCount;

export function useNotificationCount() {
  return useSyncExternalStore(subscribe, getUnreadNotificationsCount, getServerSnapshot);
}
