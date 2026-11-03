"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { INITIAL_ORDERS as MOCK_ORDERS } from "@/lib/mocks/orders";
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mocks/products";
import type { MockOrder as Order, OrderStatus } from "@/types/order";
import type { Product } from "@/types/product";
import { formatPrice as formatCurrency, formatDate } from "@/lib/format";
import { AdminKpiCard } from "@/components/admin/admin-kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";

type SemanticStatusKey =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

type ExtendedOrderStatus = OrderStatus | "PROCESSING" | "SHIPPED";

interface ProductWithStockContract extends Product {
  stockQuantity?: number;
  minStockThreshold?: number;
}

const DEFAULT_MIN_STOCK_THRESHOLD = 15;
const UNREAD_INQUIRIES_COUNT = 3;

const SEMANTIC_STATUS_TOKENS: Record<
  SemanticStatusKey,
  {
    label: string;
    text: string;
    bg: string;
    border: string;
  }
> = {
  PENDING: {
    label: "PENDING",
    text: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.12)",
    border: "rgba(249, 226, 175, 0.32)",
  },
  PROCESSING: {
    label: "PROCESSING",
    text: "#89B4FA",
    bg: "rgba(137, 180, 250, 0.12)",
    border: "rgba(137, 180, 250, 0.32)",
  },
  SHIPPED: {
    label: "SHIPPED",
    text: "#CBA6F7",
    bg: "rgba(203, 166, 247, 0.12)",
    border: "rgba(203, 166, 247, 0.32)",
  },
  DELIVERED: {
    label: "DELIVERED",
    text: "#A6E3A1",
    bg: "rgba(166, 227, 161, 0.12)",
    border: "rgba(166, 227, 161, 0.32)",
  },
  CANCELLED: {
    label: "CANCELLED",
    text: "#F38BA8",
    bg: "rgba(243, 139, 168, 0.12)",
    border: "rgba(243, 139, 168, 0.32)",
  },
};

function resolveSemanticStatus(status: ExtendedOrderStatus): {
  semanticKey: SemanticStatusKey;
  displayLabel: string;
  detailLabel: string;
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case "PENDING":
      return {
        semanticKey: "PENDING",
        displayLabel: "PENDING",
        detailLabel: "Pending Confirmation",
        ...SEMANTIC_STATUS_TOKENS.PENDING,
      };
    case "PROCESSING":
    case "CONFIRMED":
    case "PREPARING":
    case "READY_FOR_PICKUP":
      return {
        semanticKey: "PROCESSING",
        displayLabel: "PROCESSING",
        detailLabel:
          status === "READY_FOR_PICKUP"
            ? "Ready for Pickup"
            : status === "CONFIRMED"
            ? "Confirmed"
            : "Preparing",
        ...SEMANTIC_STATUS_TOKENS.PROCESSING,
      };
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return {
        semanticKey: "SHIPPED",
        displayLabel: "SHIPPED",
        detailLabel: "Out for Delivery",
        ...SEMANTIC_STATUS_TOKENS.SHIPPED,
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        semanticKey: "DELIVERED",
        displayLabel: "DELIVERED",
        detailLabel: status === "COMPLETED" ? "Completed" : "Delivered",
        ...SEMANTIC_STATUS_TOKENS.DELIVERED,
      };
    case "CANCELLED":
    default:
      return {
        semanticKey: "CANCELLED",
        displayLabel: "CANCELLED",
        detailLabel: "Cancelled",
        ...SEMANTIC_STATUS_TOKENS.CANCELLED,
      };
  }
}

function getStockQuantity(product: ProductWithStockContract): number {
  return product.stockQuantity ?? product.stock;
}

function getMinStockThreshold(product: ProductWithStockContract): number {
  return product.minStockThreshold ?? DEFAULT_MIN_STOCK_THRESHOLD;
}

