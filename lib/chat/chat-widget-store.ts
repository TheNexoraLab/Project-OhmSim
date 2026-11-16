export type ChatWidgetMode = "bot" | "seller";

export interface ChatWidgetProductContext {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
}

export interface ChatWidgetOrderContext {
  orderNumber: string;
  status: string;
}

export interface ChatWidgetState {
  isOpen: boolean;
  activeMode: ChatWidgetMode;
  productContext: ChatWidgetProductContext | null;
  orderContext: ChatWidgetOrderContext | null;
  draftPrompt: string;
  bubbleDismissed: boolean;
}

type Listener = () => void;

class ChatWidgetStore {
  private state: ChatWidgetState = {
    isOpen: false,
    activeMode: "bot",
    productContext: null,
    orderContext: null,
    draftPrompt: "",
    bubbleDismissed: false,
  };

  private listeners: Set<Listener> = new Set();

  getState(): ChatWidgetState {
    return { ...this.state };
  }

  open(options?: {
    mode?: ChatWidgetMode;
    product?: ChatWidgetProductContext;
    order?: ChatWidgetOrderContext;
    prompt?: string;
  }): void {
    this.state = {
      ...this.state,
      isOpen: true,
      activeMode: options?.mode ?? this.state.activeMode,
      productContext: options?.product !== undefined ? options.product : this.state.productContext,
      orderContext: options?.order !== undefined ? options.order : this.state.orderContext,
      draftPrompt: options?.prompt !== undefined ? options.prompt : this.state.draftPrompt,
      bubbleDismissed: true,
    };
    this.emit();
  }

  close(): void {
    this.state.isOpen = false;
    this.emit();
  }

  toggle(): void {
    this.state.isOpen = !this.state.isOpen;
    if (this.state.isOpen) {
      this.state.bubbleDismissed = true;
    }
    this.emit();
  }

  setMode(mode: ChatWidgetMode): void {
    this.state.activeMode = mode;
    this.emit();
  }

  setProductContext(product: ChatWidgetProductContext | null): void {
    this.state.productContext = product;
    this.emit();
  }

  setOrderContext(order: ChatWidgetOrderContext | null): void {
    this.state.orderContext = order;
    this.emit();
  }

  setDraftPrompt(prompt: string): void {
    this.state.draftPrompt = prompt;
    this.emit();
  }

  dismissBubble(): void {
    this.state.bubbleDismissed = true;
    this.emit();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error("Error in chatWidgetStore listener:", err);
      }
    });
  }
}

export const chatWidgetStore = new ChatWidgetStore();
