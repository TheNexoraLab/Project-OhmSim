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
  // Browser metadata validation only; real uploads need server/content validation.
  return { valid: true };
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

    // Trigger simulated reply if sender was buyer
    if (newMsg.from === "buyer") {
      this.scheduleAutoReply(convoId);
    }

    return newMsg;
  }

  private scheduleAutoReply(convoId: string): void {
    const replies = CHAT_AUTO_REPLIES[convoId] ?? CHAT_AUTO_REPLIES.c1;
    const randomReply = replies[Math.floor(Math.random() * replies.length)];

    const timer = setTimeout(() => {
      this.autoReplyTimers.delete(timer);
      const convo = this.convos.find((c) => c.id === convoId);
      if (convo) {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        convo.messages.push({
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          from: "admin",
          type: "text",
          text: randomReply,
          time: timeStr,
        });
        this.emit();
      }
    }, 1000);

    this.autoReplyTimers.add(timer);
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
