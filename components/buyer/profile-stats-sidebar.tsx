"use client";

import React from "react";
import { useBom } from "@/hooks/use-bom";
import { useCart } from "@/hooks/use-cart";
import { getMockOrders } from "@/services/order-service";

export function ProfileStatsSidebar() {
  const { bomProjects } = useBom();
  const { cartTotal } = useCart();
  const mockOrders = getMockOrders();

  const stats = [
    {
      label: "Orders Placed",
      value: String(mockOrders.length),
      colorClass: "text-mocha-accent",
      mono: true,
      id: "stat-orders-placed",
    },
    {
      label: "BOM Projects",
      value: String(bomProjects.length),
      colorClass: "text-mocha-accent-secondary",
      mono: true,
      id: "stat-bom-projects",
    },
    {
      label: "Items in Cart",
      value: String(cartTotal),
      colorClass: "text-mocha-accent-strong",
      mono: true,
      id: "stat-cart-items",
    },
    {
      label: "Member Since",
      value: "Aug 2026",
      colorClass: "text-mocha-text-subtle",
      mono: false,
      id: "stat-member-since",
    },
  ];

  return (
    <div className="w-full lg:w-[220px] shrink-0 grid grid-cols-2 lg:flex lg:flex-col gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          id={s.id}
          className="p-4 flex flex-col gap-1 rounded-[14px] bg-mocha-panel border border-mocha-border shadow-sm"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted">{s.label}</p>
          <p className={`text-xl font-bold tracking-tight ${s.colorClass} ${s.mono ? "font-mono" : ""}`}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
