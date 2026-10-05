import React, { Suspense } from "react";
import type { Metadata } from "next";
import { BomClient } from "./bom-client";

export const metadata: Metadata = {
  title: "BOM Projects Workspace | OhmSim",
  description: "Organize, manage component requirements, export Bill of Materials, and transfer project bundles to cart.",
};

export default function BomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 bg-mocha-bg">
          <div className="w-8 h-8 rounded-full border-2 border-mocha-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <BomClient />
    </Suspense>
  );
}
