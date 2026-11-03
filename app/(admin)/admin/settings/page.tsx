import { Suspense } from "react";
import type { Metadata } from "next";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Store & Hub Settings — OhmSim Admin",
  description:
    "Configure Campus Lab Pickup Hub location, Region III shipping fee rules, and administrator security preferences.",
};

export default function AdminSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="h-14 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="h-72 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="h-72 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
        </div>
      }
    >
      <SettingsClient />
    </Suspense>
  );
}

