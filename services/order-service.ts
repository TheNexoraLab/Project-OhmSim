import type { MockOrder, UserAddress, OrderStatus } from "@/types/order";
import { INITIAL_ORDERS } from "@/lib/mocks/orders";

/**
 * Pre-seeded saved addresses conforming to BR-048 (maximum 2 saved addresses)
 * and BR-045 (strictly Region 3 Central Luzon).
 */
export const INITIAL_SAVED_ADDRESSES: UserAddress[] = [
  {
    id: "addr-home",
    label: "Home / Dormitory",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    region: "Region III",
    province: "Pampanga",
    cityMunicipality: "San Fernando",
    barangay: "Dolores",
    streetAddress: "123 Rizal Ave",
    postalCode: "2000",
    isDefault: true,
  },
  {
    id: "addr-lab",
    label: "Campus Electronics Lab",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    region: "Region III",
    province: "Pampanga",
    cityMunicipality: "Angeles City",
    barangay: "Balibago",
    streetAddress: "456 MacArthur Hwy",
    postalCode: "2009",
    isDefault: false,
  },
];

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
  return [...INITIAL_SAVED_ADDRESSES];
}

export function createMockOrder(orderData: Omit<MockOrder, "id" | "orderNumber" | "createdAt" | "status">): MockOrder {
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

export function getMockOrders(): MockOrder[] {
  return [...placedOrdersStore];
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

export function filterMockOrders(query?: string, statusFilter?: OrderStatus | "ALL"): MockOrder[] {
  const q = query?.trim().toLowerCase() ?? "";
  const s = statusFilter ?? "ALL";

  return placedOrdersStore.filter((order) => {
    if (s !== "ALL" && order.status !== s) {
      return false;
    }
    if (q) {
      const matchNumber = order.orderNumber.toLowerCase().includes(q);
      const matchItem = order.items.some(
        (i) => i.productName.toLowerCase().includes(q) || i.productSku.toLowerCase().includes(q)
      );
      const matchAddress = order.deliveryAddress?.toLowerCase().includes(q) ?? false;
      if (!matchNumber && !matchItem && !matchAddress) {
        return false;
      }
    }
    return true;
  });
}
