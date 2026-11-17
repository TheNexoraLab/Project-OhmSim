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
import {
  Plus as AddIcon,
  Banknote as Banknote2Icon,
  Package as BoxMinimalisticIcon,
  AlertTriangle as DangerTriangleIcon,
  MessageSquare as ChatRoundDotsIcon,
  MapPin as MapPointIcon,
  Truck as DeliveryIcon,
  FileText as BillListIcon,
  Archive as ArchiveCheckIcon,
} from "lucide-react";

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
    label: "Pending",
    text: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.08)",
    border: "rgba(249, 226, 175, 0.2)",
  },
  PROCESSING: {
    label: "Processing",
    text: "#89B4FA",
    bg: "rgba(137, 180, 250, 0.08)",
    border: "rgba(137, 180, 250, 0.2)",
  },
  SHIPPED: {
    label: "Shipped",
    text: "#CBA6F7",
    bg: "rgba(203, 166, 247, 0.08)",
    border: "rgba(203, 166, 247, 0.2)",
  },
  DELIVERED: {
    label: "Delivered",
    text: "#A6E3A1",
    bg: "rgba(166, 227, 161, 0.08)",
    border: "rgba(166, 227, 161, 0.2)",
  },
  CANCELLED: {
    label: "Cancelled",
    text: "#F38BA8",
    bg: "rgba(243, 139, 168, 0.08)",
    border: "rgba(243, 139, 168, 0.2)",
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
        displayLabel: SEMANTIC_STATUS_TOKENS.PENDING.label,
        detailLabel: "Pending Confirmation",
        ...SEMANTIC_STATUS_TOKENS.PENDING,
      };
    case "PROCESSING":
    case "CONFIRMED":
    case "PREPARING":
    case "READY_FOR_PICKUP":
      return {
        semanticKey: "PROCESSING",
        displayLabel: SEMANTIC_STATUS_TOKENS.PROCESSING.label,
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
        displayLabel: SEMANTIC_STATUS_TOKENS.SHIPPED.label,
        detailLabel: "Out for Delivery",
        ...SEMANTIC_STATUS_TOKENS.SHIPPED,
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        semanticKey: "DELIVERED",
        displayLabel: SEMANTIC_STATUS_TOKENS.DELIVERED.label,
        detailLabel: status === "COMPLETED" ? "Completed" : "Delivered",
        ...SEMANTIC_STATUS_TOKENS.DELIVERED,
      };
    case "CANCELLED":
    default:
      return {
        semanticKey: "CANCELLED",
        displayLabel: SEMANTIC_STATUS_TOKENS.CANCELLED.label,
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
      {/* Page Header */}
      <div className="admin-page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#313244]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#CDD6F4] tracking-tight">
            Dashboard
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <ButtonLink
            href="/admin/orders"
            variant="surface"
            size="small"
            className="text-xs font-medium gap-1.5"
          >
            <span>Orders</span>
            <span className="font-mono text-[#89B4FA]">
              ({MOCK_ORDERS.length})
            </span>
          </ButtonLink>
          <ButtonLink
            href="/admin/products"
            variant="accent"
            size="small"
            className="text-xs font-semibold gap-1.5"
          >
            <AddIcon size={14} className="stroke-[2.5]" />
            <span>Add Product</span>
          </ButtonLink>
        </div>
      </div>

      {/* 1. Top KPI Summary Grid (4 Cards) */}
      <section aria-label="Key Performance Indicators">
        <div
          data-testid="admin-kpi-grid"
          className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4"
        >
          {/* Card 1: Total Revenue */}
          <AdminKpiCard
            dataTestId="kpi-total-revenue"
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle={`${MOCK_ORDERS.length} recorded orders`}
            badgeText="GROSS"
            badgeVariant="neutral"
            accentColor="#89B4FA"
            progressPercent={84}
            progressLabel="Gross revenue target progress"
            icon={<Banknote2Icon size={20} />}
          />

          {/* Card 2: Active Orders */}
          <AdminKpiCard
            dataTestId="kpi-active-orders"
            title="Active Orders"
            value={activeOrders.length}
            subtitle="Pending & in progress"
            badgeText={`${activeOrders.length} IN QUEUE`}
            badgeVariant="neutral"
            accentColor="#74C7EC"
            progressPercent={Math.round(
              (activeOrders.length / Math.max(1, MOCK_ORDERS.length)) * 100
            )}
            progressLabel="Active order ratio"
            icon={<BoxMinimalisticIcon size={20} />}
          />

          {/* Card 3: Low Stock Alerts */}
          <AdminKpiCard
            dataTestId="kpi-low-stock-alerts"
            title="Low Stock Alerts"
            value={baselineLowStockProducts.length}
            subtitle={`Under ${DEFAULT_MIN_STOCK_THRESHOLD} units`}
            badgeText={
              baselineLowStockProducts.length > 0 ? "RESTOCK" : "HEALTHY"
            }
            badgeVariant="neutral"
            accentColor="#F9E2AF"
            progressPercent={Math.round(
              (baselineLowStockProducts.length /
                Math.max(1, MOCK_PRODUCTS.length)) *
              100
            )}
            progressLabel="Low stock SKU share"
            icon={<DangerTriangleIcon size={20} />}
          />

          {/* Card 4: Unread Inquiries */}
          <AdminKpiCard
            dataTestId="kpi-unread-inquiries"
            title="Unread Inquiries"
            value={UNREAD_INQUIRIES_COUNT}
            subtitle="Support & courier chats"
            badgeText="LIVE CHAT"
            badgeVariant="neutral"
            accentColor="#94E2D5"
            progressPercent={60}
            progressLabel="Support queue SLA utilization"
            icon={<ChatRoundDotsIcon size={20} />}
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
              <div className="flex items-center gap-2">
                <h2
                  id="recent-orders-heading"
                  className="text-base font-bold text-[#CDD6F4]"
                >
                  Recent Orders
                </h2>
                <Badge variant="neutral" className="font-mono">
                  Latest {recentOrders.length}
                </Badge>
              </div>

              <ButtonLink
                href="/admin/orders"
                variant="outline"
                size="compact"
                className="text-xs font-medium"
              >
                View All Orders →
              </ButtonLink>
            </div>

            {/* Status Pipeline Summary Bar */}
            <div className="px-5 py-3 bg-[#181825]/60 border-b border-[#313244] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-[#A6ADC8]">
                <span className="font-medium">Order Pipeline</span>
                <span className="text-xs font-mono text-[#6C7086]">{MOCK_ORDERS.length} total orders</span>
              </div>

              <div
                aria-label="Order status distribution bar"
                className="w-full h-1.5 rounded-full bg-[#11111B] overflow-hidden flex border border-[#313244]"
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
                      title={`${SEMANTIC_STATUS_TOKENS[key].label}: ${count}`}
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
                      className="inline-flex items-center gap-1.5 text-xs text-[#A6ADC8]"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: token.text }}
                      />
                      <span>{token.label}</span>
                      <span className="text-[#6C7086] font-mono text-[11px]">
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
              className="admin-table-scroll overflow-x-auto"
            >
              <table data-responsive-table="cards" role="table"
                data-testid="recent-orders-table"
                className="w-full min-w-[720px] text-left border-collapse"
              >
                <thead>
                  <tr className="bg-[#181825] border-b border-[#313244] text-xs font-semibold text-[#A6ADC8]">
                    <th scope="col" className="py-3 pl-5 pr-3">
                      Order
                    </th>
                    <th scope="col" className="py-3 px-3">
                      Customer
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
                        className={`transition-colors ${isSelected
                          ? "bg-[#89B4FA]/10"
                          : "hover:bg-[#313244]/35"
                          }`}
                      >
                        {/* Order ID */}
                        <td data-label="Order" data-cell="primary" className="py-3.5 pl-5 pr-3 font-mono font-medium text-[#CDD6F4] whitespace-nowrap">
                          #{order.orderNumber}
                        </td>

                        {/* Customer Name */}
                        <td data-label="Customer" className="py-3.5 px-3">
                          <div className="font-medium text-[#CDD6F4]">
                            {order.recipientName}
                          </div>
                          <div className="text-[11px] text-[#A6ADC8]">
                            {totalUnits} {totalUnits === 1 ? "unit" : "units"} ·{" "}
                            {order.paymentMethod === "COD"
                              ? "COD"
                              : "Pay on Pickup"}
                          </div>
                        </td>

                        {/* Date */}
                        <td data-label="Date" className="py-3.5 px-3 text-[#BAC2DE] whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>

                        {/* Fulfillment */}
                        <td data-label="Fulfillment" className="py-3.5 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs text-[#BAC2DE]">
                            {order.fulfillmentType === "PICKUP" ? (
                              <>
                                <MapPointIcon size={14} className="text-[#A6ADC8]" />
                                <span>Campus Pickup</span>
                              </>
                            ) : (
                              <>
                                <DeliveryIcon size={14} className="text-[#A6ADC8]" />
                                <span>Delivery</span>
                              </>
                            )}
                          </span>
                        </td>

                        {/* Amount */}
                        <td data-label="Amount" className="py-3.5 px-3 font-mono font-medium text-[#CDD6F4] whitespace-nowrap">
                          {formatCurrency(order.totalAmount)}
                        </td>

                        {/* Status Badge */}
                        <td data-label="Status" className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            data-status-badge={statusMeta.semanticKey}
                            data-raw-status={order.status}
                            style={{
                              backgroundColor: statusMeta.bg,
                              color: statusMeta.text,
                              borderColor: statusMeta.border,
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: statusMeta.text }}
                            />
                            <span>{statusMeta.displayLabel}</span>
                          </span>
                        </td>

                        {/* Action ('View' button) */}
                        <td data-label="Action" data-cell="actions" className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
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
                            className="text-xs font-medium"
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
                      Low Stock Alerts
                    </h2>
                    <Badge variant="neutral" className="font-mono">
                      {baselineLowStockProducts.length} SKUs
                    </Badge>
                  </div>
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
                          <h3 className="text-xs font-semibold text-[#CDD6F4] leading-snug">
                            {product.name}
                          </h3>
                          <span className="font-mono text-[11px] text-[#A6ADC8]">
                            {product.sku}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant={isRestocked ? "surface" : "outline"}
                          size="compact"
                          data-testid={`restock-btn-${product.sku}`}
                          onClick={() => handleRestock(product)}
                          className="text-xs font-medium shrink-0"
                        >
                          {isRestocked ? "Queued" : "Restock"}
                        </Button>
                      </div>

                      {/* Current Stock vs Minimum Threshold Bar */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#A6ADC8]">
                            Stock:{" "}
                            <strong
                              className={
                                isRestocked
                                  ? "text-[#A6E3A1]"
                                  : "text-[#CDD6F4]"
                              }
                            >
                              {currentStock} units
                            </strong>
                          </span>
                          <span className="text-[11px] text-[#6C7086] font-mono">
                            Min: {minThreshold}
                          </span>
                        </div>

                        <div
                          role="progressbar"
                          aria-label={`${product.name} stock threshold ratio`}
                          aria-valuenow={currentStock}
                          aria-valuemin={0}
                          aria-valuemax={minThreshold}
                          className="w-full h-1.5 rounded-full bg-[#11111B] border border-[#313244] overflow-hidden"
                        >
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${ratioPct}%`,
                              backgroundColor: isRestocked
                                ? "#A6E3A1"
                                : currentStock <= 8
                                  ? "#F38BA8"
                                  : "#89B4FA",
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
                  Quick Actions
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                <Link
                  href="/admin/products"
                  data-testid="quick-action-add-product"
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] hover:bg-[#1E1E2E] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[#313244]/50 text-[#CDD6F4] flex items-center justify-center shrink-0 group-hover:text-[#89B4FA] transition-colors">
                      <AddIcon size={16} />
                    </span>
                    <span className="text-xs font-semibold text-[#CDD6F4] group-hover:text-[#89B4FA] transition-colors">
                      Add Product
                    </span>
                  </div>
                  <span className="text-xs text-[#6C7086] group-hover:text-[#CDD6F4] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </Link>

                <Link
                  href="/admin/orders"
                  data-testid="quick-action-review-orders"
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] hover:bg-[#1E1E2E] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[#313244]/50 text-[#CDD6F4] flex items-center justify-center shrink-0 group-hover:text-[#89B4FA] transition-colors">
                      <BillListIcon size={16} />
                    </span>
                    <span className="text-xs font-semibold text-[#CDD6F4] group-hover:text-[#89B4FA] transition-colors">
                      Review Orders
                    </span>
                  </div>
                  <span className="text-xs text-[#6C7086] group-hover:text-[#CDD6F4] group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </Link>

                <Link
                  href="/admin/inventory"
                  data-testid="quick-action-adjust-inventory"
                  className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] hover:bg-[#1E1E2E] transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-[#313244]/50 text-[#CDD6F4] flex items-center justify-center shrink-0 group-hover:text-[#89B4FA] transition-colors">
                      <ArchiveCheckIcon size={16} />
                    </span>
                    <span className="text-xs font-semibold text-[#CDD6F4] group-hover:text-[#89B4FA] transition-colors">
                      Adjust Inventory
                    </span>
                  </div>
                  <span className="text-xs text-[#6C7086] group-hover:text-[#CDD6F4] group-hover:translate-x-0.5 transition-all">
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
