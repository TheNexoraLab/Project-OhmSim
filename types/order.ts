/**
 * OhmSim Canonical Order & Fulfillment Types
 * Reconciled against docs/FULFILLMENT_AND_DELIVERY_SPEC.md (Version 1.0 MVP)
 */

export type FulfillmentType = "PICKUP" | "DELIVERY";

export type PaymentMethod = "COD" | "PAY_ON_PICKUP";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export const REGION_3_PROVINCES = [
  "Aurora",
  "Bataan",
  "Bulacan",
  "Nueva Ecija",
  "Pampanga",
  "Tarlac",
  "Zambales",
] as const;

export type Region3Province = typeof REGION_3_PROVINCES[number];

export interface UserAddress {
  id: string;
  label: string;
  recipientName: string;
  contactNumber: string;
  region: "Region III";
  province: Region3Province;
  cityMunicipality: string;
  barangay: string;
  streetAddress: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  price: number;
  qty: number;
  bundleName?: string;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  recipientName: string;
  contactNumber: string;
  deliveryAddress?: string;
  notes?: string;
  subtotalAmount: number;
  deliveryFee: number;
  totalAmount: number;
  items: OrderItem[];
}
