import { Suspense } from "react";
import type { Metadata } from "next";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Sales Reports & COD Liquidation — OhmSim Admin",
  description:
    "Gross revenue telemetry, Average Order Value (AOV), Region III vs Campus Lab Pickup distribution, and monthly COD liquidation ledger.",
};

export default function AdminReportsPage() {
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
          <div className="h-80 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="h-80 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
        </div>
      }
    >
      <ReportsClient />
    </Suspense>
  );
}

