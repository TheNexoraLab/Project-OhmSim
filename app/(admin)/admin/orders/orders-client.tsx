"use client";

import React, { useEffect, useMemo, useState } from "react";
import { INITIAL_ORDERS as MOCK_ORDERS } from "@/lib/mocks/orders";
import { PRODUCTS, INITIAL_BOM_PROJECTS } from "@/lib/mocks/products";
import { INITIAL_USER_PROFILE } from "@/lib/mocks/profile";
import { INITIAL_SAVED_ADDRESSES } from "@/lib/mocks/addresses";
import { computeDeliveryFee } from "@/lib/fulfillment";
import type {
  MockOrder as Order,
  OrderStatus,
  FulfillmentType,
  PaymentMethod,
} from "@/types/order";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import {
  AdminOrderDrawer,
  ADMIN_ORDER_STATUS_TOKENS,
  resolveAdminOrderStatus,
  formatPaymentMethodLabel,
  type AdminPipelineStatus,
  type EnrichedAdminOrder,
  type EnrichedOrderItem,
  type StructuredDeliveryAddress,
} from "@/components/admin/admin-order-drawer";
import {
  exportShippingManifestCsv,
  printOrderShippingSlip,
  resolveCourierName,
} from "@/lib/orders/shipping-slip";

type StatusTabKey = "ALL" | AdminPipelineStatus;
type FulfillmentFilterValue = "ALL" | FulfillmentType;

const STATUS_TABS: { key: StatusTabKey; label: string }[] = [
  { key: "ALL", label: "ALL" },
  { key: "PENDING", label: "PENDING" },
  { key: "PROCESSING", label: "PROCESSING" },
  { key: "SHIPPED", label: "SHIPPED" },
  { key: "DELIVERED", label: "DELIVERED" },
  { key: "CANCELLED", label: "CANCELLED" },
];

const DEFAULT_PICKUP_STATION =
  "Designated Campus Electronics Lab / Store Station (Building 3, Room 204)";

function parseStructuredDeliveryAddress(
  rawAddress?: string
): StructuredDeliveryAddress | undefined {
  if (!rawAddress) return undefined;

  const matchedSaved = INITIAL_SAVED_ADDRESSES.find((addr) =>
    rawAddress.toLowerCase().includes(addr.streetAddress.toLowerCase())
  );
  if (matchedSaved) {
    return {
      streetAddress: matchedSaved.streetAddress,
      barangay: matchedSaved.barangay,
      cityMunicipality: matchedSaved.cityMunicipality,
      province: matchedSaved.province,
      region: matchedSaved.region,
      postalCode: matchedSaved.postalCode || "2000",
    };
  }

  const parts = rawAddress.split(",").map((p) => p.trim());
  return {
    streetAddress: parts[0] || "789 Maharlika Hwy",
    barangay: parts.length >= 5 ? parts[1] : "Poblacion",
    cityMunicipality:
      parts.length >= 5 ? parts[2] : parts[1] || "Cabanatuan City",
    province: parts.length >= 5 ? parts[3] : parts[2] || "Nueva Ecija",
    region: "Region III",
    postalCode: "3100",
  };
}

function buildBomOrderFromFixture(params: {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  bomIndex: number;
  recipientName: string;
  contactNumber: string;
  customerEmail: string;
  deliveryAddress: string;
  notes: string;
}): EnrichedAdminOrder {
  const bom = INITIAL_BOM_PROJECTS[params.bomIndex] ?? INITIAL_BOM_PROJECTS[0];
  const items = bom.lineItems.map((line) => {
    const prod =
      PRODUCTS.find((p) => p.id === line.productId) ?? PRODUCTS[0];
    return {
      productId: prod.id,
      productName: prod.name,
      productSku: prod.sku,
      productImage: prod.image,
      price: prod.price,
      qty: line.qty,
      bundleName: bom.name,
      bomProjectName: bom.name,
    };
  });

  const subtotalAmount = items.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );
  const deliveryFee = computeDeliveryFee(
    subtotalAmount,
    params.fulfillmentType
  );

  return {
    id: params.id,
    orderNumber: params.orderNumber,
    createdAt: params.createdAt,
    fulfillmentType: params.fulfillmentType,
    paymentMethod: params.paymentMethod,
    status: params.status,
    recipientName: params.recipientName,
    contactNumber: params.contactNumber,
    customerEmail: params.customerEmail,
    deliveryAddress: params.deliveryAddress,
    pickupStation: DEFAULT_PICKUP_STATION,
    structuredAddress:
      params.fulfillmentType === "DELIVERY"
        ? parseStructuredDeliveryAddress(params.deliveryAddress)
        : undefined,
    trackingNo: null,
    notes: params.notes,
    subtotalAmount,
    deliveryFee,
    totalAmount: subtotalAmount + deliveryFee,
    items,
  };
}

