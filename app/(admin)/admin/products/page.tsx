import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ProductsClient } from "./products-client";

export const metadata: Metadata = {
  title: "Product Catalog Management | OhmSim Admin",
  description:
    "Manage electronic components, technical specifications, datasheets, and pricing.",
};

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 bg-[#11111B]">
          <div className="w-8 h-8 rounded-full border-2 border-[#89B4FA] border-t-transparent animate-spin" />
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}

