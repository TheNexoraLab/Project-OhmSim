"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { INITIAL_CONVERSATIONS } from "@/lib/mocks/chat";
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mocks/products";
import type { ChatMessage } from "@/types/chat";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import {
  Search,
  Send,
  Package,
  Cpu,
  Zap,
} from "lucide-react";

interface AdminSupportThread {
  id: string;
  customerName: string;
  customerEmail: string;
  affiliation: string;
  initials: string;
  color: string;
  online: boolean;
  unreadCount: number;
  topic: string;
  orderNumber: string | null;
  orderStatus: string | null;
  referencedSku: string | null;
  province: string;
  messages: ChatMessage[];
}

const CANNED_RESPONSES = [
  {
    label: "Order is being packed",
    text: "Order is being packed at our Pampanga fulfillment hub and will be dispatched shortly.",
  },
  {
    label: "Available for pickup at Building 3",
    text: "Available for pickup at Building 3, Room 204 (Campus Electronics Lab Station). Please bring your student/faculty ID.",
  },
  {
    label: "Datasheet attached",
    text: "Datasheet attached — please verify the absolute maximum pin voltage ratings (3.3V vs 5V logic) before powering your breadboard.",
  },
] as const;

function buildInitialSupportThreads(): AdminSupportThread[] {
  const baseC1 = INITIAL_CONVERSATIONS[0];
  const baseC2 = INITIAL_CONVERSATIONS[1];
  const baseC3 = INITIAL_CONVERSATIONS[2];

  return [
    {
      id: "thread-alex-esp32",
      customerName: "Alex Rivera",
      customerEmail: "alex.rivera@ohmsim.ph",
      affiliation: "MakerSpace PH • San Fernando, Pampanga",
      initials: "AR",
      color: "#89B4FA",
      online: true,
      unreadCount: 0,
      topic: "ESP32-WROOM-32U 5V VIN Pin Regulation",
      orderNumber: "#OHM-2026-089",
      orderStatus: "PROCESSING",
      referencedSku: "ESP32-WROOM-32U",
      province: "Pampanga",
      messages: [
        ...(baseC1?.messages ?? []),
        {
          id: "m-alex-followup",
          from: "buyer",
          type: "text",
          text: "Awesome! Also, can you confirm if #OHM-2026-089 includes the micro-USB programming cable or just the 38-pin module?",
          time: "10:04 AM",
        },
      ],
    },
    {
      id: "thread-camille-pickup",
      customerName: "Engr. Camille Santos",
      customerEmail: "c.santos@hau-ece-lab.edu.ph",
      affiliation: "Holy Angel University ECE Lab • Angeles City",
      initials: "CS",
      color: "#94E2D5",
      online: true,
      unreadCount: 1,
      topic: "Campus Lab Pickup Schedule — Building 3",
      orderNumber: "#OHM-2026-055",
      orderStatus: "READY_FOR_PICKUP",
      referencedSku: "OLED-096-I2C-BLU",
      province: "Pampanga",
      messages: [
        {
          id: "m-cs-1",
          from: "buyer",
          type: "text",
          text: "Good morning! Our lab assistant will collect order #OHM-2026-055 this afternoon. Which room in Building 3 is the pickup counter?",
          time: "11:15 AM",
        },
        ...(baseC2?.messages.slice(0, 1) ?? []),
      ],
    },
    {
      id: "thread-miguel-bom",
      customerName: "Miguel Dela Cruz",
      customerEmail: "miguel.delacruz@bulsu-mechatronics.ph",
      affiliation: "BulSU Mechatronics Society • Malolos, Bulacan",
      initials: "MD",
      color: "#CBA6F7",
      online: false,
      unreadCount: 1,
      topic: "Capstone Bulk Reservation & L298N Datasheet",
      orderNumber: "#OHM-2026-084",
      orderStatus: "DELIVERED",
      referencedSku: "L298N-DUAL-HBRIDGE",
      province: "Bulacan",
      messages: [
        ...(baseC3?.messages ?? []),
        {
          id: "m-md-3",
          from: "buyer",
          type: "text",
          text: "Could you also send the official ST L298N dual H-bridge datasheet and current sensing jumper guide?",
          time: "2:20 PM",
        },
      ],
    },
    {
      id: "thread-jennifer-cod",
      customerName: "Jennifer Pangilinan",
      customerEmail: "jpangilinan@clsu-agritech.org",
      affiliation: "Nueva Ecija Smart Agri-Telemetry Lab",
      initials: "JP",
      color: "#F9E2AF",
      online: true,
      unreadCount: 0,
      topic: "Region III Courier Tracking (#OHM-2026-074)",
      orderNumber: "#OHM-2026-074",
      orderStatus: "SHIPPED",
      referencedSku: "DHT22-SENSOR-MOD",
      province: "Nueva Ecija",
      messages: [
        ...(baseC2?.messages ?? []),
        {
          id: "m-jp-3",
          from: "admin",
          type: "text",
          text: "Confirmed! Rider has your contact number and official receipt for ₱1,225.00 COD.",
          time: "1:52 PM",
        },
      ],
    },
  ];
}