function createInitialAdminOrders(): EnrichedAdminOrder[] {
  const defaultEmail = INITIAL_USER_PROFILE.email;
  const primarySavedAddress = INITIAL_SAVED_ADDRESSES[0];

  // 1. Seed a PENDING order from INITIAL_BOM_PROJECTS[0] so "Confirm & Move to Processing" is immediately actionable
  const pendingBomOrder = buildBomOrderFromFixture({
    id: "o-pending-1",
    orderNumber: "OHM-2026-094",
    createdAt: "2026-08-30T10:15:00Z",
    status: "PENDING",
    fulfillmentType: "DELIVERY",
    paymentMethod: "COD",
    bomIndex: 0,
    recipientName: `${INITIAL_USER_PROFILE.firstName} ${INITIAL_USER_PROFILE.lastName}`,
    contactNumber: INITIAL_USER_PROFILE.mobile,
    customerEmail: defaultEmail,
    deliveryAddress: primarySavedAddress
      ? `${primarySavedAddress.streetAddress}, ${primarySavedAddress.barangay}, ${primarySavedAddress.cityMunicipality}, ${primarySavedAddress.province}, ${primarySavedAddress.region}`
      : "123 Rizal Ave, Dolores, San Fernando, Pampanga, Region III",
    notes: "BOM bundle order for robotics capstone prototype; please include ESD bags.",
  });

  // 2. Seed a PROCESSING Pickup order from INITIAL_BOM_PROJECTS[1] so "Mark Ready for Pickup" is immediately actionable
  const processingPickupOrder = buildBomOrderFromFixture({
    id: "o-processing-pickup-1",
    orderNumber: "OHM-2026-091",
    createdAt: "2026-08-29T13:40:00Z",
    status: "PREPARING",
    fulfillmentType: "PICKUP",
    paymentMethod: "PAY_ON_PICKUP",
    bomIndex: 1,
    recipientName: "Camille Villanueva",
    contactNumber: "09184561230",
    customerEmail: "c.villanueva@hau.edu.ph",
    deliveryAddress: DEFAULT_PICKUP_STATION,
    notes: "Will pick up at Building 3, Room 204 after Embedded Systems lab session.",
  });

  // 3. Map all canonical orders from INITIAL_ORDERS (@/lib/mocks/orders)
  const mappedBaseOrders: EnrichedAdminOrder[] = (MOCK_ORDERS as Order[]).map(
    (order) => {
      // Attribute matching BOM project names from INITIAL_BOM_PROJECTS where applicable
      const enrichedItems = order.items.map((item) => {
        const matchedBom = INITIAL_BOM_PROJECTS.find((bom) =>
          bom.lineItems.some(
            (li) => li.productId === item.productId && li.qty === item.qty
          )
        );
        return {
          ...item,
          bomProjectName: item.bundleName || matchedBom?.name,
        };
      });

      return {
        ...order,
        customerEmail: defaultEmail,
        pickupStation: DEFAULT_PICKUP_STATION,
        structuredAddress:
          order.fulfillmentType === "DELIVERY"
            ? parseStructuredDeliveryAddress(order.deliveryAddress)
            : undefined,
        cancellationReason:
          order.status === "CANCELLED"
            ? order.notes || "Cancelled per customer request prior to preparation"
            : null,
        items: enrichedItems,
      };
    }
  );

  return [pendingBomOrder, processingPickupOrder, ...mappedBaseOrders];
}

interface ApiOrderItem {
  productId: string;
  productName?: string;
  productSku?: string;
  productImage?: string;
  unitPrice?: number;
  quantity?: number;
  bomProjectName?: string | null;
}

interface ApiOrder {
  id: string;
  orderNumber: string;
  createdAt?: string;
  updatedAt?: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  deliveryAddress?: {
    recipientName?: string;
    phone?: string;
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    fullAddress?: string;
  } | null;
  trackingNumber?: string | null;
  notes?: string;
  cancelledReason?: string | null;
  subtotal?: number;
  shippingFee?: number;
  totalAmount?: number;
  items?: ApiOrderItem[];
}

