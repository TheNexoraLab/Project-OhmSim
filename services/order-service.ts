import type { MockOrder, UserAddress, OrderStatus, OrderItem, FulfillmentType, PaymentMethod } from "@/types/order";
import { INITIAL_ORDERS } from "@/lib/mocks/orders";
import { getAddressesSnapshot } from "@/services/profile-service";

/**
 * Pre-seeded saved addresses conforming to BR-048 (maximum 2 saved addresses)
 * and BR-045 (strictly Region 3 Central Luzon).
 */
export { INITIAL_SAVED_ADDRESSES } from "@/lib/mocks/addresses";

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; bg: string; color: string; border: string; description: string }
> = {
  PENDING: {
    label: "Pending",
    bg: "rgba(137, 180, 250, 0.12)",
    color: "#89B4FA",
    border: "rgba(137, 180, 250, 0.3)",
    description: "Order placed and awaiting store confirmation",
  },
  CONFIRMED: {
    label: "Confirmed",
    bg: "rgba(203, 166, 247, 0.12)",
    color: "#CBA6F7",
    border: "rgba(203, 166, 247, 0.3)",
    description: "Order confirmed and inventory allocated",
  },
  PREPARING: {
    label: "Preparing",
    bg: "rgba(249, 226, 175, 0.14)",
    color: "#F9E2AF",
    border: "rgba(249, 226, 175, 0.3)",
    description: "Components are being picked and packed",
  },
  READY_FOR_PICKUP: {
    label: "Ready for Pickup",
    bg: "rgba(148, 226, 213, 0.14)",
    color: "#94E2D5",
    border: "rgba(148, 226, 213, 0.3)",
    description: "Parcel ready at designated Campus Electronics Lab Station",
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    bg: "rgba(137, 220, 235, 0.14)",
    color: "#89DCEB",
    border: "rgba(137, 220, 235, 0.3)",
    description: "Courier is in transit within Region III",
  },
  DELIVERED: {
    label: "Delivered",
    bg: "rgba(166, 227, 161, 0.14)",
    color: "#A6E3A1",
    border: "rgba(166, 227, 161, 0.3)",
    description: "Parcel delivered to destination address",
  },
  COMPLETED: {
    label: "Completed",
    bg: "rgba(166, 227, 161, 0.14)",
    color: "#A6E3A1",
    border: "rgba(166, 227, 161, 0.3)",
    description: "Transaction finalized and completed",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "rgba(243, 139, 168, 0.14)",
    color: "#F38BA8",
    border: "rgba(243, 139, 168, 0.3)",
    description: "Order was cancelled and will not be processed",
  },
};

export const PICKUP_STEPS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

export const DELIVERY_STEPS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

export function getTimelineStepsForOrder(order: MockOrder): {
  steps: OrderStatus[];
  currentStepIndex: number;
  isCancelled: boolean;
} {
  if (order.status === "CANCELLED") {
    return {
      steps: ["PENDING", "CANCELLED"],
      currentStepIndex: 1,
      isCancelled: true,
    };
  }

  const steps = order.fulfillmentType === "PICKUP" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentStepIndex = steps.indexOf(order.status);

  return {
    steps,
    currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : 0,
    isCancelled: false,
  };
}

/**
 * Delivery fee calculation conforming strictly to BR-046:
 * - In-Store / Lab Pickup is strictly FREE (₱0.00).
 * - Central Luzon / Region III Delivery is ₱80 standard fee below ₱1,000 subtotal.
 * - Central Luzon / Region III Delivery is FREE (₱0.00) at or above ₱1,000 subtotal.
 */
export { computeDeliveryFee } from "@/lib/fulfillment";

// In-memory store initialized with synthetic initial orders
const placedOrdersStore: MockOrder[] = [...INITIAL_ORDERS];

export function getSavedAddresses(): UserAddress[] {
  return getAddressesSnapshot().map((address) => ({ ...address }));
}

interface RawBackendOrder {
  id: string;
  orderNumber: string;
  createdAt?: string;
  fulfillmentType: FulfillmentType;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  subtotal?: number;
  subtotalAmount?: number;
  shippingFee?: number;
  deliveryFee?: number;
  totalAmount?: number;
  trackingNumber?: string | null;
  trackingNo?: string | null;
  notes?: string;
  pickupRecipient?: string;
  pickupPhone?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  deliveryAddress?: {
    recipientName?: string;
    phone?: string;
    street?: string;
    barangay?: string;
    city?: string;
    province?: string;
    fullAddress?: string;
  } | null;
  items?: Array<{
    id?: string;
    productId: string;
    productName?: string;
    productSku?: string;
    productImage?: string;
    unitPrice?: number;
    price?: number;
    quantity?: number;
    qty?: number;
    bomProjectName?: string | null;
    bundleName?: string;
    product?: {
      name: string;
      sku: string;
      imageUrls?: string[];
      price?: number;
    };
  }>;
}

