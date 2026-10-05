import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CartClient } from "./cart-client";

export const metadata: Metadata = {
  title: "Shopping Cart | OhmSim",
  description: "Review items, manage BOM bundles, and proceed to checkout with Region III delivery.",
};

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 bg-mocha-bg">
          <div className="w-8 h-8 rounded-full border-2 border-mocha-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <CartClient />
    </Suspense>
  );
}