function mapBackendOrders(apiOrders: ApiOrder[]): EnrichedAdminOrder[] {
  return apiOrders.map((o: ApiOrder) => {
    const enrichedItems: EnrichedOrderItem[] = (o.items || []).map(
      (it: ApiOrderItem) => ({
        productId: it.productId,
        productName: it.productName || "Product",
        productSku: it.productSku || "SKU",
        productImage: it.productImage || "/images/placeholder.jpg",
        price: it.unitPrice || 0,
        qty: it.quantity || 1,
        bundleName: it.bomProjectName || undefined,
        bomProjectName: it.bomProjectName || undefined,
      })
    );

    const structuredAddress = o.deliveryAddress
      ? {
          streetAddress: o.deliveryAddress.street || "",
          barangay: o.deliveryAddress.barangay || "",
          cityMunicipality: o.deliveryAddress.city || "",
          province: o.deliveryAddress.province || "Pampanga",
          region: "Region III",
          postalCode: o.deliveryAddress.postalCode || "2000",
        }
      : undefined;

    return {
      id: o.id,
      orderNumber: o.orderNumber,
      createdAt: o.createdAt || new Date().toISOString(),
      updatedAt: o.updatedAt || new Date().toISOString(),
      fulfillmentType: o.fulfillmentType,
      paymentMethod: o.paymentMethod,
      status: o.status,
      recipientName:
        o.deliveryAddress?.recipientName ||
        (o.user
          ? `${o.user.firstName || ""} ${o.user.lastName || ""}`.trim()
          : "Customer"),
      contactNumber: o.deliveryAddress?.phone || o.user?.phone || "",
      customerEmail: o.user?.email || "customer@ohmsim.ph",
      deliveryAddress: o.deliveryAddress?.fullAddress,
      structuredAddress,
      pickupStation: DEFAULT_PICKUP_STATION,
      trackingNo: o.trackingNumber,
      notes: o.notes,
      cancellationReason: o.cancelledReason,
      subtotalAmount: o.subtotal || 0,
      deliveryFee: o.shippingFee || 0,
      totalAmount: o.totalAmount || 0,
      items: enrichedItems,
    };
  });
}