export function mapApiOrderToMockOrder(raw: RawBackendOrder): MockOrder {
  const subtotalAmount =
    typeof raw.subtotal === "number"
      ? raw.subtotal
      : typeof raw.subtotalAmount === "number"
      ? raw.subtotalAmount
      : 0;

  const deliveryFee =
    typeof raw.shippingFee === "number"
      ? raw.shippingFee
      : typeof raw.deliveryFee === "number"
      ? raw.deliveryFee
      : 0;

  const totalAmount =
    typeof raw.totalAmount === "number"
      ? raw.totalAmount
      : subtotalAmount + deliveryFee;

  const recipientName =
    raw.deliveryAddress?.recipientName ??
    raw.pickupRecipient ??
    (raw.user ? `${raw.user.firstName} ${raw.user.lastName}`.trim() : "Customer");

  const contactNumber =
    raw.deliveryAddress?.phone ?? raw.pickupPhone ?? raw.user?.phone ?? "";

  let deliveryAddress = raw.deliveryAddress?.fullAddress;
  if (!deliveryAddress && raw.deliveryAddress?.street) {
    deliveryAddress = `${raw.deliveryAddress.street}, ${raw.deliveryAddress.barangay}, ${raw.deliveryAddress.city}, ${raw.deliveryAddress.province}, Region III`;
  }
  if (!deliveryAddress && raw.fulfillmentType === "PICKUP") {
    deliveryAddress = "Campus Electronics Lab Station (Building 3, Room 204)";
  }

  const items: OrderItem[] = Array.isArray(raw.items)
    ? raw.items.map((item) => ({
        productId: item.productId,
        productName:
          item.productName || item.product?.name || "Electronic Component",
        productSku: item.productSku || item.product?.sku || "SKU",
        productImage:
          item.productImage ||
          (item.product?.imageUrls && item.product.imageUrls[0]) ||
          "/images/placeholder.jpg",
        price:
          typeof item.unitPrice === "number"
            ? item.unitPrice
            : typeof item.price === "number"
            ? item.price
            : 0,
        qty: item.quantity ?? item.qty ?? 1,
        bundleName: item.bomProjectName || item.bundleName || undefined,
      }))
    : [];

  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    createdAt: raw.createdAt || new Date().toISOString(),
    fulfillmentType: raw.fulfillmentType || "DELIVERY",
    paymentMethod:
      raw.paymentMethod ||
      (raw.fulfillmentType === "PICKUP" ? "PAY_ON_PICKUP" : "COD"),
    status: raw.status || "PENDING",
    recipientName,
    contactNumber,
    deliveryAddress,
    trackingNo: raw.trackingNumber || raw.trackingNo || null,
    notes: raw.notes || undefined,
    subtotalAmount,
    deliveryFee,
    totalAmount,
    items,
  };
}

