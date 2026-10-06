import React from "react";
import type { Metadata } from "next";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Notifications | OhmSim",
  description: "View order status updates, component restock alerts, and support messages on OhmSim.",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
