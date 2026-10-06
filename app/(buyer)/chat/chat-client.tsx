"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import type { ChatConversation, ChatAttachment } from "@/types/chat";
import {
  getChatConversations,
  sendChatMessage,
  createChatConversation,
  validateChatAttachment,
  chatStore,
} from "@/services/chat-service";
import { getProductByIdSync } from "@/services/catalog-service";
import { getMockOrderById, ORDER_STATUS_META } from "@/services/order-service";
import { formatPrice } from "@/lib/format";

export function ChatClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderRef = searchParams.get("orderRef") ?? "";
  const requestedConvoId = searchParams.get("convo");

  const [convos, setConvos] = useState<ChatConversation[]>(() => getChatConversations());
  const activeConvoId = requestedConvoId ?? convos[0]?.id;
  const referencedOrder = initialOrderRef ? getMockOrderById(initialOrderRef) : undefined;
  const [inputText, setInputText] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileShowList, setMobileShowList] = useState(false);
  const [searchConvos, setSearchConvos] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [newConvoName, setNewConvoName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const draftUrl = useRef<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftContext = useRef("");

  // Subscribe to chat store changes
  useEffect(() => {
    return chatStore.subscribe(() => {
      setConvos(getChatConversations());
    });
  }, []);

  useEffect(() => () => {
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, []);

  const activeConvo = useMemo(() => {
    return convos.find((c) => c.id === activeConvoId);
  }, [convos, activeConvoId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "nearest",
    });
  }, [activeConvo?.messages.length, activeConvoId, isTyping]);

  // Query changes only prefill a draft. Navigation never submits buyer messages.
  const contextKey = `${activeConvoId ?? ""}:${initialOrderRef}`;
  useEffect(() => {
    if (draftContext.current === contextKey) return;
    draftContext.current = contextKey;
    setInputText(referencedOrder ? `Hello! I have a question regarding order #${referencedOrder.orderNumber}.` : "");
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    draftUrl.current = null;
    setPendingAttachment(null);
    setIsTyping(false);
    if (typingTimer.current) clearTimeout(typingTimer.current);
  }, [contextKey, referencedOrder]);

  const filteredConvos = useMemo(() => {
    const q = searchConvos.trim().toLowerCase();
    if (!q) return convos;
    return convos.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text?.toLowerCase().includes(q))
    );
  }, [convos, searchConvos]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateChatAttachment({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (!validation.valid) {
      setAttachmentError(validation.error ?? "Invalid file attachment");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    if (draftUrl.current) URL.revokeObjectURL(draftUrl.current);
    draftUrl.current = objectUrl;

    setPendingAttachment({
      name: file.name,
      url: objectUrl,
      type: file.type || "application/octet-stream",
      size: file.size,
    });

    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePendingAttachment = () => {
    if (pendingAttachment) {
      try {
        URL.revokeObjectURL(pendingAttachment.url);
        draftUrl.current = null;
      } catch {
        // ignore
      }
      setPendingAttachment(null);
    }
  };

  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text && !pendingAttachment) return;
    if (!activeConvo) return;

    sendChatMessage(activeConvo.id, {
      from: "buyer",
      text: text || undefined,
      attachment: pendingAttachment ?? undefined,
      orderNumber: referencedOrder?.orderNumber,
      orderStatus: referencedOrder?.status,
    });

    draftUrl.current = null; // Ownership transferred to the retained ChatStore.
    setInputText("");
    setPendingAttachment(null);

    // Show temporary typing indicator
    setIsTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateNewConvo = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newConvoName.trim();
    if (!name) return;

    const newConvo = createChatConversation(name, "Direct Inquiry");
    router.push(`/chat?convo=${encodeURIComponent(newConvo.id)}`);
    setIsComposing(false);
    setNewConvoName("");
    setMobileShowList(false);

  };

  return (
    <div className="flex-none flex flex-col h-[calc(100dvh-112px)] md:h-[calc(100dvh-64px)] min-h-[320px] overflow-hidden bg-mocha-bg">
      <div className="flex-1 min-h-0 flex overflow-hidden max-w-[1400px] w-full mx-auto border-x border-mocha-border">
        {/* Sidebar: Conversations List */}
        <aside
          className={`w-full md:w-80 lg:w-96 shrink-0 flex flex-col bg-mocha-panel border-r border-mocha-border overflow-hidden transition-all ${
            mobileShowList ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-mocha-border flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-base font-bold text-mocha-text tracking-tight flex items-center gap-2">
                Support Chat
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mocha-accent/15 text-mocha-accent">
                  Demo
                </span>
              </h1>
              <p className="text-[11px] text-mocha-text-muted mt-0.5">
                Hardware inquiries & order support
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsComposing(true)}
              aria-label="Start new conversation"
              className="p-2 rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-accent hover:border-mocha-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
              title="New Inquiry"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {/* New Conversation Inline Modal / Form */}
          {isComposing && (
            <form
              onSubmit={handleCreateNewConvo}
              className="p-3 bg-mocha-bg border-b border-mocha-border flex flex-col gap-2 shrink-0 animate-in fade-in duration-200"
            >
              <label htmlFor="new-convo-topic" className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted">
                New Inquiry Topic
              </label>
              <input
                id="new-convo-topic"
                type="text"
                value={newConvoName}
                onChange={(e) => setNewConvoName(e.target.value)}
                placeholder="e.g. Sensor pinout question..."
                className="min-h-[44px] w-full px-3 py-1.5 rounded-lg bg-mocha-panel border border-mocha-border text-xs text-mocha-text focus:outline-none focus:border-mocha-accent"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="min-h-[44px] min-w-[44px] px-2.5 py-1 rounded-lg text-xs font-semibold text-mocha-text-muted hover:text-mocha-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newConvoName.trim()}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold bg-mocha-accent text-mocha-bg disabled:opacity-50"
                >
                  Start
                </button>
              </div>
            </form>
          )}

          {/* Search Contacts */}
          <div className="p-3 border-b border-mocha-border shrink-0">
            <div className="relative">
              <label htmlFor="search-convos" className="sr-only">
                Search conversations
              </label>
              <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-mocha-text-muted">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search-convos"
                type="search"
                value={searchConvos}
                onChange={(e) => setSearchConvos(e.target.value)}
                placeholder="Search conversations..."
                className="min-h-[44px] w-full pl-8 pr-3 py-1.5 rounded-xl bg-mocha-bg border border-mocha-border text-xs text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-mocha-border/60">
            {filteredConvos.map((c) => {
              const isSelected = c.id === activeConvo?.id;
              const lastMsg = c.messages[c.messages.length - 1];

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    router.push(`/chat?convo=${encodeURIComponent(c.id)}`);
                    setMobileShowList(false);
                  }}
                  aria-pressed={isSelected}
                  data-conversation-id={c.id}
                  className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                    isSelected
                      ? "bg-mocha-panel-raised border-l-4 border-l-mocha-accent"
                      : "hover:bg-mocha-panel-high"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 relative text-mocha-bg font-mono"
                    style={{ background: c.color }}
                  >
                    {c.initials}
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-mocha-green border-2 border-mocha-panel" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-mocha-text truncate">
                        {c.name}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] font-mono text-mocha-text-muted shrink-0">
                          {lastMsg.time}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-mocha-text-muted truncate">
                      {lastMsg?.text ?? (lastMsg?.attachment ? "📎 Attached file" : c.subtitle)}
                    </p>
                  </div>
                </button>
              );
            })}

            {filteredConvos.length === 0 && (
              <div className="p-8 text-center text-xs text-mocha-text-muted">
                No matching conversations.
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <section
          className={`flex-1 min-w-0 min-h-0 flex flex-col bg-mocha-bg overflow-hidden ${
            mobileShowList ? "hidden md:flex" : "flex"
          }`}
        >
          {activeConvo ? (
            <>
              {/* Chat Thread Header */}
              <div className="px-3 py-3 bg-mocha-panel border-b border-mocha-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setMobileShowList(true)}
                    aria-label="Back to conversations list"
                    className="md:hidden w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl text-mocha-text hover:bg-mocha-panel-raised flex items-center justify-center font-bold text-base transition-colors"
                  >
                    ←
                  </button>

                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-mocha-bg font-mono"
                    style={{ background: activeConvo.color }}
                  >
                    {activeConvo.initials}
                  </div>

                  <div>
                    <h2 className="text-sm font-bold text-mocha-text leading-tight break-words flex items-center gap-2">
                      {activeConvo.name}
                      {activeConvo.online && (
                        <span className="w-2 h-2 rounded-full bg-mocha-green inline-block" aria-hidden="true" />
                      )}
                    </h2>
                    <p className="text-[10px] text-mocha-text-muted">
                      {activeConvo.subtitle} · Demo conversation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/orders"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-mocha-bg border border-mocha-border text-mocha-text hover:border-mocha-accent transition-colors"
                  >
                    Orders
                  </Link>
                </div>
              </div>

              {initialOrderRef && (
                <p role="status" className="px-4 py-2 text-xs text-mocha-text-muted">
                  {referencedOrder ? `Inquiry about ${referencedOrder.orderNumber}. Review your draft, then Send.` : "Order reference not found. Check the reference or send a general inquiry."}
                </p>
              )}
              {/* Messages Scroll Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
                {activeConvo.messages.map((msg) => {
                  const isBuyer = msg.from === "buyer";
                  const isSystem = msg.from === "system";

                  if (isSystem) {
                    // System Embedded Cards
                    if (msg.productId) {
                      const prod = getProductByIdSync(msg.productId);
                      if (!prod) return null;
                      return (
                        <div key={msg.id} className="mx-auto max-w-sm w-full p-3 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-mocha-border bg-mocha-bg shrink-0">
                            <Image src={prod.image} alt={prod.name} fill sizes="48px" className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mocha-accent">Referenced Component</span>
                            <p className="text-xs font-semibold text-mocha-text truncate">{prod.name}</p>
                            <p className="text-[11px] font-mono font-bold text-mocha-accent">{formatPrice(prod.price)}</p>
                          </div>
                          <Link href={`/products/${prod.id}`} className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold bg-mocha-panel-raised border border-mocha-border text-mocha-text hover:border-mocha-accent">
                            View
                          </Link>
                        </div>
                      );
                    }

                    if (msg.orderNumber) {
                      const statusMeta = msg.orderStatus
                        ? ORDER_STATUS_META[msg.orderStatus as keyof typeof ORDER_STATUS_META]
                        : null;
                      return (
                        <div key={msg.id} className="mx-auto max-w-sm w-full p-3 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mocha-text-muted">Referenced Order</span>
                            <p className="text-xs font-bold font-mono text-mocha-text">{msg.orderNumber}</p>
                            {statusMeta && (
                              <span
                                className="text-[9px] font-bold px-2 py-0.5 rounded-full border mt-1 inline-block"
                                style={{ background: statusMeta.bg, color: statusMeta.color, borderColor: statusMeta.border }}
                              >
                                {statusMeta.label}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/orders/${msg.orderNumber.toLowerCase()}`}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-95"
                          >
                            Track
                          </Link>
                        </div>
                      );
                    }
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBuyer ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                          isBuyer
                            ? "bg-mocha-accent text-mocha-bg font-medium rounded-tr-sm"
                            : "bg-mocha-panel border border-mocha-border text-mocha-text rounded-tl-sm"
                        }`}
                      >
                        {/* Text */}
                        {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}

                        {/* Attachment */}
                        {msg.attachment && (
                          <div className={msg.text ? "mt-2 pt-2 border-t border-mocha-bg/20" : ""}>
                            {msg.attachment.type.startsWith("image/") ? (
                              <div className="relative rounded-xl overflow-hidden border border-mocha-border/50 max-w-[240px]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={msg.attachment.url}
                                  alt={msg.attachment.name}
                                  className="w-full h-auto max-h-48 object-cover rounded-xl"
                                />
                                <a href={msg.attachment.url} download={msg.attachment.name} aria-label={`Download ${msg.attachment.name}`} className="min-h-[44px] min-w-[44px] flex items-center p-2 text-[10px] font-mono break-all">
                                  Download {msg.attachment.name}
                                </a>
                              </div>
                            ) : (
                              <a
                                href={msg.attachment.url}
                                aria-label={`Download ${msg.attachment.name}`}
                                download={msg.attachment.name}
                                className={`min-h-[44px] min-w-[44px] flex items-center gap-2 p-2 rounded-xl text-xs font-mono font-medium border ${
                                  isBuyer
                                    ? "bg-mocha-bg/20 border-mocha-bg/30 text-mocha-bg"
                                    : "bg-mocha-bg border-mocha-border text-mocha-accent"
                                }`}
                              >
                                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="truncate flex-1">{msg.attachment.name}</span>
                                <span className="text-[10px] opacity-75">↓</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <span className="text-[9px] font-mono text-mocha-text-subtle mt-1 px-1">
                        {msg.time}
                      </span>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 text-xs text-mocha-text-muted italic">
                    <span className="w-1.5 h-1.5 rounded-full bg-mocha-accent animate-pulse" />
                    <span>Preparing a simulated reply...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <p role="status" aria-live="polite" className="sr-only">{activeConvo.messages.length} messages in {activeConvo.name}.</p>
              {/* Composer */}
              <div className="p-3 md:p-4 bg-mocha-panel border-t border-mocha-border shrink-0 flex flex-col gap-2">
                <p role="alert" className="text-xs text-mocha-danger">{attachmentError}</p>
                {/* Pending Attachment Preview */}
                {pendingAttachment && (
                  <div
                    id="pending-attachment-pill"
                    className="p-2 rounded-xl bg-mocha-bg border border-mocha-border flex items-center justify-between gap-2 max-w-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0 text-xs">
                      <span className="text-mocha-accent">📎</span>
                      <span className="font-mono text-mocha-text truncate">{pendingAttachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePendingAttachment}
                      aria-label="Remove attachment"
                      className="min-h-[44px] min-w-[44px] shrink-0 text-mocha-text-muted hover:text-mocha-danger text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Input Controls */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,text/csv"
                    className="hidden"
                    id="chat-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach file or screenshot"
                    className="p-2.5 rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-text-muted hover:text-mocha-accent hover:border-mocha-accent transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
                    title="Attach file (PNG, JPG, PDF, CSV, TXT up to 5MB)"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>

                  <div className="relative flex-1 min-w-0">
                    <label htmlFor="chat-message-input" className="sr-only">
                      Type your message
                    </label>
                    <input
                      id="chat-message-input"
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask technical question or inquire about order..."
                      className="w-full px-4 py-2.5 rounded-xl bg-mocha-bg border border-mocha-border text-xs text-mocha-text placeholder-mocha-text-subtle focus:outline-none focus:border-mocha-accent min-h-[44px]"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() && !pendingAttachment}
                    aria-label="Send message"
                    className="px-4 py-2.5 rounded-xl bg-mocha-accent text-mocha-bg font-bold text-xs hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-mocha-accent shadow-sm"
                  >
                    <span>Send</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-mocha-text-muted">
              <p>Conversation not found. Select a conversation to start chatting.</p>
              <button type="button" onClick={() => setMobileShowList(true)} className="md:hidden min-h-[44px] min-w-[44px] mt-3 px-4 rounded-xl border border-mocha-border">Choose conversation</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
