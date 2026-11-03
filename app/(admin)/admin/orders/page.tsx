import React, { Suspense } from "react";
import type { Metadata } from "next";
import { OrdersClient } from "./orders-client";

export const metadata: Metadata = {
  title: "Order Management | OhmSim Admin",
  description:
    "Manage customer orders, Region III COD courier dispatch, and Campus Lab pickup fulfillment.",
};

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 bg-[#11111B]">
          <div className="w-8 h-8 rounded-full border-2 border-[#89B4FA] border-t-transparent animate-spin" />
        </div>
      }
    >
      <OrdersClient />
    </Suspense>
  );
}