export function OrdersClient() {
  const [orders, setOrders] = useState<EnrichedAdminOrder[]>(() =>
    createInitialAdminOrders()
  );
  const [activeTab, setActiveTab] = useState<StatusTabKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [fulfillmentFilter, setFulfillmentFilter] =
    useState<FulfillmentFilterValue>("ALL");
  const [provinceFilter, setProvinceFilter] = useState<string>("ALL");
  const [courierFilter, setCourierFilter] = useState<string>("ALL");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAdminOrders() {
      try {
        const res = await fetch("/api/orders", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.orders) && data.orders.length > 0) {
            const mappedBackendOrders = mapBackendOrders(data.orders);

            if (isMounted) {
              setOrders((prev) => {
                const realIds = new Set(mappedBackendOrders.map((bo) => bo.id));
                const filteredDemo = prev.filter((po) => !realIds.has(po.id));
                return [...mappedBackendOrders, ...filteredDemo];
              });
              setLastSyncedTime(new Date().toLocaleTimeString());
            }
          }
        }
      } catch (err) {
        console.warn("Could not load backend orders:", err);
      }
    }

    loadAdminOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic Status Counts across all orders
  const statusCounts = useMemo(() => {
    const counts: Record<StatusTabKey, number> = {
      ALL: orders.length,
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };

    for (const order of orders) {
      const { pipelineKey } = resolveAdminOrderStatus(
        order.status,
        order.fulfillmentType
      );
      counts[pipelineKey] += 1;
    }

    return counts;
  }, [orders]);

  // Filtered Orders based on Active Tab, Search Input, Fulfillment Filter, Province, and Courier
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase().replace(/^#/, "");

    return orders.filter((order) => {
      const { pipelineKey } = resolveAdminOrderStatus(
        order.status,
        order.fulfillmentType
      );

      if (activeTab !== "ALL" && pipelineKey !== activeTab) {
        return false;
      }

      if (
        fulfillmentFilter !== "ALL" &&
        order.fulfillmentType !== fulfillmentFilter
      ) {
        return false;
      }

      if (provinceFilter !== "ALL") {
        const orderProvince =
          order.structuredAddress?.province ||
          (order.deliveryAddress?.toLowerCase().includes(provinceFilter.toLowerCase())
            ? provinceFilter
            : "");
        if (!orderProvince.toLowerCase().includes(provinceFilter.toLowerCase())) {
          return false;
        }
      }

      if (courierFilter !== "ALL") {
        const courier = resolveCourierName(order);
        if (courierFilter === "Unassigned") {
          if (order.fulfillmentType === "PICKUP" || order.trackingNo) {
            return false;
          }
        } else if (!courier.toLowerCase().includes(courierFilter.toLowerCase())) {
          return false;
        }
      }

      if (query) {
        const matchesOrderId =
          order.orderNumber.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query);
        const matchesCustomer =
          order.recipientName.toLowerCase().includes(query) ||
          order.contactNumber.toLowerCase().includes(query) ||
          order.customerEmail.toLowerCase().includes(query);
        const matchesProductSkuOrName = order.items.some(
          (item) =>
            item.productSku.toLowerCase().includes(query) ||
            item.productName.toLowerCase().includes(query) ||
            (item.bomProjectName &&
              item.bomProjectName.toLowerCase().includes(query))
        );
        const matchesTracking = order.trackingNo
          ? order.trackingNo.toLowerCase().includes(query)
          : false;

        if (!matchesOrderId && !matchesCustomer && !matchesProductSkuOrName && !matchesTracking) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, fulfillmentFilter, provinceFilter, courierFilter, searchQuery]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  );

  const isAllFilteredSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.has(o.id));

  const handleToggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        for (const o of filteredOrders) {
          next.delete(o.id);
        }
        return next;
      });
    } else {
      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        for (const o of filteredOrders) {
          next.add(o.id);
        }
        return next;
      });
    }
  };

  const handleSyncOrders = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/orders", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          const mapped = mapBackendOrders(data.orders);
          setOrders((prev) => {
            const realIds = new Set(mapped.map((bo) => bo.id));
            const filteredDemo = prev.filter((po) => !realIds.has(po.id));
            return [...mapped, ...filteredDemo];
          });
          const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
          setLastSyncedTime(time);
          toast(`Synced order queue with live database (${mapped.length} live orders).`, "success");
        }
      }
    } catch (err) {
      console.warn("Could not sync orders:", err);
      toast("Sync failed: Could not connect to order dispatch API.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportManifest = () => {
    const targetOrders =
      selectedOrderIds.size > 0
        ? orders.filter((o) => selectedOrderIds.has(o.id))
        : filteredOrders;

    if (targetOrders.length === 0) {
      toast("No orders to export for the current filters.", "warning");
      return;
    }

    exportShippingManifestCsv(targetOrders);
    toast(
      `Exported shipping manifest for ${targetOrders.length} ${targetOrders.length === 1 ? "order" : "orders"}.`,
      "success"
    );
  };

  const handleBulkStatusTransition = (targetStatus: "PROCESSING" | "SHIPPED" | "DELIVERED") => {
    if (selectedOrderIds.size === 0) return;

    const idsToUpdate = Array.from(selectedOrderIds);
    const count = idsToUpdate.length;

    let targetOrderStatus: OrderStatus;
    if (targetStatus === "PROCESSING") {
      targetOrderStatus = "PREPARING";
    } else if (targetStatus === "SHIPPED") {
      targetOrderStatus = "OUT_FOR_DELIVERY";
    } else {
      targetOrderStatus = "DELIVERED";
    }

    // Optimistically update local orders
    setOrders((prev) =>
      prev.map((order) => {
        if (!selectedOrderIds.has(order.id)) return order;

        let newStatus: OrderStatus = targetOrderStatus;
        if (targetStatus === "SHIPPED" && order.fulfillmentType === "PICKUP") {
          newStatus = "READY_FOR_PICKUP";
        }

        const newTracking =
          targetStatus === "SHIPPED" && !order.trackingNo && order.fulfillmentType === "DELIVERY"
            ? `JNT-OHM-${Date.now().toString().slice(-6)}-${order.orderNumber.replace(/[^0-9]/g, "").slice(-3) || "001"}`
            : order.trackingNo;

        return {
          ...order,
          status: newStatus,
          trackingNo: newTracking,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // Call backend API asynchronously for each
    idsToUpdate.forEach((id) => {
      const order = orders.find((o) => o.id === id);
      const isPickup = order?.fulfillmentType === "PICKUP";
      const actualStatus =
        targetStatus === "SHIPPED" && isPickup ? "READY_FOR_PICKUP" : targetOrderStatus;

      const trackingNumber =
        targetStatus === "SHIPPED" && !order?.trackingNo && !isPickup
          ? `JNT-OHM-${Date.now().toString().slice(-6)}`
          : undefined;

      fetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: actualStatus,
          ...(trackingNumber ? { trackingNumber } : {}),
        }),
      }).catch((err) => console.warn(`Failed to update order ${id}:`, err));
    });

    toast(
      `Batch updated ${count} ${count === 1 ? "order" : "orders"} to ${targetStatus}.`,
      "success"
    );
    setSelectedOrderIds(new Set());
  };

  // Administrative Status Progression Handlers
  const handleConfirmToProcessing = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "PREPARING",
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
    if (target) {
      toast(
        `Order #${target.orderNumber} confirmed and moved to PROCESSING.`,
        "info"
      );
      if (typeof window !== "undefined") {
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "PREPARING" }),
        }).catch((err) => console.warn("Backend order status patch failed:", err));
      }
    }
  };

  const handleDispatchDelivery = (orderId: string, trackingNo: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "OUT_FOR_DELIVERY",
              trackingNo,
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
    if (target) {
      toast(
        `Order #${target.orderNumber} dispatched as SHIPPED (Tracking: ${trackingNo}).`,
        "success"
      );
      if (typeof window !== "undefined") {
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: "OUT_FOR_DELIVERY",
            trackingNumber: trackingNo,
          }),
        }).catch((err) => console.warn("Backend order status patch failed:", err));
      }
    }
  };

  const handleMarkReadyForPickup = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "READY_FOR_PICKUP",
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
    if (target) {
      toast(
        `Order #${target.orderNumber} marked READY_FOR_PICKUP at Building 3, Room 204.`,
        "success"
      );
      if (typeof window !== "undefined") {
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "READY_FOR_PICKUP" }),
        }).catch((err) => console.warn("Backend order status patch failed:", err));
      }
    }
  };

  const handleMarkDelivered = (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "DELIVERED",
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
    if (target) {
      toast(
        `Order #${target.orderNumber} completed and marked as DELIVERED.`,
        "success"
      );
      if (typeof window !== "undefined") {
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: "DELIVERED" }),
        }).catch((err) => console.warn("Backend order status patch failed:", err));
      }
    }
  };

  const handleCancelOrder = (orderId: string, reason: string) => {
    const target = orders.find((o) => o.id === orderId);
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "CANCELLED",
              cancellationReason: reason,
              notes: reason,
              updatedAt: new Date().toISOString(),
            }
          : order
      )
    );
    if (target) {
      toast(
        `Order #${target.orderNumber} cancelled (${reason}).`,
        "warning"
      );
      if (typeof window !== "undefined") {
        fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            status: "CANCELLED",
            cancelledReason: reason,
          }),
        }).catch((err) => console.warn("Backend order status patch failed:", err));
      }
    }
  };

  const handleResetDemoOrders = () => {
    setOrders(createInitialAdminOrders());
    setSelectedOrderId(null);
    setSelectedOrderIds(new Set());
    setSearchQuery("");
    setActiveTab("ALL");
    setFulfillmentFilter("ALL");
    setProvinceFilter("ALL");
    setCourierFilter("ALL");
    toast("Order queue reset to initial baseline fixtures.", "info");
  };

  return (
    <div
      data-testid="admin-orders-page"
      className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full"
    >
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#313244]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#89B4FA]/12 text-[#89B4FA] border border-[#89B4FA]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#89B4FA]" />
              FE-A03 · FULFILLMENT &amp; DISPATCH CONSOLE
            </span>
            <span className="text-xs font-mono text-[#A6ADC8]">
              Store Pickup &amp; Region III COD
            </span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-[#CDD6F4] tracking-tight">
            Admin Order Management
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#BAC2DE]">
            Inspect component line items, assign Region III courier tracking
            numbers, and advance order fulfillment lifecycles.
          </p>
          {lastSyncedTime && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono text-[#A6E3A1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A6E3A1]" />
              <span>Live Database Synced: {lastSyncedTime}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="surface"
            size="small"
            data-testid="sync-orders-btn"
            disabled={isSyncing}
            onClick={handleSyncOrders}
            className="text-xs font-semibold gap-1.5"
          >
            {isSyncing ? (
              <>
                <span className="w-3 h-3 border-2 border-[#89B4FA] border-t-transparent rounded-full animate-spin" />
                <span>Syncing DB...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 2v6h-6" />
                  <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                  <path d="M3 22v-6h6" />
                  <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                </svg>
                <span>Sync Orders</span>
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="small"
            data-testid="export-shipping-manifest-btn"
            onClick={handleExportManifest}
            className="text-xs font-semibold gap-1.5"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Export Manifest CSV</span>
          </Button>

          <Button
            type="button"
            variant="surface"
            size="small"
            data-testid="reset-orders-demo-btn"
            onClick={handleResetDemoOrders}
            className="text-xs font-semibold gap-1.5"
          >
            <span>Reset Demo Queue</span>
          </Button>
        </div>
      </div>

      {/* A. Order Status Pipeline & Filter Header */}
      <Surface
        variant="panel"
        data-testid="orders-filter-header"
        className="p-4 sm:p-5 bg-[#1E1E2E] border border-[#313244] flex flex-col gap-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
      >
        {/* 1. Status Filter Tabs with Count Badges */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#A6ADC8]">
            <span>ORDER STATUS PIPELINE TABS</span>
            <span>
              SHOWING {filteredOrders.length} OF {orders.length} ORDERS
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Order status filter tabs"
            data-testid="order-status-tabs"
            className="flex flex-wrap items-center gap-2"
          >
            {STATUS_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const count = statusCounts[tab.key];
              const statusToken =
                tab.key !== "ALL"
                  ? ADMIN_ORDER_STATUS_TOKENS[tab.key]
                  : undefined;

              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`status-tab-${tab.key}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={
                    isActive
                      ? {
                          backgroundColor: "rgba(137, 180, 250, 0.14)",
                          color: "#89B4FA",
                          borderColor: "#89B4FA",
                        }
                      : undefined
                  }
                  className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wide border transition-all inline-flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? "bg-[rgba(137,180,250,0.14)] text-[#89B4FA] border-[#89B4FA] shadow-[0_4px_14px_rgba(137,180,250,0.15)]"
                      : "bg-[#181825] text-[#BAC2DE] border-[#313244] hover:border-[#45475A] hover:text-[#CDD6F4]"
                  }`}
                >
                  {statusToken && (
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: statusToken.text }}
                    />
                  )}
                  <span>{tab.label}</span>
                  <span
                    data-testid={`status-tab-count-${tab.key}`}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                      isActive
                        ? "bg-[#89B4FA]/20 text-[#89B4FA]"
                        : "bg-[#1E1E2E] text-[#A6ADC8] border border-[#313244]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Search & Fulfillment Filter Bar */}
        <div className="pt-3 border-t border-[#313244] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Real-time Search Input */}
          <div className="relative flex-1 min-w-0">
            <label htmlFor="admin-orders-search" className="sr-only">
              Search orders by Order ID, Customer Name, or Product SKU
            </label>
            <svg
              aria-hidden="true"
              className="w-4 h-4 text-[#A6ADC8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="admin-orders-search"
              data-testid="admin-orders-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID (e.g. #OHM-2026-089), Customer Name, or Product SKU..."
              className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs text-[#CDD6F4] placeholder:text-[#A6ADC8] focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-xs text-[#A6ADC8] hover:text-[#CDD6F4]"
              >
                ✕
              </button>
            )}
          </div>

          {/* Fulfillment Dropdown Filter */}
          <div className="flex items-center gap-2.5 shrink-0">
            <label
              htmlFor="fulfillment-method-select"
              className="text-xs font-mono text-[#A6ADC8] whitespace-nowrap"
            >
              Fulfillment:
            </label>
            <select
              id="fulfillment-method-select"
              data-testid="fulfillment-filter-select"
              value={fulfillmentFilter}
              onChange={(e) =>
                setFulfillmentFilter(e.target.value as FulfillmentFilterValue)
              }
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="PICKUP">Store / Lab Pickup</option>
              <option value="DELIVERY">Central Luzon Delivery</option>
            </select>
          </div>

          {/* Province Dropdown Filter */}
          <div className="flex items-center gap-2.5 shrink-0">
            <label
              htmlFor="province-filter-select"
              className="text-xs font-mono text-[#A6ADC8] whitespace-nowrap"
            >
              Province:
            </label>
            <select
              id="province-filter-select"
              data-testid="province-filter-select"
              value={provinceFilter}
              onChange={(e) => setProvinceFilter(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Region III</option>
              <option value="Pampanga">Pampanga</option>
              <option value="Bulacan">Bulacan</option>
              <option value="Nueva Ecija">Nueva Ecija</option>
              <option value="Tarlac">Tarlac</option>
              <option value="Bataan">Bataan</option>
              <option value="Zambales">Zambales</option>
              <option value="Aurora">Aurora</option>
            </select>
          </div>

          {/* Courier Dropdown Filter */}
          <div className="flex items-center gap-2.5 shrink-0">
            <label
              htmlFor="courier-filter-select"
              className="text-xs font-mono text-[#A6ADC8] whitespace-nowrap"
            >
              Courier:
            </label>
            <select
              id="courier-filter-select"
              data-testid="courier-filter-select"
              value={courierFilter}
              onChange={(e) => setCourierFilter(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Couriers</option>
              <option value="J&T Express">J&T Express</option>
              <option value="Flash Express">Flash Express</option>
              <option value="Lalamove">Lalamove (Same-day)</option>
              <option value="Campus Station">Campus Station</option>
              <option value="Unassigned">Unassigned Tracking</option>
            </select>
          </div>
        </div>
      </Surface>

      {/* Bulk Fulfillment Actions Bar (Floating/Visible when orders selected) */}
      {selectedOrderIds.size > 0 && (
        <Surface
          variant="panel"
          data-testid="bulk-actions-toolbar"
          className="p-3.5 sm:p-4 bg-[#181825] border border-[#89B4FA]/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-[0_8px_24px_rgba(137,180,250,0.15)]"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#89B4FA] animate-pulse" />
            <span className="text-xs font-mono font-bold text-[#CDD6F4]">
              {selectedOrderIds.size} {selectedOrderIds.size === 1 ? "order" : "orders"} selected
            </span>
            <button
              type="button"
              data-testid="bulk-clear-selection-btn"
              onClick={() => setSelectedOrderIds(new Set())}
              className="text-[11px] font-mono text-[#A6ADC8] hover:text-[#F38BA8] underline ml-2 cursor-pointer"
            >
              Clear selection
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="surface"
              size="compact"
              data-testid="bulk-processing-btn"
              onClick={() => handleBulkStatusTransition("PROCESSING")}
              className="text-xs font-semibold gap-1.5"
            >
              <span>Confirm to Processing</span>
            </Button>

            <Button
              type="button"
              variant="accent"
              size="compact"
              data-testid="bulk-dispatch-btn"
              onClick={() => handleBulkStatusTransition("SHIPPED")}
              className="text-xs font-semibold gap-1.5"
            >
              <span>Dispatch / Ship</span>
            </Button>

            <Button
              type="button"
              variant="surface"
              size="compact"
              data-testid="bulk-delivered-btn"
              onClick={() => handleBulkStatusTransition("DELIVERED")}
              className="text-xs font-semibold gap-1.5"
            >
              <span>Mark Delivered</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="compact"
              data-testid="bulk-export-manifest-btn"
              onClick={handleExportManifest}
              className="text-xs font-semibold gap-1.5"
            >
              <span>Export Manifest ({selectedOrderIds.size})</span>
            </Button>
          </div>
        </Surface>
      )}

      {/* B. Orders Master Table */}
      <Surface
        variant="panel"
        data-testid="orders-master-panel"
        className="bg-[#1E1E2E] border border-[#313244] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
      >
        <div
          role="region"
          aria-label="Orders Master Table"
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table
            data-testid="orders-master-table"
            className="w-full min-w-[960px] text-left border-collapse"
          >
            <thead>
              <tr className="bg-[#181825] border-b border-[#313244] text-[10px] font-mono font-bold uppercase tracking-wider text-[#A6ADC8]">
                <th scope="col" className="py-3.5 pl-4 pr-2 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all orders in current filter"
                    data-testid="select-all-orders-checkbox"
                    checked={isAllFilteredSelected}
                    onChange={handleToggleSelectAllFiltered}
                    className="w-4 h-4 rounded-sm border-[#45475A] bg-[#181825] text-[#89B4FA] focus:ring-0 focus:outline-none cursor-pointer"
                  />
                </th>
                <th scope="col" className="py-3.5 pl-2 pr-3">
                  Order ID
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Date
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Customer &amp; Province
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Fulfillment &amp; Courier
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Payment Method
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Total Amount
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Status Badge
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-5 text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#313244] text-xs">
              {filteredOrders.map((order) => {
                const statusMeta = resolveAdminOrderStatus(
                  order.status,
                  order.fulfillmentType
                );
                const isSelected = selectedOrderId === order.id;
                const isChecked = selectedOrderIds.has(order.id);
                const totalUnits = order.items.reduce(
                  (sum, item) => sum + item.qty,
                  0
                );
                const hasBomBundle = order.items.some(
                  (i) => Boolean(i.bundleName || i.bomProjectName)
                );
                const courierName = resolveCourierName(order);
                const province =
                  order.structuredAddress?.province ||
                  (order.deliveryAddress?.includes("Pampanga")
                    ? "Pampanga"
                    : order.deliveryAddress?.includes("Bulacan")
                    ? "Bulacan"
                    : order.deliveryAddress?.includes("Nueva Ecija")
                    ? "Nueva Ecija"
                    : order.deliveryAddress?.includes("Tarlac")
                    ? "Tarlac"
                    : order.deliveryAddress?.includes("Bataan")
                    ? "Bataan"
                    : order.deliveryAddress?.includes("Zambales")
                    ? "Zambales"
                    : "Central Luzon");

                return (
                  <tr
                    key={order.id}
                    data-testid={`master-order-row-${order.orderNumber}`}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`transition-colors cursor-pointer ${
                      isChecked
                        ? "bg-[#89B4FA]/15"
                        : isSelected
                        ? "bg-[#89B4FA]/10"
                        : "hover:bg-[#313244]/35"
                    }`}
                  >
                    {/* Checkbox */}
                    <td
                      className="py-4 pl-4 pr-2 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select order #${order.orderNumber}`}
                        data-testid={`order-checkbox-${order.orderNumber}`}
                        checked={isChecked}
                        onChange={() => handleToggleSelectOrder(order.id)}
                        className="w-4 h-4 rounded-sm border-[#45475A] bg-[#181825] text-[#89B4FA] focus:ring-0 focus:outline-none cursor-pointer"
                      />
                    </td>

                    {/* 1. Order ID */}
                    <td className="py-4 pl-2 pr-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#CDD6F4] text-xs">
                        #{order.orderNumber}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-[#A6ADC8]">
                          {order.items.length}{" "}
                          {order.items.length === 1 ? "SKU" : "SKUs"} (
                          {totalUnits} {totalUnits === 1 ? "unit" : "units"})
                        </span>
                        {hasBomBundle && (
                          <span className="px-1.5 py-0 rounded-xs text-[9px] font-mono font-bold bg-[#94E2D5]/12 text-[#94E2D5] border border-[#94E2D5]/30">
                            BOM
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Date */}
                    <td className="py-4 px-3 font-mono text-[#BAC2DE] whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>

                    {/* 3. Customer & Province */}
                    <td className="py-4 px-3">
                      <div className="font-semibold text-[#CDD6F4]">
                        {order.recipientName}
                      </div>
                      <div className="text-[11px] font-mono text-[#A6ADC8]">
                        {order.contactNumber}
                      </div>
                      <div className="text-[10px] font-mono text-[#74C7EC]">
                        📍 {province}
                      </div>
                    </td>

                    {/* 4. Fulfillment Type & Courier */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      {order.fulfillmentType === "PICKUP" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#94E2D5]/12 text-[#94E2D5] border border-[#94E2D5]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#94E2D5]" />
                          <span>Store Pickup (₱0.00)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#74C7EC]/12 text-[#74C7EC] border border-[#74C7EC]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#74C7EC]" />
                          <span>Region III Delivery</span>
                        </span>
                      )}
                      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-[#BAC2DE]">
                        <span className="font-semibold text-[#89B4FA]">{courierName}</span>
                        {order.trackingNo ? (
                          <span className="text-[#A6ADC8]">({order.trackingNo})</span>
                        ) : (
                          <span className="text-[#F9E2AF] italic">(Pending Trk)</span>
                        )}
                      </div>
                    </td>

                    {/* 5. Payment Method */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <Badge
                        variant={
                          order.paymentMethod === "COD"
                            ? "primary"
                            : "secondary"
                        }
                        className="font-mono"
                      >
                        {formatPaymentMethodLabel(order.paymentMethod)}
                      </Badge>
                    </td>

                    {/* 6. Total Amount */}
                    <td className="py-4 px-3 font-mono font-bold text-[#CDD6F4] whitespace-nowrap">
                      <div>{formatPrice(order.totalAmount)}</div>
                      <div className="text-[10px] font-normal text-[#A6ADC8]">
                        {order.deliveryFee === 0
                          ? "Free Shipping"
                          : `+${formatPrice(order.deliveryFee)} fee`}
                      </div>
                    </td>

                    {/* 7. Status Badge */}
                    <td className="py-4 px-3 whitespace-nowrap">
                      <span
                        data-testid={`row-status-badge-${order.orderNumber}`}
                        data-status={statusMeta.pipelineKey}
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
                        <span>{statusMeta.badgeText}</span>
                      </span>
                    </td>

                    {/* 8. Action */}
                    <td
                      className="py-4 pl-3 pr-5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="surface"
                          size="compact"
                          title="Print Packaging & Shipping Slip"
                          data-testid={`print-slip-btn-${order.orderNumber}`}
                          onClick={() => printOrderShippingSlip(order)}
                          className="text-xs font-semibold gap-1 px-2.5"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M6 9V2h12v7" />
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                            <path d="M6 14h12v8H6z" />
                          </svg>
                          <span className="hidden xl:inline">Slip</span>
                        </Button>

                        <Button
                          type="button"
                          variant={isSelected ? "accent" : "outline"}
                          size="compact"
                          data-testid={`manage-order-btn-${order.orderNumber}`}
                          onClick={() => setSelectedOrderId(order.id)}
                          className="text-xs font-semibold"
                        >
                          Manage / View Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 px-6 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                      <p className="text-sm font-bold text-[#CDD6F4]">
                        No matching orders found
                      </p>
                      <p className="text-xs text-[#A6ADC8]">
                        No orders match your active status tab ({activeTab}),
                        fulfillment, province, courier, or search query.
                      </p>
                      <Button
                        type="button"
                        variant="surface"
                        size="small"
                        onClick={() => {
                          setActiveTab("ALL");
                          setFulfillmentFilter("ALL");
                          setProvinceFilter("ALL");
                          setCourierFilter("ALL");
                          setSearchQuery("");
                        }}
                        className="text-xs font-semibold"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* C. Order Inspection & Management Drawer / Modal */}
      <AdminOrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrderId(null)}
        onConfirmToProcessing={handleConfirmToProcessing}
        onDispatchDelivery={handleDispatchDelivery}
        onMarkReadyForPickup={handleMarkReadyForPickup}
        onMarkDelivered={handleMarkDelivered}
        onCancelOrder={handleCancelOrder}
      />
    </div>
  );
}
