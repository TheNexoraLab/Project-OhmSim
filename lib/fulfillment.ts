import type { FulfillmentType } from "@/types/order";

/** Approved BR-046 fee; shared by synthetic fixtures and the service. */
export function computeDeliveryFee(subtotalAmount: number, fulfillmentType: FulfillmentType): number {
  return fulfillmentType === "PICKUP" || subtotalAmount >= 1000 ? 0 : 80;
}
