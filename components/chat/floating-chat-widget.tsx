"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { chatWidgetStore } from "@/lib/chat/chat-widget-store";
import { INQUIRY_CATEGORIES, type InquiryChip } from "@/lib/chat/inquiry-chips";
import { matchOhmBotQuery, type BotAnswer } from "@/lib/chat/ohmbot-knowledge";
import {
  getChatConversations,
  sendChatMessage,
  chatStore,
} from "@/services/chat-service";
import type { ChatConversation } from "@/types/chat";
import { getProductByIdSync } from "@/services/catalog-service";
import { ChatFormattedText } from "./chat-formatted-text";

interface LocalBotMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  suggestedAction?: BotAnswer["suggestedAction"];
  relatedChips?: { label: string; prompt: string }[];
}

function createLocalBotMessage(
  from: "user" | "bot",
  text: string,
  extra?: {
    suggestedAction?: BotAnswer["suggestedAction"];
    relatedChips?: { label: string; prompt: string }[];
  }
): LocalBotMessage {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return {
    id: `msg-${Math.random().toString(36).substring(2, 9)}`,
    from,
    text,
    time: timeStr,
    suggestedAction: extra?.suggestedAction,
    relatedChips: extra?.relatedChips,
  };
}

const INITIAL_BOT_MESSAGES: LocalBotMessage[] = [
  {
    id: "init-1",
    from: "bot",
    text: "⚡ **Hello! I'm OhmBot, your 24/7 Electronics & Catalog Assistant.**\n\nAsk me about 3.3V vs 5V logic compatibility, sensor comparisons (DHT22 vs BME280), capstone BOM budgeting, or Region III campus pickup. How can I assist your project today?",
    time: "Just now",
    relatedChips: [
      { label: "Check 3.3V vs 5V logic", prompt: "Can I connect a 5V sensor directly to the ESP32 GPIO pins?" },
      { label: "Suggest IoT Weather parts", prompt: "Recommend components for an IoT Weather / Smart Agriculture capstone project." },
      { label: "Campus Lab Station pickup", prompt: "Where is the Campus Electronics Lab Station pickup point located, and is pickup free (₱0)?" },
      { label: "Connect to live seller/admin", prompt: "I need to speak directly with the store administrator or laboratory technician." },
    ],
  },
];