export function ChatClient() {
  const [threads, setThreads] = useState<AdminSupportThread[]>(() =>
    buildInitialSupportThreads(),
  );
  const [activeThreadId, setActiveThreadId] = useState<string>(
    "thread-alex-esp32",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [composerText, setComposerText] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadConversations() {
      try {
        const res = await fetch("/api/conversations", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.conversations) && data.conversations.length > 0) {
            interface ApiConvoMessage {
              id: string;
              senderRole: "ADMIN" | "BUYER" | "SYSTEM";
              content: string;
              createdAt: string;
            }

            interface ApiConversationItem {
              id: string;
              title?: string;
              status?: string;
              unreadCount?: number;
              user?: {
                firstName?: string;
                lastName?: string;
                email?: string;
              };
              messages?: ApiConvoMessage[];
            }

            const liveThreads: AdminSupportThread[] = data.conversations.map(
              (c: ApiConversationItem) => {
                const customerName = c.user
                  ? `${c.user.firstName || ""} ${c.user.lastName || ""}`.trim()
                  : c.title || "Customer";

                const initials =
                  customerName
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase() || "Ω";

                const msgs: ChatMessage[] = (c.messages || []).map(
                  (m: ApiConvoMessage) => ({
                    id: m.id,
                    from:
                      m.senderRole === "ADMIN"
                        ? "admin"
                        : m.senderRole === "SYSTEM"
                        ? "system"
                        : "buyer",
                    type: "text",
                    text: m.content,
                    time: new Date(m.createdAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    }),
                  })
                );

                return {
                  id: c.id,
                  customerName,
                  customerEmail: c.user?.email || "customer@ohmsim.ph",
                  affiliation: "Central Luzon Engineering Lab",
                  initials,
                  color: "#89B4FA",
                  online: true,
                  unreadCount: c.unreadCount || 0,
                  topic: c.title || "Support Thread",
                  orderNumber: null,
                  orderStatus: null,
                  referencedSku: null,
                  province: "Pampanga",
                  messages: msgs,
                };
              }
            );

            if (isMounted) {
              setThreads((prev) => {
                const realIds = new Set(liveThreads.map((lt) => lt.id));
                const filteredFixtures = prev.filter((p) => !realIds.has(p.id));
                return [...liveThreads, ...filteredFixtures];
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not load admin chat conversations:", err);
      }
    }

    loadConversations();
    return () => {
      isMounted = false;
    };
  }, []);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) ?? threads[0],
    [threads, activeThreadId],
  );

  const totalUnread = useMemo(
    () => threads.reduce((sum, t) => sum + t.unreadCount, 0),
    [threads],
  );

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return threads.filter((t) => {
      if (filterUnreadOnly && t.unreadCount === 0) return false;
      if (!q) return true;
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.topic.toLowerCase().includes(q) ||
        (t.orderNumber ?? "").toLowerCase().includes(q) ||
        (t.referencedSku ?? "").toLowerCase().includes(q)
      );
    });
  }, [threads, searchQuery, filterUnreadOnly]);

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t)),
    );
  };

  const handleApplyCannedResponse = (value: string) => {
    if (!value) return;
    const match = CANNED_RESPONSES.find((c) => c.label === value);
    if (match) {
      setComposerText(match.text);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = composerText.trim();
    if (!trimmed || !activeThread) return;

    const nowLabel = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const newMsg: ChatMessage = {
      id: `admin-msg-${Date.now()}`,
      from: "admin",
      type: "text",
      text: trimmed,
      time: nowLabel,
    };

    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === activeThread.id
          ? {
              ...thread,
              unreadCount: 0,
              messages: [...thread.messages, newMsg],
            }
          : thread,
      ),
    );

    setComposerText("");
    toast(
      `Reply sent to ${activeThread.customerName}${
        activeThread.orderNumber ? ` (${activeThread.orderNumber})` : ""
      }.`,
      "success",
    );

    if (typeof window !== "undefined") {
      fetch(`/api/conversations/${encodeURIComponent(activeThread.id)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed }),
      }).catch((err) => {
        console.warn("Could not dispatch message to backend:", err);
      });
    }
  };

  const referencedProduct = useMemo(() => {
    if (!activeThread?.referencedSku) return null;
    return (
      MOCK_PRODUCTS.find((p) => p.sku === activeThread.referencedSku) ?? null
    );
  }, [activeThread]);

  return (
    <div
      data-testid="admin-chat-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Clean, Tranquil Page Header */}
      <div className="flex flex-col gap-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
              Support Chat
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#181825] border border-[#313244] text-[11px] font-mono text-[#BAC2DE]">
              {threads.length} conversations
            </span>
            {totalUnread > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#89B4FA]/15 border border-[#89B4FA]/30 text-[11px] font-mono font-semibold text-[#89B4FA]">
                {totalUnread} unread
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#6C7086]">
            Campus pickups, Region III courier tracking, and component engineering inquiries.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="inline-flex items-center p-1 rounded-xl bg-[#181825] border border-[#313244] text-xs">
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(false)}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              !filterUnreadOnly
                ? "bg-[#313244] text-[#CDD6F4] shadow-xs"
                : "text-[#6C7086] hover:text-[#CDD6F4]"
            }`}
          >
            All ({threads.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterUnreadOnly(true)}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterUnreadOnly
                ? "bg-[#313244] text-[#CDD6F4] shadow-xs"
                : "text-[#6C7086] hover:text-[#CDD6F4]"
            }`}
          >
            Unread only ({totalUnread})
          </button>
        </div>
      </div>

      {/* Two-Pane Helpdesk Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Pane: Active Threads (4 cols on lg) */}
        <Surface
          variant="panel"
          className="flex flex-col overflow-hidden border border-[#313244] bg-[#1E1E2E] rounded-2xl p-0 lg:col-span-4 shadow-sm"
        >
          {/* Search Header */}
          <div className="border-b border-[#313244] bg-[#181825] p-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6C7086]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buyer, order, or SKU..."
                aria-label="Search support threads"
                className="h-9 w-full rounded-xl border border-[#313244] bg-[#11111B] pl-8.5 pr-3 text-xs text-[#CDD6F4] placeholder-[#585B70] focus:border-[#89B4FA] focus:ring-1 focus:ring-[#89B4FA]/30 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="divide-y divide-[#313244]/40 overflow-y-auto max-h-[640px]">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-semibold text-[#A6ADC8]">
                  No conversations match your filter
                </p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isSelected = activeThread?.id === thread.id;
                const lastMessage =
                  thread.messages[thread.messages.length - 1];
                const previewText =
                  lastMessage?.text ||
                  (lastMessage?.type === "order"
                    ? `Order reference ${lastMessage.orderNumber}`
                    : "Attachment shared");

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => handleSelectThread(thread.id)}
                    className={`group flex w-full items-start gap-3 p-3.5 text-left transition-all ${
                      isSelected
                        ? "bg-[#89B4FA]/10 border-l-[3px] border-[#89B4FA]"
                        : "hover:bg-[#181825]/60 border-l-[3px] border-transparent"
                    }`}
                  >
                    {/* Soft Tone-on-Tone Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-xl font-mono text-xs font-bold transition-colors ${
                          isSelected
                            ? "bg-[#89B4FA]/20 text-[#89B4FA] border border-[#89B4FA]/40"
                            : "bg-[#181825] text-[#BAC2DE] border border-[#313244]"
                        }`}
                      >
                        {thread.initials}
                      </div>
                      {thread.online && (
                        <span
                          className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-[#A6E3A1] ring-2 ring-[#1E1E2E]"
                          title="Online"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Name & Time */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`truncate text-xs font-semibold ${
                            isSelected
                              ? "text-[#CDD6F4]"
                              : "text-[#BAC2DE] group-hover:text-[#CDD6F4]"
                          }`}
                        >
                          {thread.customerName}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[#6C7086]">
                          {lastMessage?.time ?? "Just now"}
                        </span>
                      </div>

                      {/* Topic (Muted, single line) */}
                      <p className="mt-0.5 truncate text-[11px] font-medium text-[#BAC2DE]">
                        {thread.topic}
                      </p>

                      {/* Preview Text */}
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-[#6C7086]">
                        {previewText}
                      </p>

                      {/* Compact Footer Tags: Order or SKU + Unread Badge */}
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {thread.orderNumber && (
                            <span className="rounded px-1.5 py-0.5 font-mono text-[9.5px] bg-[#181825] border border-[#313244] text-[#A6ADC8]">
                              {thread.orderNumber}
                            </span>
                          )}
                          {thread.referencedSku && (
                            <span className="rounded px-1.5 py-0.5 font-mono text-[9.5px] bg-[#181825] border border-[#313244] text-[#6C7086]">
                              {thread.referencedSku}
                            </span>
                          )}
                        </div>

                        {thread.unreadCount > 0 && (
                          <span className="inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#89B4FA] px-1.5 font-mono text-[9.5px] font-bold text-[#11111B] shadow-xs">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Surface>

        {/* Right Pane: Chat Workspace (8 cols on lg) */}
        <Surface
          variant="panel"
          className="flex min-h-[600px] flex-col overflow-hidden border border-[#313244] bg-[#1E1E2E] rounded-2xl p-0 lg:col-span-8 shadow-sm"
        >
          {activeThread ? (
            <>
              {/* Active Customer Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold bg-[#313244]/60 border border-[#45475A] text-[#CDD6F4]">
                    {activeThread.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#CDD6F4] truncate">
                        {activeThread.customerName}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#A6E3A1]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            activeThread.online ? "bg-[#A6E3A1]" : "bg-[#6C7086]"
                          }`}
                        />
                        {activeThread.online ? "Online" : "Offline"}
                      </span>
                    </div>
                    <p className="text-xs text-[#6C7086] truncate">
                      {activeThread.affiliation} •{" "}
                      <span className="font-mono text-[#A6ADC8]">
                        {activeThread.customerEmail}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Subtle Order # & Referenced SKU Links */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeThread.orderNumber && (
                    <Link
                      href="/admin/orders"
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#313244] bg-[#1E1E2E] hover:border-[#89B4FA]/60 hover:text-[#89B4FA] px-2.5 py-1 font-mono text-xs text-[#CDD6F4] transition-colors"
                    >
                      <Package size={13} className="text-[#89B4FA]" />
                      <span>{activeThread.orderNumber}</span>
                      {activeThread.orderStatus && (
                        <span className="text-[10px] text-[#A6ADC8]">
                          ({activeThread.orderStatus})
                        </span>
                      )}
                    </Link>
                  )}

                  {referencedProduct && (
                    <Link
                      href="/admin/products"
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#313244] bg-[#1E1E2E] hover:border-[#89B4FA]/60 hover:text-[#89B4FA] px-2.5 py-1 font-mono text-xs text-[#CDD6F4] transition-colors"
                    >
                      <Cpu size={13} className="text-[#94E2D5]" />
                      <span>{referencedProduct.sku}</span>
                      <span className="text-[10px] text-[#6C7086]">
                        ({formatPrice(referencedProduct.price)})
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Message History Feed */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#11111B]/40 p-5">
                {activeThread.messages.map((msg) => {
                  if (msg.from === "system") {
                    return (
                      <div
                        key={msg.id}
                        className="my-3 flex items-center justify-center gap-3"
                      >
                        <div className="h-px flex-1 bg-[#313244]/60" />
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#6C7086]">
                          {msg.type === "order" ? (
                            <>
                              <Package size={12} className="text-[#6C7086]" />
                              <span>
                                Linked Order: #{msg.orderNumber} ({msg.orderStatus})
                              </span>
                            </>
                          ) : (
                            <>
                              <Cpu size={12} className="text-[#6C7086]" />
                              <span>
                                Linked Component: {activeThread.referencedSku ?? "ESP32-WROOM-32U"}
                              </span>
                            </>
                          )}
                          <span className="text-[#45475A]">·</span>
                          <span className="text-[#585B70]">{msg.time}</span>
                        </span>
                        <div className="h-px flex-1 bg-[#313244]/60" />
                      </div>
                    );
                  }

                  const isAdmin = msg.from === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        isAdmin ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 px-1">
                        <span
                          className={`text-[11px] font-medium ${
                            isAdmin ? "text-[#89B4FA]/80" : "text-[#A6ADC8]"
                          }`}
                        >
                          {isAdmin
                            ? "OhmSim Support (You)"
                            : activeThread.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-[#585B70]">
                          {msg.time}
                        </span>
                      </div>

                      <div
                        className={`max-w-xl rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isAdmin
                            ? "rounded-tr-xs border border-[#89B4FA]/25 bg-[#89B4FA]/10 text-[#CDD6F4]"
                            : "rounded-tl-xs border border-[#313244] bg-[#181825] text-[#CDD6F4]"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Composer */}
              <form
                onSubmit={handleSendMessage}
                className="space-y-2.5 border-t border-[#313244] bg-[#181825] p-3.5"
              >
                {/* Clean Quick Responses Toolbar */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6C7086] shrink-0 mr-1">
                    <Zap size={12} className="text-[#89B4FA]" />
                    <span>Quick Reply:</span>
                  </span>
                  {CANNED_RESPONSES.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleApplyCannedResponse(preset.label)}
                      className="shrink-0 rounded-lg border border-[#313244] bg-[#1E1E2E] px-2.5 py-1 text-[11px] font-medium text-[#BAC2DE] transition-colors hover:border-[#89B4FA]/50 hover:bg-[#89B4FA]/10 hover:text-[#89B4FA]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Input Box & Send Button */}
                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`Reply to ${activeThread.customerName}...`}
                    aria-label="Message reply input"
                    className="h-10 flex-1 rounded-xl border border-[#313244] bg-[#11111B] px-4 text-xs sm:text-sm text-[#CDD6F4] placeholder-[#585B70] focus:border-[#89B4FA] focus:ring-1 focus:ring-[#89B4FA]/30 focus:outline-none transition-all"
                  />
                  <Button
                    type="submit"
                    variant="accent"
                    size="small"
                    disabled={!composerText.trim()}
                    className="h-10 px-4.5 font-semibold text-xs gap-1.5 shadow-sm shrink-0"
                  >
                    <span>Send Reply</span>
                    <Send size={13} />
                  </Button>
                </div>
              </form>
            </>
          ) : null}
        </Surface>
      </div>
    </div>
  );
}

