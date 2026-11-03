"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { INITIAL_CONVERSATIONS } from "@/lib/mocks/chat";
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mocks/products";
import type { ChatMessage } from "@/types/chat";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";

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
      unreadCount: 2,
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
  const [selectedCanned, setSelectedCanned] = useState("");

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
    setSelectedCanned(value);
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
    setSelectedCanned("");
    toast(
      `Reply sent to ${activeThread.customerName}${
        activeThread.orderNumber ? ` (${activeThread.orderNumber})` : ""
      }.`,
      "success",
    );
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
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#89B4FA]/30 bg-[#89B4FA]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#89B4FA] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#89B4FA]" />
              TECHNICAL &amp; FULFILLMENT HELPDESK
            </span>
            {totalUnread > 0 && (
              <Badge variant="warning" className="font-mono">
                {totalUnread} UNREAD
              </Badge>
            )}
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Support Chat Responder
          </h1>
          <p className="mt-0.5 text-xs text-[#BAC2DE] sm:text-sm">
            Respond to buyer pinout inquiries, Region III courier coordination,
            and Campus Lab Station pickup requests.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterUnreadOnly((prev) => !prev)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterUnreadOnly
                ? "border-[#89B4FA] bg-[#89B4FA]/14 text-[#89B4FA]"
                : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
            }`}
          >
            {filterUnreadOnly ? "Showing Unread Only" : "Filter Unread"}
          </button>
        </div>
      </div>

      {/* Two-Pane Helpdesk Layout */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Pane: Active Threads (4 cols on lg) */}
        <Surface
          variant="panel"
          className="flex flex-col overflow-hidden border border-[#313244] bg-[#1E1E2E] p-0 lg:col-span-4"
        >
          <div className="border-b border-[#313244] bg-[#181825] p-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-[#CDD6F4] uppercase">
                Active Conversations ({filteredThreads.length})
              </span>
              <span className="font-mono text-[11px] text-[#94E2D5]">
                SLA &lt; 15m
              </span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer, #OHM order, or SKU..."
              aria-label="Search support threads"
              className="h-9 w-full rounded-lg border border-[#313244] bg-[#11111B] px-3 text-xs text-[#CDD6F4] placeholder-[#A6ADC8] focus:border-[#89B4FA] focus:outline-none"
            />
          </div>

          <div className="divide-y divide-[#313244]/60 overflow-y-auto">
            {filteredThreads.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-semibold text-[#CDD6F4]">
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
                    className={`flex w-full items-start gap-3 p-4 text-left transition-colors ${
                      isSelected
                        ? "bg-[#89B4FA]/12"
                        : "hover:bg-[#181825]/80"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl font-mono text-xs font-bold text-[#11111B]"
                        style={{ backgroundColor: thread.color }}
                      >
                        {thread.initials}
                      </div>
                      <span
                        className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#1E1E2E] ${
                          thread.online ? "bg-[#A6E3A1]" : "bg-[#A6ADC8]"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-[#CDD6F4]">
                          {thread.customerName}
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[#A6ADC8]">
                          {lastMessage?.time ?? "Just now"}
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs font-medium text-[#89B4FA]">
                        {thread.topic}
                      </p>

                      <p className="mt-1 line-clamp-1 text-xs text-[#A6ADC8]">
                        {previewText}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          {thread.orderNumber && (
                            <span className="rounded border border-[#313244] bg-[#181825] px-1.5 py-0.5 font-mono text-[10px] text-[#BAC2DE]">
                              {thread.orderNumber}
                            </span>
                          )}
                          {thread.referencedSku && (
                            <span className="rounded border border-[#313244] bg-[#181825] px-1.5 py-0.5 font-mono text-[10px] text-[#94E2D5]">
                              {thread.referencedSku}
                            </span>
                          )}
                        </div>

                        {thread.unreadCount > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#89B4FA] px-1.5 font-mono text-[10px] font-bold text-[#11111B]">
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
          className="flex min-h-[600px] flex-col overflow-hidden border border-[#313244] bg-[#1E1E2E] p-0 lg:col-span-8"
        >
          {activeThread ? (
            <>
              {/* Active Customer Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#313244] bg-[#181825] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold text-[#11111B]"
                    style={{ backgroundColor: activeThread.color }}
                  >
                    {activeThread.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-[#CDD6F4]">
                        {activeThread.customerName}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          activeThread.online
                            ? "bg-[#A6E3A1]/12 text-[#A6E3A1]"
                            : "bg-[#313244]/70 text-[#A6ADC8]"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            activeThread.online
                              ? "bg-[#A6E3A1]"
                              : "bg-[#A6ADC8]"
                          }`}
                        />
                        {activeThread.online ? "ONLINE" : "OFFLINE"}
                      </span>
                    </div>
                    <p className="text-xs text-[#A6ADC8]">
                      {activeThread.affiliation} •{" "}
                      <span className="font-mono">
                        {activeThread.customerEmail}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Order # & Referenced SKU Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeThread.orderNumber && (
                    <Link
                      href="/admin/orders"
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#89B4FA]/40 bg-[#89B4FA]/12 px-2.5 py-1 font-mono text-xs font-semibold text-[#89B4FA] transition-colors hover:bg-[#89B4FA]/20"
                    >
                      <span>Order {activeThread.orderNumber}</span>
                      {activeThread.orderStatus && (
                        <span className="rounded bg-[#11111B]/60 px-1.5 py-0.2 text-[10px] text-[#CDD6F4]">
                          {activeThread.orderStatus}
                        </span>
                      )}
                    </Link>
                  )}

                  {referencedProduct && (
                    <Link
                      href="/admin/products"
                      prefetch={false}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#313244] bg-[#11111B] px-2.5 py-1 font-mono text-xs text-[#94E2D5] hover:border-[#94E2D5]/50"
                    >
                      <span>{referencedProduct.sku}</span>
                      <span className="text-[#A6ADC8]">
                        ({formatPrice(referencedProduct.price)})
                      </span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Message History Bubble Feed */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#11111B]/50 p-5">
                {activeThread.messages.map((msg) => {
                  if (msg.from === "system") {
                    return (
                      <div
                        key={msg.id}
                        className="mx-auto flex max-w-md items-center justify-between rounded-lg border border-[#313244] bg-[#181825] px-3.5 py-2 text-xs"
                      >
                        <span className="text-[#A6ADC8]">
                          {msg.type === "order"
                            ? `Linked Order Reference: #${msg.orderNumber} (${msg.orderStatus})`
                            : `Linked Component SKU: ${
                                activeThread.referencedSku ?? "ESP32-WROOM-32U"
                              }`}
                        </span>
                        <span className="font-mono text-[10px] text-[#89B4FA]">
                          {msg.time}
                        </span>
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
                        <span className="text-[11px] font-semibold text-[#BAC2DE]">
                          {isAdmin
                            ? "OhmSim Engineering Support (You)"
                            : activeThread.customerName}
                        </span>
                        <span className="font-mono text-[10px] text-[#A6ADC8]">
                          {msg.time}
                        </span>
                      </div>

                      <div
                        className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed sm:text-sm ${
                          isAdmin
                            ? "rounded-br-xs border border-[#89B4FA]/40 bg-[#89B4FA]/16 text-[#CDD6F4]"
                            : "rounded-bl-xs border border-[#313244] bg-[#181825] text-[#CDD6F4]"
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
                className="space-y-3 border-t border-[#313244] bg-[#181825] p-4"
              >
                {/* Canned Responses Bar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-[#A6ADC8]">
                      Quick Canned Responses:
                    </span>
                    {CANNED_RESPONSES.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleApplyCannedResponse(preset.label)}
                        className="rounded-md border border-[#313244] bg-[#1E1E2E] px-2.5 py-1 text-[11px] font-medium text-[#BAC2DE] transition-colors hover:border-[#89B4FA] hover:text-[#89B4FA]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <select
                    aria-label="Select canned response template"
                    value={selectedCanned}
                    onChange={(e) => handleApplyCannedResponse(e.target.value)}
                    className="h-8 rounded-lg border border-[#313244] bg-[#1E1E2E] px-2.5 text-xs text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
                  >
                    <option value="">Insert Canned Template...</option>
                    {CANNED_RESPONSES.map((preset) => (
                      <option key={preset.label} value={preset.label}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Box & Send Button */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`Reply to ${activeThread.customerName}...`}
                    aria-label="Message reply input"
                    className="h-10 flex-1 rounded-xl border border-[#313244] bg-[#11111B] px-4 text-sm text-[#CDD6F4] placeholder-[#A6ADC8] focus:border-[#89B4FA] focus:outline-none"
                  />
                  <Button
                    type="submit"
                    variant="accent"
                    size="small"
                    disabled={!composerText.trim()}
                    className="h-10 px-5 font-semibold"
                  >
                    Send Reply
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

