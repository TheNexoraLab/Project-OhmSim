import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoriesClient } from "./categories-client";

export const metadata: Metadata = {
  title: "Product Categories & Taxonomy — OhmSim Admin",
  description:
    "Manage hardware catalog categories, taxonomy slugs, and SKU allocation across OhmSim.",
};

export default function AdminCategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-20 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="h-40 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-40 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-40 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
            <div className="h-40 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
          </div>
          <div className="h-80 animate-pulse rounded-xl border border-[#313244] bg-[#1E1E2E]" />
        </div>
      }
    >
      <CategoriesClient />
    </Suspense>
  );
}

