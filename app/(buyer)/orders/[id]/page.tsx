import React from "react";
import type { Metadata } from "next";
import { OrderDetailClient } from "./order-detail-client";
import { getMockOrders, getMockOrderById } from "@/services/order-service";

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const orders = getMockOrders();
  return orders.map((o) => ({
    id: o.id,
  }));
}

export async function generateMetadata({ params }: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const order = getMockOrderById(id);

  if (!order) {
    return {
      title: "Order Not Found | OhmSim",
      description: "The requested order could not be located.",
    };
  }

  return {
    title: `Order ${order.orderNumber} | OhmSim`,
    description: `Track status, items, and delivery for order ${order.orderNumber}.`,
  };
}

export default async function OrderDetailPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderDetailClient orderId={id} />;
}