export default function AdminDashboardPage() {
  const [inspectedOrderId, setInspectedOrderId] = useState<string | null>(null);
  const [restockedSkus, setRestockedSkus] = useState<Record<string, number>>({});

  // 1. Top KPI Calculations from MOCK_ORDERS & MOCK_PRODUCTS
  const totalRevenue = useMemo(
    () => MOCK_ORDERS.reduce((sum, order) => sum + order.totalAmount, 0),
    []
  );

  const activeOrders = useMemo(
    () =>
      MOCK_ORDERS.filter((order) => {
        const { semanticKey } = resolveSemanticStatus(
          order.status as ExtendedOrderStatus
        );
        return semanticKey === "PENDING" || semanticKey === "PROCESSING";
      }),
    []
  );

  const lowStockProducts = useMemo(
    () =>
      (MOCK_PRODUCTS as ProductWithStockContract[]).filter((product) => {
        const stockQuantity =
          getStockQuantity(product) + (restockedSkus[product.sku] ?? 0);
        const minStockThreshold = getMinStockThreshold(product);
        return stockQuantity <= minStockThreshold;
      }),
    [restockedSkus]
  );

  //All low stock items from baseline fixture (so restock demo shows baseline alert count clearly)
  const baselineLowStockProducts = useMemo(
    () =>
      (MOCK_PRODUCTS as ProductWithStockContract[]).filter((product) => {
        const stockQuantity = getStockQuantity(product);
        const minStockThreshold = getMinStockThreshold(product);
        return stockQuantity <= minStockThreshold;
      }),
    []
  );

  // 2. Recent Orders Queue (5 most recent orders from MOCK_ORDERS)
  const recentOrders = useMemo<Order[]>(
    () =>
      [...MOCK_ORDERS]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    []
  );

  const inspectedOrder = useMemo(
    () => recentOrders.find((o) => o.id === inspectedOrderId) ?? null,
    [recentOrders, inspectedOrderId]
  );

  const statusDistribution = useMemo(() => {
    const counts: Record<SemanticStatusKey, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    for (const order of MOCK_ORDERS) {
      const { semanticKey } = resolveSemanticStatus(
        order.status as ExtendedOrderStatus
      );
      counts[semanticKey] += 1;
    }
    return counts;
  }, []);

  const handleRestock = (product: ProductWithStockContract) => {
    setRestockedSkus((prev) => ({
      ...prev,
      [product.sku]: (prev[product.sku] ?? 0) + 10,
    }));
    toast(
      `Queued +10 unit restock requisition for ${product.sku} (${product.name}).`,
      "success"
    );
  };

  return (
    <div
      data-testid="admin-dashboard-page"
      className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full"
    >
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#313244]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#89B4FA]/12 text-[#89B4FA] border border-[#89B4FA]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#89B4FA]" />
              FE-A02 · TELEMETRY CONSOLE
            </span>
            <span className="text-xs font-mono text-[#A6ADC8]">
              Region III Central Luzon
            </span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-[#CDD6F4] tracking-tight">
            Administrator Operations Dashboard
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#BAC2DE]">
            Real-time order queue, component stock thresholds, and fulfillment
            dispatch controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ButtonLink
            href="/admin/orders"
            variant="surface"
            size="small"
            className="text-xs font-semibold gap-1.5"
          >
            <span>Order Queue</span>
            <span className="font-mono text-[#89B4FA]">
              ({MOCK_ORDERS.length})
            </span>
          </ButtonLink>
          <ButtonLink
            href="/admin/products"
            variant="accent"
            size="small"
            className="text-xs font-bold gap-1.5"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Product</span>
          </ButtonLink>
        </div>
      </div>

      {/* 1. Top KPI Summary Grid (4 Cards) */}
      <section aria-label="Key Performance Indicators">
        <div
          data-testid="admin-kpi-grid"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          {/* Card 1: Total Revenue */}
          <AdminKpiCard
            dataTestId="kpi-total-revenue"
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle={`Across ${MOCK_ORDERS.length} recorded orders`}
            badgeText="GROSS PHP"
            badgeVariant="primary"
            accentColor="#89B4FA"
            progressPercent={84}
            progressLabel="Gross revenue target progress"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          />

          {/* Card 2: Active Orders */}
          <AdminKpiCard
            dataTestId="kpi-active-orders"
            title="Active Orders"
            value={activeOrders.length}
            subtitle="Orders in PENDING or PROCESSING state"
            badgeText={`${activeOrders.length} IN QUEUE`}
            badgeVariant="secondary"
            accentColor="#74C7EC"
            progressPercent={Math.round(
              (activeOrders.length / Math.max(1, MOCK_ORDERS.length)) * 100
            )}
            progressLabel="Active order ratio"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            }
          />

          {/* Card 3: Low Stock Alerts */}
          <AdminKpiCard
            dataTestId="kpi-low-stock-alerts"
            title="Low Stock Alerts"
            value={baselineLowStockProducts.length}
            subtitle={`SKUs at/below ${DEFAULT_MIN_STOCK_THRESHOLD} unit threshold`}
            badgeText={
              baselineLowStockProducts.length > 0 ? "NEEDS RESTOCK" : "HEALTHY"
            }
            badgeVariant={
              baselineLowStockProducts.length > 0 ? "warning" : "success"
            }
            accentColor="#F9E2AF"
            progressPercent={Math.round(
              (baselineLowStockProducts.length /
                Math.max(1, MOCK_PRODUCTS.length)) *
                100
            )}
            progressLabel="Low stock SKU share"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />

          {/* Card 4: Unread Inquiries */}
          <AdminKpiCard
            dataTestId="kpi-unread-inquiries"
            title="Unread Inquiries"
            value={UNREAD_INQUIRIES_COUNT}
            subtitle="Support, courier & academic lab threads"
            badgeText="LIVE CHAT"
            badgeVariant="success"
            accentColor="#94E2D5"
            progressPercent={60}
            progressLabel="Support queue SLA utilization"
            icon={
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
        </div>
      </section>

      {/* Main Two-Column Operational Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols on XL): 2. Recent Orders Queue Table */}
        <section
          aria-labelledby="recent-orders-heading"
          className="xl:col-span-8 flex flex-col gap-4 min-w-0"
        >
          <Surface
            variant="panel"
            data-testid="recent-orders-panel"
            className="bg-[#1E1E2E] border border-[#313244] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
          >
            {/* Panel Header */}
            <div className="px-5 py-4 border-b border-[#313244] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="recent-orders-heading"
                    className="text-base font-bold text-[#CDD6F4]"
                  >
                    Recent Orders Queue
                  </h2>
                  <Badge variant="neutral" className="font-mono">
                    Latest {recentOrders.length}
                  </Badge>
                </div>
                <p className="text-xs text-[#A6ADC8] mt-0.5">
                  Most recent customer orders across Campus Pickup and Region
                  III Delivery.
                </p>
              </div>

              <ButtonLink
                href="/admin/orders"
                variant="outline"
                size="compact"
                className="text-xs font-semibold"
              >
                View All Orders →
              </ButtonLink>
            </div>

            {/* Status Pipeline Summary Bar (CSS/SVG Chart per Rule 2) */}
            <div className="px-5 py-3 bg-[#181825]/80 border-b border-[#313244] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-[#A6ADC8]">
                <span>ORDER STATUS PIPELINE DISTRIBUTION</span>
                <span>{MOCK_ORDERS.length} TOTAL ORDERS</span>
              </div>

              <div
                aria-label="Order status distribution bar"
                className="w-full h-2 rounded-full bg-[#11111B] overflow-hidden flex border border-[#313244]"
              >
                {(
                  Object.keys(SEMANTIC_STATUS_TOKENS) as SemanticStatusKey[]
                ).map((key) => {
                  const count = statusDistribution[key];
                  if (count === 0) return null;
                  const widthPct = (count / MOCK_ORDERS.length) * 100;
                  return (
                    <div
                      key={key}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: SEMANTIC_STATUS_TOKENS[key].text,
                      }}
                      title={`${key}: ${count}`}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                    />
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                {(
                  Object.keys(SEMANTIC_STATUS_TOKENS) as SemanticStatusKey[]
                ).map((key) => {
                  const token = SEMANTIC_STATUS_TOKENS[key];
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#BAC2DE]"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: token.text }}
                      />
                      <span>{token.label}</span>
                      <span className="text-[#A6ADC8]">
                        ({statusDistribution[key]})
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Responsive Table Wrapper */}
            <div
              role="region"
              aria-label="Recent orders queue table"
              tabIndex={0}
              className="overflow-x-auto"
            >
              <table
                data-testid="recent-orders-table"
                className="w-full min-w-[720px] text-left border-collapse"
              >
                <thead>
                  <tr className="bg-[#181825] border-b border-[#313244] text-[10px] font-mono font-bold uppercase tracking-wider text-[#A6ADC8]">
                    <th scope="col" className="py-3 pl-5 pr-3">
                      Order ID
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Customer Name
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Date
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Fulfillment
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Amount
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Status
                    </th>
                    <th scope="col" className="py-3 pl-3 pr-5 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#313244] text-xs">
                  {recentOrders.map((order) => {
                    const statusMeta = resolveSemanticStatus(
                      order.status as ExtendedOrderStatus
                    );
                    const totalUnits = order.items.reduce(
                      (sum, item) => sum + item.qty,
                      0
                    );
                    const isSelected = inspectedOrderId === order.id;

                    return (
                      <tr
                        key={order.id}
                        data-testid={`order-row-${order.id}`}
                        className={`transition-colors ${
                          isSelected
                            ? "bg-[#89B4FA]/10"
                            : "hover:bg-[#313244]/35"
                        }`}
                      >
                        {/* Order ID */}
                        <td className="py-3.5 pl-5 pr-3 font-mono font-bold text-[#CDD6F4] whitespace-nowrap">
                          #{order.orderNumber}
                        </td>

                        {/* Customer Name */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#CDD6F4]">
                            {order.recipientName}
                          </div>
                          <div className="text-[11px] font-mono text-[#A6ADC8]">
                            {totalUnits} {totalUnits === 1 ? "unit" : "units"} ·{" "}
                            {order.paymentMethod === "COD"
                              ? "COD"
                              : "Pay on Pickup"}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 font-mono text-[#BAC2DE] whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Fulfillment */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border ${
                              order.fulfillmentType === "PICKUP"
                                ? "bg-[#94E2D5]/12 text-[#94E2D5] border-[#94E2D5]/30"
                                : "bg-[#74C7EC]/12 text-[#74C7EC] border-[#74C7EC]/30"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {order.fulfillmentType === "PICKUP"
                              ? "Pickup"
                              : "Delivery"}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-3 font-mono font-bold text-[#CDD6F4] whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        {/* Status Badge (Catppuccin Mocha Semantic Colors) */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            data-status-badge={statusMeta.semanticKey}
                            data-raw-status={order.status}
                            style={{
                              backgroundColor: statusMeta.bg,
                              color: statusMeta.text,
                              borderColor: statusMeta.border,
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border tracking-wide"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: statusMeta.text }}
                            />
                            <span>{statusMeta.displayLabel}</span>
                          </span>
                        </td>

                        {/* Action ('View' button) */}
                        <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                          <Button
                            type="button"
                            variant={isSelected ? "accent" : "outline"}
                            size="compact"
                            data-testid={`view-order-${order.id}`}
                            onClick={() =>
                              setInspectedOrderId((prev) =>
                                prev === order.id ? null : order.id
                              )
                            }
                            className="text-xs font-semibold"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Inline Order Inspection Drawer when 'View' is clicked */}
            {inspectedOrder && (
              <div
                data-testid="inspected-order-drawer"
                className="p-5 bg-[#181825] border-t border-[#45475A] flex flex-col gap-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-[#89B4FA]">
                      INSPECTING #{inspectedOrder.orderNumber}
                    </span>
                    <span className="text-xs text-[#BAC2DE]">
                      · {inspectedOrder.recipientName} (
                      {inspectedOrder.contactNumber})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectedOrderId(null)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-mono text-[#A6ADC8] hover:text-[#CDD6F4] hover:bg-[#313244]/50"
                  >
                    Close ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#1E1E2E] border border-[#313244]">
                    <p className="text-[10px] font-mono uppercase text-[#A6ADC8]">
                      Destination / Pickup Station
                    </p>
                    <p className="mt-1 text-[#CDD6F4] font-medium">
                      {inspectedOrder.deliveryAddress}
                    </p>
                    {inspectedOrder.trackingNo && (
                      <p className="mt-1 font-mono text-[11px] text-[#94E2D5]">
                        Tracking: {inspectedOrder.trackingNo}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-[#1E1E2E] border border-[#313244]">
                    <p className="text-[10px] font-mono uppercase text-[#A6ADC8]">
                      Line Items ({inspectedOrder.items.length})
                    </p>
                    <ul className="mt-1 space-y-1">
                      {inspectedOrder.items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex items-center justify-between gap-2 font-mono text-[11px]"
                        >
                          <span className="text-[#BAC2DE] truncate">
                            {item.qty}× {item.productSku}
                          </span>
                          <span className="text-[#CDD6F4] font-bold">
                            {formatCurrency(item.price * item.qty)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </Surface>
        </section>

        {/* Right Column (4 cols on XL): 3. Low Stock Alert Panel + 4. Quick Actions Panel */}
        <div className="xl:col-span-4 flex flex-col gap-6 min-w-0">
          {/* 3. Low Stock Alert Panel */}
          <section aria-labelledby="low-stock-heading">
            <Surface
              variant="panel"
              data-testid="low-stock-alert-panel"
              className="p-5 bg-[#1E1E2E] border border-[#313244] flex flex-col gap-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="low-stock-heading"
                      className="text-base font-bold text-[#CDD6F4]"
                    >
                      Low Stock Alert Panel
                    </h2>
                    <Badge variant="warning" className="font-mono">
                      {baselineLowStockProducts.length} SKUs
                    </Badge>
                  </div>
                  <p className="text-xs text-[#A6ADC8] mt-0.5">
                    Filtered items where{" "}
                    <code className="font-mono text-[#F9E2AF]">
                      stockQuantity &le; minStockThreshold
                    </code>
                    .
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {baselineLowStockProducts.map((product) => {
                  const baseStock = getStockQuantity(product);
                  const addedStock = restockedSkus[product.sku] ?? 0;
                  const currentStock = baseStock + addedStock;
                  const minThreshold = getMinStockThreshold(product);
                  const ratioPct = Math.min(
                    100,
                    Math.round((currentStock / Math.max(1, minThreshold)) * 100)
                  );
                  const isRestocked = currentStock > minThreshold;

                  return (
                    <div
                      key={product.id}
                      data-testid={`low-stock-item-${product.sku}`}
                      className="p-3.5 rounded-xl bg-[#181825] border border-[#313244] flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="inline-block font-mono text-[11px] font-bold text-[#F9E2AF] tracking-wide">
                            {product.sku}
                          </span>
                          <h3 className="text-xs font-bold text-[#CDD6F4] leading-snug mt-0.5">
                            {product.name}
                          </h3>
                        </div>

                        <Button
                          type="button"
                          variant={isRestocked ? "surface" : "outline"}
                          size="compact"
                          data-testid={`restock-btn-${product.sku}`}
                          onClick={() => handleRestock(product)}
                          className="text-[11px] font-mono font-bold border-[#F9E2AF]/40 text-[#F9E2AF] hover:border-[#F9E2AF] shrink-0"
                        >
                          Restock
                        </Button>
                      </div>

                      {/* Current Stock vs Minimum Threshold Bar & Tag */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#BAC2DE]">
                            Stock:{" "}
                            <strong
                              className={
                                isRestocked
                                  ? "text-[#A6E3A1]"
                                  : "text-[#F9E2AF]"
                              }
                            >
                              {currentStock} units
                            </strong>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#1E1E2E] border border-[#313244] text-[#A6ADC8]">
                            Min Threshold: {minThreshold} units
                          </span>
                        </div>

                        <div
                          role="progressbar"
                          aria-label={`${product.name} stock threshold ratio`}
                          aria-valuenow={currentStock}
                          aria-valuemin={0}
                          aria-valuemax={minThreshold}
                          className="w-full h-2 rounded-full bg-[#11111B] border border-[#313244] overflow-hidden"
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${ratioPct}%`,
                              backgroundColor: isRestocked
                                ? "#A6E3A1"
                                : currentStock <= 8
                                ? "#F38BA8"
                                : "#F9E2AF",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {lowStockProducts.length === 0 && (
                  <p className="text-xs font-mono text-[#A6E3A1]">
                    ✓ Requisition queued for all low-stock items in this
                    session.
                  </p>
                )}
              </div>
            </Surface>
          </section>

          {/* 4. Quick Actions Panel */}
          <section aria-labelledby="quick-actions-heading">
            <Surface
              variant="panel"
              data-testid="quick-actions-panel"
              className="p-5 bg-[#1E1E2E] border border-[#313244] flex flex-col gap-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
            >
              <div>
                <h2
                  id="quick-actions-heading"
                  className="text-base font-bold text-[#CDD6F4]"
                >
                  Quick Actions Panel
                </h2>
                <p className="text-xs text-[#A6ADC8] mt-0.5">
                  Direct shortcuts to core catalog, order, and warehouse
                  operations.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <Link
                  href="/admin/products"
                  data-testid="quick-action-add-product"
                  className="group flex items-center justify-between gap-3 p-3.5 min-h-[48px] rounded-xl bg-[#181825] border border-[#313244] hover:border-[#89B4FA] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-[#89B4FA]/15 border border-[#89B4FA]/30 text-[#89B4FA] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#CDD6F4] group-hover:text-[#89B4FA] transition-colors">
                        Add Product
                      </p>
                      <p className="text-[11px] text-[#A6ADC8] truncate">
                        Create new SKU, specs &amp; datasheets
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#89B4FA] group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>

                <Link
                  href="/admin/orders"
                  data-testid="quick-action-review-orders"
                  className="group flex items-center justify-between gap-3 p-3.5 min-h-[48px] rounded-xl bg-[#181825] border border-[#313244] hover:border-[#74C7EC] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-[#74C7EC]/15 border border-[#74C7EC]/30 text-[#74C7EC] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#CDD6F4] group-hover:text-[#74C7EC] transition-colors">
                        Review Orders
                      </p>
                      <p className="text-[11px] text-[#A6ADC8] truncate">
                        Verify Region III COD &amp; Pickup queue
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#74C7EC] group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>

                <Link
                  href="/admin/inventory"
                  data-testid="quick-action-adjust-inventory"
                  className="group flex items-center justify-between gap-3 p-3.5 min-h-[48px] rounded-xl bg-[#181825] border border-[#313244] hover:border-[#94E2D5] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-lg bg-[#94E2D5]/15 border border-[#94E2D5]/30 text-[#94E2D5] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#CDD6F4] group-hover:text-[#94E2D5] transition-colors">
                        Adjust Inventory
                      </p>
                      <p className="text-[11px] text-[#A6ADC8] truncate">
                        Reconcile bin counts &amp; safety stock
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-[#94E2D5] group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </Link>
              </div>
            </Surface>
          </section>
        </div>
      </div>
    </div>
  );
}
