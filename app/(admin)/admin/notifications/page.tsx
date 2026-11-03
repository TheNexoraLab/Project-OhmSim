import { Suspense } from "react";
import type { Metadata } from "next";
import { NotificationsClient } from "./notifications-client";

export const metadata: Metadata = {
  title: "Operational Notifications Log — OhmSim Admin",
  description:
    "System activity feed for low stock warnings, new hardware orders, courier dispatches, and support chat pings.",
};

export default function AdminNotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="h-16 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-24 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-24 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          </div>
        </div>
      }
    >
      <NotificationsClient />
    </Suspense>
  );
}

