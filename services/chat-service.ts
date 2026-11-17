import type {
  ChatConversation,
  ChatMessage,
  ChatAttachment,
} from "@/types/chat";
import { INITIAL_CONVERSATIONS, CHAT_AUTO_REPLIES } from "@/lib/mocks/chat";

type Listener = () => void;

export const MAX_ATTACHMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
];

export function validateChatAttachment(file: {
  name: string;
  size: number;
  type: string;
}): { valid: boolean; error?: string } {
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the maximum allowed size of 5 MB.`,
    };
  }

  const mimeByExtension: Record<string, string[]> = {
    png: ["image/png"], jpg: ["image/jpeg"], jpeg: ["image/jpeg"],
    webp: ["image/webp"], gif: ["image/gif"], pdf: ["application/pdf"],
    txt: ["text/plain"], csv: ["text/csv", "text/plain"],
  };
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedTypes = mimeByExtension[ext];
  const genericType = !file.type || file.type === "application/octet-stream";
  if (!expectedTypes || (!genericType && !expectedTypes.includes(file.type.toLowerCase()))) {
    return { valid: false, error: "Unsupported file type. Attach PNG, JPEG, WebP, GIF, PDF, TXT or CSV." };
  }
  return { valid: true };
}

interface ApiChatMessage {
  id: string;
  senderRole: "BUYER" | "ADMIN" | "SYSTEM";
  content: string;
  createdAt: string;
  metadata?: {
    attachment?: ChatAttachment;
    productId?: string;
    orderNumber?: string;
    orderStatus?: string;
  } | null;
}

interface ApiChatConversation {
  id: string;
  title?: string;
  status?: string;
  messages?: ApiChatMessage[];
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

class ChatStore {
  private convos: ChatConversation[] = INITIAL_CONVERSATIONS.map((c) => ({
    ...c,
    messages: [...c.messages],
  }));
  private listeners: Set<Listener> = new Set();
  private autoReplyTimers: Set<NodeJS.Timeout> = new Set();
  private attachmentUrls = new Set<string>();

  getConversations(): ChatConversation[] {
    return [...this.convos];
  }

  getConversationById(id: string): ChatConversation | undefined {
    return this.convos.find((c) => c.id === id);
  }

  async syncFromApi(): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const res = await fetch("/api/conversations", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.conversations) && data.conversations.length > 0) {
          const mappedConvos: ChatConversation[] = data.conversations.map(
            (c: ApiChatConversation) => {
              const name =
                c.title ||
                (c.user
                  ? `${c.user.firstName || ""} ${c.user.lastName || ""}`.trim()
                  : "Support Inquiry");

              const initials =
                name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase() || "Ω";

              const messages: ChatMessage[] = Array.isArray(c.messages)
                ? c.messages.map((m: ApiChatMessage) => {
                    const from: "buyer" | "admin" | "system" =
                      m.senderRole === "ADMIN"
                        ? "admin"
                        : m.senderRole === "SYSTEM"
                        ? "system"
                        : "buyer";

                    const timeStr = new Date(m.createdAt).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" }
                    );

                    const meta = m.metadata || {};

                    return {
                      id: m.id,
                      from,
                      type: meta.attachment
                        ? "attachment"
                        : meta.productId
                        ? "product"
                        : meta.orderNumber
                        ? "order"
                        : "text",
                      text: m.content,
                      time: timeStr,
                      attachment: meta.attachment,
                      productId: meta.productId,
                      orderNumber: meta.orderNumber,
                      orderStatus: meta.orderStatus,
                    };
                  })
                : [];

              return {
                id: c.id,
                name,
                subtitle: c.status || "Active Thread",
                initials,
                color: "#89B4FA",
                online: true,
                messages,
              };
            }
          );

          // Merge live backend threads
          const realIds = new Set(mappedConvos.map((mc) => mc.id));
          const preservedFixtures = this.convos.filter((fc) => !realIds.has(fc.id));
          this.convos = [...mappedConvos, ...preservedFixtures];
          this.emit();
        }
      }
    } catch (err) {
      console.warn("Could not sync chat conversations from backend:", err);
    }
  }

  sendMessage(
    convoId: string,
    messageData: {
      text?: string;
      attachment?: ChatAttachment;
      productId?: string;
      orderNumber?: string;
      orderStatus?: string;
      from?: "buyer" | "admin" | "system";
    }
  ): ChatMessage {
    const convo = this.convos.find((c) => c.id === convoId);
    if (!convo) throw new Error(`Conversation ${convoId} not found`);

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      from: messageData.from ?? "buyer",
      type: messageData.attachment
        ? "attachment"
        : messageData.productId
        ? "product"
        : messageData.orderNumber
        ? "order"
        : "text",
      text: messageData.text,
      time: timeStr,
      attachment: messageData.attachment,
      productId: messageData.productId,
      orderNumber: messageData.orderNumber,
      orderStatus: messageData.orderStatus,
    };

    if (newMsg.attachment?.url.startsWith("blob:")) this.attachmentUrls.add(newMsg.attachment.url);
    convo.messages.push(newMsg);
    this.emit();

    // Fire backend message dispatch in browser runtime
    if (typeof window !== "undefined") {
      fetch(`/api/conversations/${encodeURIComponent(convoId)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: messageData.text || (messageData.attachment ? `[Attachment: ${messageData.attachment.name}]` : "[Card]"),
          metadata: {
            attachment: messageData.attachment,
            productId: messageData.productId,
            orderNumber: messageData.orderNumber,
            orderStatus: messageData.orderStatus,
          },
        }),
      }).catch((err) => {
        console.warn("Failed to dispatch message to backend API:", err);
      });
    }

    // Trigger simulated reply if sender was buyer on fixture threads
    if (newMsg.from === "buyer" && convoId.startsWith("c")) {
      this.scheduleAutoReply(convoId, messageData.text);
    }

    return newMsg;
  }

  private scheduleAutoReply(convoId: string, userText?: string): void {
    const smartReply = this.generateSupportResponse(convoId, userText);

    const timer = setTimeout(() => {
      this.autoReplyTimers.delete(timer);
      const convo = this.convos.find((c) => c.id === convoId);
      if (convo) {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        convo.messages.push({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          from: "admin",
          type: "text",
          text: smartReply,
          time: timeStr,
        });
        this.emit();
      }
    }, 800);

    this.autoReplyTimers.add(timer);
  }

  private generateSupportResponse(convoId: string, text?: string): string {
    if (!text || !text.trim()) {
      return "Hello! How can our OhmSim technical team assist you today?";
    }

    const lower = text.toLowerCase();

    // 1. Order Cancellation Intent
    if (
      lower.includes("cancel") ||
      lower.includes("cancellation") ||
      lower.includes("stop order") ||
      lower.includes("dont want") ||
      lower.includes("don't want")
    ) {
      return "To cancel an order: Go to your Orders page (/orders). While your order status is PENDING or PREPARING, you can click the red 'Cancel Order' button to immediately cancel it and restore component inventory.";
    }

    // 2. Returns & Refunds Intent
    if (
      lower.includes("refund") ||
      lower.includes("return") ||
      lower.includes("defective") ||
      lower.includes("damaged") ||
      lower.includes("broken") ||
      lower.includes("exchange")
    ) {
      return "We offer a 7-day replacement/refund guarantee for defective components or unopened items across Region III. Please provide your Order Number and photo/video proof, and our team will process an RMA replacement.";
    }

    // 3. Shipping, Tracking & Delivery ETA Intent
    if (
      lower.includes("where is") ||
      lower.includes("tracking") ||
      lower.includes("track") ||
      lower.includes("delivery") ||
      lower.includes("arrive") ||
      lower.includes("shipping") ||
      lower.includes("rider") ||
      lower.includes("courier") ||
      lower.includes("status")
    ) {
      return "You can check real-time order status and courier tracking directly on your Orders tab (/orders). Region III door-to-door deliveries generally arrive within 1–3 business days. Campus lab pickups are ready during building hours (Mon–Sat 8AM–6PM).";
    }

    // 4. Payment, GCash, Maya & COD Intent
    if (
      lower.includes("gcash") ||
      lower.includes("maya") ||
      lower.includes("payment") ||
      lower.includes("pay") ||
      lower.includes("cod") ||
      lower.includes("qr") ||
      lower.includes("receipt")
    ) {
      return "We support GCash QR, Maya QR, Cash on Delivery (COD), and Pay on Pickup at Building 3, Room 204. During checkout, scan our official QR Ph code or transfer to 0917 588 6467 (GCash) / 0918 599 6292 (Maya), then enter your transaction reference number.";
    }

    // 5. Stock, Availability & Pricing Intent
    if (
      lower.includes("stock") ||
      lower.includes("available") ||
      lower.includes("how much") ||
      lower.includes("price") ||
      lower.includes("inventory") ||
      lower.includes("in stock")
    ) {
      return "All product pricing and stock quantities on the Catalog (/products) are updated live from our Central Luzon warehouse. If you need bulk components for university capstone projects, you can compile them in the BOM tool (/bom) for reservations.";
    }

    // 6. Technical Microcontroller / Hardware Inquiries
    if (
      lower.includes("arduino") ||
      lower.includes("esp32") ||
      lower.includes("esp") ||
      lower.includes("raspberry") ||
      lower.includes("voltage") ||
      lower.includes("3.3v") ||
      lower.includes("5v") ||
      lower.includes("pinout") ||
      lower.includes("schematic") ||
      lower.includes("sensor")
    ) {
      return "For circuit design: The ESP32 operates at 3.3V logic (VIN pin accepts 5V via onboard regulator), while Arduino Uno R3 operates at 5V logic. When connecting 5V sensors to ESP32 GPIOs, ensure you use a logic level converter or voltage divider.";
    }

    // 7. Greetings Intent
    if (
      lower.includes("hi") ||
      lower.includes("hello") ||
      lower.includes("good morning") ||
      lower.includes("good afternoon") ||
      lower.includes("hey")
    ) {
      return "Hello! Welcome to OhmSim Support. How can we help you with your electronics projects, orders, or hardware components today?";
    }

    // 8. Default contextual fallback
    const replies = CHAT_AUTO_REPLIES[convoId] ?? CHAT_AUTO_REPLIES.c1;
    return replies[Math.floor(Math.random() * replies.length)];
  }

  createConversation(name: string, subtitle: string = "New Inquiry"): ChatConversation {
    const initials = name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "Ω";
    const colors = ["#89B4FA", "#94E2D5", "#CBA6F7", "#F38BA8", "#FAB387", "#A6E3A1"];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const newConvo: ChatConversation = {
      id: `conv-${Date.now()}`,
      name,
      subtitle,
      initials,
      color,
      online: true,
      messages: [
        {
          id: `msg-${Date.now()}`,
          from: "admin",
          type: "text",
          text: `Hello! Thanks for starting a conversation regarding "${name}". How can we assist you today?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ],
    };

    this.convos.unshift(newConvo);
    this.emit();

    if (typeof window !== "undefined") {
      fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: name,
        }),
      }).catch((err) => {
        console.warn("Failed to create conversation on backend API:", err);
      });
    }

    return newConvo;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  cleanup(): void {
    this.autoReplyTimers.forEach((timer) => clearTimeout(timer));
    this.autoReplyTimers.clear();
    this.attachmentUrls.forEach((url) => URL.revokeObjectURL(url));
    this.attachmentUrls.clear();
    this.convos = INITIAL_CONVERSATIONS.map((c) => ({ ...c, messages: [...c.messages] }));
    this.emit();
  }

  private emit(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in chat listener:", err);
      }
    });
  }
}

export const chatStore = new ChatStore();

export function syncChatConversationsFromApi(): Promise<void> {
  return chatStore.syncFromApi();
}

export function getChatConversations(): ChatConversation[] {
  return chatStore.getConversations();
}

export function getChatConversationById(id: string): ChatConversation | undefined {
  return chatStore.getConversationById(id);
}

export function sendChatMessage(
  convoId: string,
  data: {
    text?: string;
    attachment?: ChatAttachment;
    productId?: string;
    orderNumber?: string;
    orderStatus?: string;
    from?: "buyer" | "admin" | "system";
  }
): ChatMessage {
  return chatStore.sendMessage(convoId, data);
}

export function createChatConversation(name: string, subtitle?: string): ChatConversation {
  return chatStore.createConversation(name, subtitle);
}
