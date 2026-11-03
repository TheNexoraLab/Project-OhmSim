import { Suspense } from "react";
import type { Metadata } from "next";
import { CustomersClient } from "./customers-client";

export const metadata: Metadata = {
  title: "Customers & Lab Directory — OhmSim Admin",
  description:
    "Manage Central Luzon buyer accounts, campus lab verifications, and lifetime hardware order histories.",
};

export default function AdminCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-28 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          </div>
          <div className="h-96 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
        </div>
      }
    >
      <CustomersClient />
    </Suspense>
  );
}

