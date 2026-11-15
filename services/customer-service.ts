export type AdminOrderStatusDisplay =
  | 'PENDING'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface CustomerOrderHistoryItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  paymentMethod: 'COD' | 'PAY_ON_PICKUP';
  status: AdminOrderStatusDisplay;
  totalAmount: number;
  itemCount: number;
  primarySkuSummary: string;
  deliveryAddress: string;
}

export interface AdminCustomerRecord {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  email: string;
  phone: string;
  affiliation: string;
  role: string;
  province:
    | 'Pampanga'
    | 'Bulacan'
    | 'Nueva Ecija'
    | 'Bataan'
    | 'Tarlac'
    | 'Zambales';
  cityMunicipality: string;
  defaultAddress: string;
  campusLabVerified: boolean;
  activeCentralLuzon: boolean;
  joinedAt: string;
  orders: CustomerOrderHistoryItem[];
}

/**
 * Fetch all customers from live backend /api/customers
 */
export async function getCustomers(role: string = 'ADMIN'): Promise<AdminCustomerRecord[]> {
  try {
    const res = await fetch(`/api/customers?role=${encodeURIComponent(role)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Network or database error fetching customers from API:', error);
  }
  return [];
}

/**
 * Fetch single customer detail from live backend /api/customers/[id]
 */
export async function getCustomerById(
  id: string,
  role: string = 'ADMIN'
): Promise<AdminCustomerRecord | null> {
  try {
    const res = await fetch(`/api/customers/${encodeURIComponent(id)}?role=${encodeURIComponent(role)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Network error fetching customer detail:', error);
  }
  return null;
}