export function FloatingChatWidget() {
  const pathname = usePathname();

  // Route guard: hide floating widget on full chat page or admin pages
  const isHiddenRoute = pathname === "/chat" || pathname?.startsWith("/admin");

  const [widgetState, setWidgetState] = useState(() => chatWidgetStore.getState());
  const [activeCategory, setActiveCategory] = useState<string>("circuits");
  const [inputText, setInputText] = useState("");
  const [botMessages, setBotMessages] = useState<LocalBotMessage[]>(INITIAL_BOT_MESSAGES);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [showProactiveBubble, setShowProactiveBubble] = useState(true);

  // Seller conversation integration
  const [sellerConvos, setSellerConvos] = useState<ChatConversation[]>(() => getChatConversations());
  const sellerActiveConvo = sellerConvos[0];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Subscribe to widget store
  useEffect(() => {
    return chatWidgetStore.subscribe(() => {
      const next = chatWidgetStore.getState();
      setWidgetState(next);
      if (next.draftPrompt) {
        setInputText(next.draftPrompt);
        chatWidgetStore.setDraftPrompt("");
      }
    });
  }, []);

  // Subscribe to seller chat store
  useEffect(() => {
    return chatStore.subscribe(() => {
      setSellerConvos(getChatConversations());
    });
  }, []);

  // Update context based on pathname if browsing a product
  useEffect(() => {
    if (pathname?.startsWith("/products/")) {
      const id = pathname.replace("/products/", "").split("/")[0];
      const prod = getProductByIdSync(id);
      if (prod) {
        chatWidgetStore.setProductContext({
          id: prod.id,
          name: prod.name,
          price: prod.price,
          image: prod.image,
          category: prod.category,
        });
      }
    }
  }, [pathname]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (widgetState.isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [botMessages, sellerActiveConvo?.messages.length, widgetState.isOpen, isBotTyping, widgetState.activeMode]);

  // Auto-focus input when opened
  useEffect(() => {
    if (widgetState.isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [widgetState.isOpen]);

  const activeCategoryData = useMemo(() => {
    return INQUIRY_CATEGORIES.find((c) => c.id === activeCategory) ?? INQUIRY_CATEGORIES[0];
  }, [activeCategory]);

  if (isHiddenRoute) return null;

  const handleSendQuery = (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text) return;

    if (widgetState.activeMode === "bot") {
      const userMsg = createLocalBotMessage("user", text);

      setBotMessages((prev) => [...prev, userMsg]);
      setInputText("");
      setIsBotTyping(true);

      setTimeout(() => {
        const answer = matchOhmBotQuery(text, widgetState.productContext);
        const botMsg = createLocalBotMessage("bot", answer.text, {
          suggestedAction: answer.suggestedAction,
          relatedChips: answer.relatedChips,
        });
        setBotMessages((prev) => [...prev, botMsg]);
        setIsBotTyping(false);
      }, 450);
    } else {
      // Seller mode dispatch
      if (sellerActiveConvo) {
        sendChatMessage(sellerActiveConvo.id, {
          text,
          from: "buyer",
          productId: widgetState.productContext?.id,
          orderNumber: widgetState.orderContext?.orderNumber,
        });
      }
      setInputText("");
    }
  };

  const handleChipClick = (chip: InquiryChip | { label: string; prompt: string }) => {
    if (chip.label.includes("seller") || chip.label.includes("human")) {
      chatWidgetStore.setMode("seller");
    }
    handleSendQuery(chip.prompt);
  };

  const handleActionClick = (action: BotAnswer["suggestedAction"]) => {
    if (!action) return;
    if (action.type === "switch_seller") {
      chatWidgetStore.setMode("seller");
    }
  };

  return (
    <>
      {/* 1. Proactive Floating Speech Bubble (Flowii Style) */}
      {!widgetState.isOpen && showProactiveBubble && !widgetState.bubbleDismissed && (
        <div className="fixed bottom-24 md:bottom-20 right-4 md:right-6 z-40 max-w-[290px] sm:max-w-[340px] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Main proactive card */}
          <div className="relative bg-mocha-panel/95 backdrop-blur-md border border-mocha-accent/30 text-mocha-text rounded-2xl p-3.5 shadow-2xl text-xs leading-relaxed group hover:border-mocha-accent transition-all">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowProactiveBubble(false);
                chatWidgetStore.dismissBubble();
              }}
              className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-mocha-panel-raised border border-mocha-border text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel flex items-center justify-center text-[10px] transition-colors shadow-sm"
              title="Dismiss suggestion"
              aria-label="Dismiss suggestion"
            >
              ✕
            </button>

            <div
              className="cursor-pointer"
              onClick={() => {
                chatWidgetStore.open({ mode: "bot" });
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-[11px] text-mocha-accent tracking-wide uppercase">
                  OhmBot AI · 24/7 Support
                </span>
              </div>
              <p className="text-[12px] font-medium text-mocha-text">
                👋 Hi! Need circuit help or BOM advice for your capstone project?
              </p>
            </div>
          </div>

          {/* Quick-action pill trigger */}
          <button
            type="button"
            onClick={() => {
              chatWidgetStore.open({
                mode: "bot",
                prompt: "Can I connect a 5V sensor directly to the ESP32 GPIO pins?",
              });
              handleSendQuery("Can I connect a 5V sensor directly to the ESP32 GPIO pins?");
            }}
            className="bg-mocha-panel-raised/90 backdrop-blur-sm border border-mocha-border/80 hover:border-mocha-accent text-mocha-text rounded-xl px-3 py-1.5 shadow-lg text-[11px] flex items-center gap-1.5 transition-all hover:scale-102 active:scale-98"
          >
            <span className="text-mocha-accent">⚡</span>
            <span>Can I power an ESP32 with 5V VIN? · <strong className="text-mocha-accent">Tap to Ask</strong></span>
          </button>
        </div>
      )}

      {/* 2. Floating Launcher Button (Squircle with Robot Emblem) */}
      {!widgetState.isOpen && (
        <button
          type="button"
          onClick={() => chatWidgetStore.toggle()}
          aria-label="Open OhmSim Support and Technical Chatbot"
          className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-14 h-14 rounded-2xl bg-gradient-to-tr from-mocha-panel-raised via-mocha-panel to-mocha-panel-raised border-2 border-mocha-accent/60 hover:border-mocha-accent shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:shadow-mocha-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          {/* Robot Emblem SVG */}
          <div className="relative text-mocha-accent group-hover:text-mocha-accent-secondary transition-colors">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="3" />
              <circle cx="12" cy="5" r="2" />
              <path d="M12 7v4" />
              <line x1="8" y1="16" x2="8" y2="16.01" />
              <line x1="16" y1="16" x2="16" y2="16.01" />
            </svg>

            {/* Glowing Online Pulse Indicator */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-mocha-panel"></span>
            </span>
          </div>
        </button>
      )}

      {/* 3. Pop-up Chat Window (Drawer) */}
      {widgetState.isOpen && (
        <div
          role="dialog"
          aria-label="OhmSim Assistant & Seller Chat"
          className="fixed bottom-20 md:bottom-6 right-2 sm:right-6 z-50 w-[calc(100vw-16px)] sm:w-[420px] h-[580px] max-h-[82vh] bg-mocha-panel/95 backdrop-blur-xl border border-mocha-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="p-3.5 bg-mocha-panel-raised/90 border-b border-mocha-border/80 flex flex-col gap-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-mocha-accent/15 border border-mocha-accent/30 flex items-center justify-center text-mocha-accent">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="3" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <circle cx="9" cy="16" r="1" fill="currentColor" />
                    <circle cx="15" cy="16" r="1" fill="currentColor" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs text-mocha-text leading-tight">OhmBot Assistant</h3>
                    <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Online
                    </span>
                  </div>
                  <p className="text-[10px] text-mocha-text-muted">Technical guidance & store seller inquiry</p>
                </div>
              </div>

              {/* Header Action Controls */}
              <div className="flex items-center gap-1">
                <Link
                  href="/chat"
                  onClick={() => chatWidgetStore.close()}
                  title="Expand to Full Page Chat Window"
                  className="w-7 h-7 rounded-lg hover:bg-mocha-panel border border-transparent hover:border-mocha-border text-mocha-text-muted hover:text-mocha-text flex items-center justify-center text-xs transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </Link>

                <button
                  type="button"
                  onClick={() => chatWidgetStore.close()}
                  title="Close Assistant"
                  className="w-7 h-7 rounded-lg hover:bg-mocha-panel border border-transparent hover:border-mocha-border text-mocha-text-muted hover:text-mocha-text flex items-center justify-center text-xs transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Segmented Mode Switcher [ OhmBot AI | Chat to Seller ] */}
            <div className="grid grid-cols-2 p-0.5 rounded-xl bg-mocha-bg/80 border border-mocha-border/60 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => chatWidgetStore.setMode("bot")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  widgetState.activeMode === "bot"
                    ? "bg-mocha-panel shadow-sm text-mocha-accent font-bold border border-mocha-accent/20"
                    : "text-mocha-text-muted hover:text-mocha-text"
                }`}
              >
                <span>🤖</span>
                <span>OhmBot AI (24/7)</span>
              </button>

              <button
                type="button"
                onClick={() => chatWidgetStore.setMode("seller")}
                className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  widgetState.activeMode === "seller"
                    ? "bg-mocha-panel shadow-sm text-mocha-accent font-bold border border-mocha-accent/20"
                    : "text-mocha-text-muted hover:text-mocha-text"
                }`}
              >
                <span>👤</span>
                <span>Chat to Seller</span>
              </button>
            </div>
          </div>

          {/* Active Context Banner (When browsing product or order) */}
          {widgetState.productContext && (
            <div className="bg-mocha-bg/90 border-b border-mocha-border/60 px-3 py-1.5 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 truncate">
                <span className="text-mocha-accent text-xs">🔍</span>
                <span className="text-mocha-text-muted truncate">
                  Browsing: <strong className="text-mocha-text">{widgetState.productContext.name}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleSendQuery(`Can you explain the pinouts and 3.3V/5V logic requirements for ${widgetState.productContext?.name}?`);
                }}
                className="text-[10px] font-semibold text-mocha-accent hover:underline shrink-0 ml-2"
              >
                Ask Specs
              </button>
            </div>
          )}

          {/* Suggestion Category Pills & Chips Row */}
          <div className="bg-mocha-panel border-b border-mocha-border/50 px-3 py-2 flex flex-col gap-2 shrink-0">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {INQUIRY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold shrink-0 flex items-center gap-1 transition-all ${
                    activeCategory === cat.id
                      ? "bg-mocha-accent/15 border border-mocha-accent text-mocha-accent"
                      : "bg-mocha-panel-raised border border-mocha-border/60 text-mocha-text-muted hover:text-mocha-text"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {activeCategoryData.chips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className="px-2 py-1 rounded-md text-[10px] bg-mocha-bg/70 hover:bg-mocha-panel-raised border border-mocha-border/60 hover:border-mocha-accent text-mocha-text-muted hover:text-mocha-text transition-colors shrink-0 flex items-center gap-1 max-w-[200px] truncate"
                  title={chip.prompt}
                >
                  <span>{chip.icon}</span>
                  <span className="truncate">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 text-xs bg-gradient-to-b from-mocha-bg/40 to-transparent">
            {widgetState.activeMode === "bot" ? (
              <>
                {botMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      msg.from === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-mocha-text-muted px-1 mb-0.5">
                      {msg.from === "user" ? (
                        <span className="font-semibold text-mocha-text">You</span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-mocha-accent">
                          <span>⚡</span>
                          <span>OhmBot AI</span>
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-mocha-accent/15 border border-mocha-accent/20">BOT</span>
                        </span>
                      )}
                      <span className="text-mocha-text-subtle">•</span>
                      <span className="text-[10px] text-mocha-text-subtle font-mono">{msg.time}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl shadow-sm ${
                        msg.from === "user"
                          ? "bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg font-medium rounded-tr-sm"
                          : "bg-mocha-panel-raised border border-mocha-border text-mocha-text rounded-tl-sm"
                      }`}
                    >
                      <ChatFormattedText content={msg.text} isUser={msg.from === "user"} />
                    </div>

                    {/* Action button inside message */}
                    {msg.suggestedAction && (
                      <button
                        type="button"
                        onClick={() => handleActionClick(msg.suggestedAction)}
                        className="mt-1 px-3 py-1.5 rounded-xl bg-mocha-accent/15 border border-mocha-accent/40 text-mocha-accent hover:bg-mocha-accent/25 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        {msg.suggestedAction.label}
                      </button>
                    )}

                    {/* Follow-up Chips */}
                    {msg.relatedChips && msg.relatedChips.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {msg.relatedChips.map((rc, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendQuery(rc.prompt)}
                            className="px-2 py-0.5 rounded-full text-[10px] bg-mocha-bg border border-mocha-border hover:border-mocha-accent text-mocha-text-muted hover:text-mocha-accent transition-colors"
                          >
                            {rc.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isBotTyping && (
                  <div className="mr-auto flex items-center gap-2 p-2.5 rounded-2xl bg-mocha-panel-raised border border-mocha-border text-[11px] text-mocha-text-muted">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mocha-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-mocha-accent"></span>
                    </span>
                    <span>OhmBot is checking technical specs...</span>
                  </div>
                )}
              </>
            ) : (
              /* Seller Conversation Mode */
              <>
                <div className="p-2.5 rounded-xl bg-mocha-bg/80 border border-mocha-border text-center text-[11px] text-mocha-text-muted">
                  <span className="font-semibold text-mocha-text block mb-0.5">👤 Store Seller Desk</span>
                  You are chatting directly with our electronics engineering fulfillment team. Response time is typically within 15 minutes during lab hours.
                </div>

                {sellerActiveConvo?.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      m.from === "buyer" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-mocha-text-muted px-1 mb-0.5">
                      {m.from === "buyer" ? (
                        <span className="font-semibold text-mocha-text">You</span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-emerald-400">
                          <span>👤</span>
                          <span>Store Staff</span>
                          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 border border-emerald-500/20">STAFF</span>
                        </span>
                      )}
                      <span className="text-mocha-text-subtle">•</span>
                      <span className="text-[10px] text-mocha-text-subtle font-mono">{m.time}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl shadow-sm ${
                        m.from === "buyer"
                          ? "bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg font-medium rounded-tr-sm"
                          : "bg-mocha-panel-raised border border-mocha-border text-mocha-text rounded-tl-sm"
                      }`}
                    >
                      {m.text && <ChatFormattedText content={m.text} isUser={m.from === "buyer"} />}
                    </div>
                  </div>
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-2.5 bg-mocha-panel-raised/90 border-t border-mocha-border flex flex-col gap-1.5 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  widgetState.activeMode === "bot"
                    ? "Ask OhmBot about circuits, pinouts, BOM..."
                    : "Message store seller / lab technician..."
                }
                className="flex-1 bg-mocha-bg border border-mocha-border rounded-xl px-3 py-2 text-xs text-mocha-text placeholder:text-mocha-text-muted/60 focus:outline-none focus:border-mocha-accent transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-8 h-8 rounded-xl bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105 active:scale-95 transition-all shrink-0"
                title="Send inquiry"
              >
                <svg className="w-4 h-4 translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>

            <div className="flex items-center justify-between text-[9px] text-mocha-text-subtle px-1">
              <span>{widgetState.activeMode === "bot" ? "⚡ Powered by OhmSim Engine" : "🏢 Staffed 8:00 AM – 8:00 PM PHT"}</span>
              <button
                type="button"
                onClick={() => chatWidgetStore.setMode(widgetState.activeMode === "bot" ? "seller" : "bot")}
                className="text-mocha-accent hover:underline"
              >
                Switch to {widgetState.activeMode === "bot" ? "Seller" : "OhmBot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
