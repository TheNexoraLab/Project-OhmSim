import type { OrderStatus, FulfillmentType } from '@prisma/client';

export const REGION_3_PROVINCES = [
  'Aurora',
  'Bataan',
  'Bulacan',
  'Nueva Ecija',
  'Pampanga',
  'Tarlac',
  'Zambales',
] as const;

export type Region3Province = typeof REGION_3_PROVINCES[number];

/**
 * Validates whether a given province is strictly within Central Luzon (Region III).
 */
export function isValidRegion3Province(province: string): boolean {
  if (!province) return false;
  const normalized = province.trim().toLowerCase();
  return REGION_3_PROVINCES.some((p) => p.toLowerCase() === normalized);
}

/**
 * Returns canonical title-cased Region III province name, or null if outside Region III.
 */
export function getCanonicalRegion3Province(province: string): Region3Province | null {
  if (!province) return null;
  const normalized = province.trim().toLowerCase();
  const match = REGION_3_PROVINCES.find((p) => p.toLowerCase() === normalized);
  return match || null;
}

/**
 * Computes standard delivery fee:
 * - ₱0.00 for on-site lab pickup
 * - ₱0.00 for orders ₱1,000.00 or greater (Free Delivery promo)
 * - ₱80.00 flat rate for standard door-to-door delivery within Region III
 */
export function computeOrderShippingFee(
  subtotal: number,
  fulfillmentType: FulfillmentType | string
): number {
  if (fulfillmentType === 'PICKUP' || subtotal >= 1000) {
    return 0;
  }
  return 80;
}

/**
 * Normalizes input status string (including frontend aliases) to canonical Prisma OrderStatus.
 */
export function normalizeOrderStatus(statusStr: string): OrderStatus | null {
  if (!statusStr) return null;
  const upper = statusStr.trim().toUpperCase();
  switch (upper) {
    case 'PENDING':
      return 'PENDING';
    case 'CONFIRMED':
    case 'PREPARING':
    case 'PROCESSING':
      return 'PROCESSING';
    case 'READY_FOR_PICKUP':
    case 'OUT_FOR_DELIVERY':
    case 'SHIPPED':
      return 'SHIPPED';
    case 'DELIVERED':
    case 'COMPLETED':
      return 'DELIVERED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return null;
  }
}

/**
 * Generates an ACID-safe, collision-resistant, human-readable order number (e.g. OHM-2026-0001).
 */
export async function generateUniqueOrderNumber(tx: {
  order: {
    count: () => Promise<number>;
    findUnique: (args: { where: { orderNumber: string } }) => Promise<unknown>;
  };
}): Promise<string> {
  const year = new Date().getFullYear();
  const count = await tx.order.count();
  let candidate = `OHM-${year}-${String(count + 1).padStart(4, '0')}`;
  
  const existing = await tx.order.findUnique({ where: { orderNumber: candidate } });
  if (existing) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    candidate = `OHM-${year}-${String(count + 1).padStart(3, '0')}${randomHex}`;
  }
  return candidate;
}

/**
 * Computes ordered timeline steps and current progress index for display.
 */
export function computeOrderTimeline(
  status: OrderStatus,
  fulfillmentType: FulfillmentType
): {
  steps: string[];
  currentStepIndex: number;
  isCancelled: boolean;
  statusLabel: string;
} {
  if (status === 'CANCELLED') {
    return {
      steps: ['PENDING', 'CANCELLED'],
      currentStepIndex: 1,
      isCancelled: true,
      statusLabel: 'Cancelled',
    };
  }

  const steps =
    fulfillmentType === 'PICKUP'
      ? ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
      : ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

  const labels: Record<OrderStatus, Record<FulfillmentType, string>> = {
    PENDING: {
      PICKUP: 'Pending Confirmation',
      DELIVERY: 'Pending Confirmation',
    },
    PROCESSING: {
      PICKUP: 'Preparing for Pickup',
      DELIVERY: 'Preparing Order',
    },
    SHIPPED: {
      PICKUP: 'Ready for Pickup',
      DELIVERY: 'Out for Delivery',
    },
    DELIVERED: {
      PICKUP: 'Picked Up & Completed',
      DELIVERY: 'Delivered & Completed',
    },
    CANCELLED: {
      PICKUP: 'Cancelled',
      DELIVERY: 'Cancelled',
    },
  };

  const statusLabel = labels[status]?.[fulfillmentType] || status;
  const currentStepIndex = steps.indexOf(status);

  return {
    steps,
    currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : 0,
    isCancelled: false,
    statusLabel,
  };
}
