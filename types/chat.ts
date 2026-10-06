/**
 * OhmSim Support Chat Types
 * Buyer Batch 3 Specification
 */

export interface ChatAttachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export type ChatMessageSender = "buyer" | "admin" | "system";

export type ChatMessageType = "text" | "product" | "order" | "attachment";

export interface ChatMessage {
  id: string;
  from: ChatMessageSender;
  type?: ChatMessageType;
  text?: string;
  time: string;
  productId?: string;
  orderNumber?: string;
  orderStatus?: string;
  attachment?: ChatAttachment;
}

export interface ChatConversation {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
  color: string;
  online: boolean;
  messages: ChatMessage[];
}
