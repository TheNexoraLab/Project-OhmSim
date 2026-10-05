import type { MockOrder, UserAddress } from "@/types/order";

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

// In-memory store for placed mock orders in the current frontend session
const placedOrdersStore: MockOrder[] = [];

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
  return placedOrdersStore.find((o) => o.id === idOrNumber || o.orderNumber === idOrNumber);
}
