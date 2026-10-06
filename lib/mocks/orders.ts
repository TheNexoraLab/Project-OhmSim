import type { MockOrder } from "@/types/order";
import { PRODUCTS } from "./products";
import { computeDeliveryFee } from "@/lib/fulfillment";

function getProd(id: string) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) throw new Error(`Product ${id} not found in mock fixtures`);
  return {
    productId: p.id,
    productName: p.name,
    productSku: p.sku,
    productImage: p.image,
    price: p.price,
  };
}

/**
 * Synthetic initial mock orders strictly adhering to:
 * - Version 1.0 fulfillment modes (PICKUP & Region III DELIVERY)
 * - BR-045 (Strictly Region 3 Central Luzon addresses)
 * - BR-046 (₱80 standard delivery fee below ₱1,000; FREE delivery at/above ₱1,000; ₱0 for Pickup)
 * - BR-047 (Cash on Delivery & Pay on Pickup only)
 */
const orderSeeds: Omit<MockOrder, "subtotalAmount" | "deliveryFee" | "totalAmount">[] = [
  {
    id: "o1",
    orderNumber: "OHM-2026-089",
    createdAt: "2026-08-28T09:30:00Z",
    fulfillmentType: "DELIVERY",
    paymentMethod: "COD",
    status: "PREPARING",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    deliveryAddress: "123 Rizal Ave, Dolores, San Fernando, Pampanga, Region III",
    trackingNo: null,
    notes: "Leave package with apartment security if not present",

    items: [
      { ...getProd("1"), qty: 1 },
      { ...getProd("5"), qty: 2 },
    ],
  },
  {
    id: "o2",
    orderNumber: "OHM-2026-074",
    createdAt: "2026-08-21T14:15:00Z",
    fulfillmentType: "DELIVERY",
    paymentMethod: "COD",
    status: "OUT_FOR_DELIVERY",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    deliveryAddress: "456 MacArthur Hwy, Balibago, Angeles City, Pampanga, Region III",
    trackingNo: "PH-TRK-20260821-4471",
    notes: "Call upon arrival at gate 2",

    items: [
      { ...getProd("2"), qty: 2 },
      { ...getProd("4"), qty: 1 },
      { ...getProd("8"), qty: 3 },
    ],
  },
  {
    id: "o3",
    orderNumber: "OHM-2026-055",
    createdAt: "2026-08-10T11:00:00Z",
    fulfillmentType: "PICKUP",
    paymentMethod: "PAY_ON_PICKUP",
    status: "READY_FOR_PICKUP",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    deliveryAddress: "Designated Campus Electronics Lab / Store Station",
    trackingNo: null,
    notes: "Picking up after 3:00 PM lecture",

    items: [
      { ...getProd("3"), qty: 2 },
      { ...getProd("6"), qty: 1 },
    ],
  },
  {
    id: "o4",
    orderNumber: "OHM-2026-041",
    createdAt: "2026-07-30T16:20:00Z",
    fulfillmentType: "DELIVERY",
    paymentMethod: "COD",
    status: "COMPLETED",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    deliveryAddress: "789 Maharlika Hwy, Cabanatuan City, Nueva Ecija, Region III",
    trackingNo: "PH-TRK-20260730-2198",

    items: [
      { ...getProd("7"), qty: 1 },
    ],
  },
  {
    id: "o5",
    orderNumber: "OHM-2026-019",
    createdAt: "2026-07-05T10:45:00Z",
    fulfillmentType: "PICKUP",
    paymentMethod: "PAY_ON_PICKUP",
    status: "CANCELLED",
    recipientName: "Alex Rivera",
    contactNumber: "09171234567",
    deliveryAddress: "Designated Campus Electronics Lab / Store Station",
    trackingNo: null,
    notes: "Cancelled per customer request prior to preparation",

    items: [
      { ...getProd("1"), qty: 2 },
      { ...getProd("3"), qty: 1 },
    ],
  },
];

export const INITIAL_ORDERS: MockOrder[] = orderSeeds.map((order) => {
  const subtotalAmount = order.items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = computeDeliveryFee(subtotalAmount, order.fulfillmentType);
  return { ...order, subtotalAmount, deliveryFee, totalAmount: subtotalAmount + deliveryFee };
});
