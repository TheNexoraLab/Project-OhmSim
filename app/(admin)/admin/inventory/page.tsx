import { Suspense } from "react";
import type { Metadata } from "next";
import { InventoryClient } from "./inventory-client";

export const metadata: Metadata = {
  title: "Inventory & Safety Stock Control — OhmSim Admin",
  description:
    "Monitor warehouse SKU unit counts, safety stock thresholds, and log stock adjustments across OhmSim.",
};

export default function AdminInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          </div>
          <div className="h-96 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
        </div>
      }
    >
      <InventoryClient />
    </Suspense>
  );
}

