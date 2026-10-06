/**
 * OhmSim Notification Types
 * Buyer Batch 3 Specification
 */

export type NotificationType = "order" | "stock" | "chat" | "system" | "promo";

export type NotificationGroup = "Today" | "Yesterday" | "Earlier";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  group: NotificationGroup;
  linkHref?: string;
  orderNumber?: string;
  productId?: string;
}
