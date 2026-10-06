import React from "react";
import type { Metadata } from "next";
import { OrdersClient } from "./orders-client";

export const metadata: Metadata = {
  title: "My Orders | OhmSim",
  description: "View and track component orders, deliveries, and store pickups on OhmSim.",
};

export default function OrdersPage() {
  return <OrdersClient />;
}
