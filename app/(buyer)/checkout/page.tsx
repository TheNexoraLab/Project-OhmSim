import React, { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = {
  title: "Checkout | OhmSim",
  description: "Complete your order with Central Luzon delivery or Campus Lab pickup on OhmSim.",
};

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 bg-mocha-bg">
          <div className="w-8 h-8 rounded-full border-2 border-mocha-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