export interface CreateOrderPayload {
  fulfillmentType: FulfillmentType;
  paymentMethod?: PaymentMethod;
  deliveryAddressId?: string;
  deliveryAddress?: {
    recipientName: string;
    phone: string;
    street: string;
    barangay: string;
    city: string;
    province: string;
    postalCode?: string;
  };
  pickupRecipient?: string;
  pickupPhone?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    bomProjectId?: string;
  }>;
  recipientName?: string;
  contactNumber?: string;
  rawDeliveryAddress?: string;
  subtotalAmount?: number;
  deliveryFee?: number;
  totalAmount?: number;
  allItems?: OrderItem[];
  baseUrl?: string;
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ success: boolean; order?: MockOrder; error?: string }> {
  try {
    const isBrowser = typeof window !== "undefined";
    const base = payload.baseUrl || (isBrowser ? "" : null);

    if (base !== null) {
      const res = await fetch(`${base}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fulfillmentType: payload.fulfillmentType,
          items: payload.items,
          deliveryAddressId: payload.deliveryAddressId,
          deliveryAddress: payload.deliveryAddress,
          pickupRecipient: payload.pickupRecipient,
          pickupPhone: payload.pickupPhone,
          notes: payload.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.order) {
        const mapped = mapApiOrderToMockOrder(data.order);
        placedOrdersStore.unshift(mapped);
        return { success: true, order: mapped };
      }

      if (!res.ok) {
        return {
          success: false,
          error: data.error || "Failed to create order on backend server.",
        };
      }
    }
  } catch (error) {
    console.warn("Backend order creation failed, falling back to mock:", error);
  }

  // Graceful fallback to verified in-memory store
  const mockOrder = createMockOrder({
    fulfillmentType: payload.fulfillmentType,
    paymentMethod:
      payload.paymentMethod ||
      (payload.fulfillmentType === "PICKUP" ? "PAY_ON_PICKUP" : "COD"),
    recipientName: payload.recipientName || "Customer",
    contactNumber: payload.contactNumber || "09171234567",
    deliveryAddress: payload.rawDeliveryAddress,
    notes: payload.notes,
    subtotalAmount: payload.subtotalAmount || 0,
    deliveryFee: payload.deliveryFee || 0,
    totalAmount: payload.totalAmount || 0,
    items: payload.allItems || [],
    trackingNo: null,
  });

  return { success: true, order: mockOrder };
}

export function createMockOrder(
  orderData: Omit<MockOrder, "id" | "orderNumber" | "createdAt" | "status">
): MockOrder {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 900) + 100;
  const orderNumber = `OHM-${year}-${seq}`;
  const id = `ord-${Date.now()}`;

  const newOrder: MockOrder = {
    ...orderData,
    id,
    orderNumber,
    createdAt: new Date().toISOString(),
    status: "PENDING",
  };

  placedOrdersStore.unshift(newOrder);
  return newOrder;
}

export async function getOrders(options?: {
  userId?: string;
  status?: string;
  baseUrl?: string;
}): Promise<MockOrder[]> {
  try {
    const isBrowser = typeof window !== "undefined";
    const base = options?.baseUrl || (isBrowser ? "" : null);

    if (base !== null) {
      const searchParams = new URLSearchParams();
      if (options?.userId) searchParams.set("userId", options.userId);
      if (options?.status) searchParams.set("status", options.status);
      const qs = searchParams.toString();
      const url = `${base}/api/orders${qs ? `?${qs}` : ""}`;

      const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.orders)) {
          const mappedList = data.orders.map(mapApiOrderToMockOrder);
          // Sync into placedOrdersStore to keep memory snapshot up-to-date
          for (const item of mappedList) {
            const idx = placedOrdersStore.findIndex((o) => o.id === item.id);
            if (idx >= 0) {
              placedOrdersStore[idx] = item;
            } else {
              placedOrdersStore.push(item);
            }
          }
          return mappedList;
        }
      }
    }
  } catch (err) {
    console.warn("Could not fetch orders from backend:", err);
  }

  return getMockOrders();
}

export function getMockOrders(): MockOrder[] {
  return [...placedOrdersStore];
}

export async function getOrderById(
  idOrNumber: string,
  options?: { baseUrl?: string }
): Promise<MockOrder | undefined> {
  const cached = getMockOrderById(idOrNumber);
  if (cached) return cached;

  try {
    const isBrowser = typeof window !== "undefined";
    const base = options?.baseUrl || (isBrowser ? "" : null);

    if (base !== null) {
      const res = await fetch(`${base}/api/orders/${encodeURIComponent(idOrNumber)}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          const mapped = mapApiOrderToMockOrder(data.order);
          placedOrdersStore.unshift(mapped);
          return mapped;
        }
      }
    }
  } catch {
    // Fall back to sync
  }

  return getMockOrderById(idOrNumber);
}

export function getMockOrderById(idOrNumber: string): MockOrder | undefined {
  const normalized = idOrNumber.trim().toLowerCase();
  return placedOrdersStore.find(
    (o) =>
      o.id.toLowerCase() === normalized ||
      o.orderNumber.toLowerCase() === normalized ||
      o.orderNumber.toLowerCase().replace("#", "") === normalized
  );
}

export async function updateOrderStatus(
  orderId: string,
  params: {
    status: OrderStatus;
    trackingNumber?: string;
    notes?: string;
    cancelledReason?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window !== "undefined") {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error };
      }
    }

    // Update in-memory store
    const target = placedOrdersStore.find(
      (o) => o.id === orderId || o.orderNumber === orderId
    );
    if (target) {
      target.status = params.status;
      if (params.trackingNumber) target.trackingNo = params.trackingNumber;
      if (params.notes) target.notes = params.notes;
    }

    return { success: true };
  } catch (error) {
    console.warn("Failed to patch order status:", error);
    return { success: false, error: "Network error" };
  }
}

export function filterMockOrders(
  query?: string,
  statusFilter?: OrderStatus | "ALL"
): MockOrder[] {
  const q = query?.trim().toLowerCase() ?? "";
  const s = statusFilter ?? "ALL";

  return placedOrdersStore.filter((order) => {
    if (s !== "ALL" && order.status !== s) {
      return false;
    }
    if (q) {
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchItem = order.items.some(
        (i) =>
          i.productName.toLowerCase().includes(q) ||
          i.productSku.toLowerCase().includes(q)
      );
      const matchAddress =
        order.deliveryAddress?.toLowerCase().includes(q) ?? false;
      if (!matchNumber && !matchItem && !matchAddress) {
        return false;
      }
    }
    return true;
  });
}
