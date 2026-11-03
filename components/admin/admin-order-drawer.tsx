"use client";

import React, { useEffect, useState } from "react";
import type {
  MockOrder as Order,
  OrderStatus,
  FulfillmentType,
  PaymentMethod,
  OrderItem,
} from "@/types/order";
import { formatPrice, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export type AdminPipelineStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface StructuredDeliveryAddress {
  streetAddress: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  postalCode: string;
}

export interface EnrichedOrderItem extends OrderItem {
  bomProjectName?: string;
}

export interface EnrichedAdminOrder extends Omit<Order, "items"> {
  customerEmail: string;
  pickupStation: string;
  structuredAddress?: StructuredDeliveryAddress;
  cancellationReason?: string | null;
  updatedAt?: string;
  items: EnrichedOrderItem[];
}

export interface SemanticStatusToken {
  key: AdminPipelineStatus;
  tabLabel: string;
  badgeLabel: string;
  text: string;
  bg: string;
  border: string;
  description: string;
}

export const ADMIN_ORDER_STATUS_TOKENS: Record<
  AdminPipelineStatus,
  SemanticStatusToken
> = {
  PENDING: {
    key: "PENDING",
    tabLabel: "PENDING",
    badgeLabel: "PENDING",
    text: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.12)",
    border: "rgba(249, 226, 175, 0.32)",
    description: "Awaiting administrator order confirmation & stock lock",
  },
  PROCESSING: {
    key: "PROCESSING",
    tabLabel: "PROCESSING",
    badgeLabel: "PROCESSING",
    text: "#89B4FA",
    bg: "rgba(137, 180, 250, 0.12)",
    border: "rgba(137, 180, 250, 0.32)",
    description: "Components allocated; picking & antistatic ESD packing in progress",
  },
  SHIPPED: {
    key: "SHIPPED",
    tabLabel: "SHIPPED",
    badgeLabel: "SHIPPED",
    text: "#CBA6F7",
    bg: "rgba(203, 166, 247, 0.12)",
    border: "rgba(203, 166, 247, 0.32)",
    description: "Dispatched via Region III courier or staged at Campus Pickup Station",
  },
  DELIVERED: {
    key: "DELIVERED",
    tabLabel: "DELIVERED",
    badgeLabel: "DELIVERED",
    text: "#A6E3A1",
    bg: "rgba(166, 227, 161, 0.12)",
    border: "rgba(166, 227, 161, 0.32)",
    description: "Order fulfilled, payment collected, and transaction finalized",
  },
  CANCELLED: {
    key: "CANCELLED",
    tabLabel: "CANCELLED",
    badgeLabel: "CANCELLED",
    text: "#F38BA8",
    bg: "rgba(243, 139, 168, 0.12)",
    border: "rgba(243, 139, 168, 0.32)",
    description: "Order cancelled and reserved stock released back to inventory",
  },
};

export function resolveAdminOrderStatus(
  status: OrderStatus,
  fulfillmentType?: FulfillmentType
): {
  pipelineKey: AdminPipelineStatus;
  badgeText: string;
  subLabel: string;
  text: string;
  bg: string;
  border: string;
  description: string;
} {
  switch (status) {
    case "PENDING":
      return {
        pipelineKey: "PENDING",
        badgeText: "PENDING",
        subLabel: "Awaiting Confirmation",
        ...ADMIN_ORDER_STATUS_TOKENS.PENDING,
      };
    case "CONFIRMED":
    case "PREPARING":
      return {
        pipelineKey: "PROCESSING",
        badgeText: "PROCESSING",
        subLabel:
          status === "CONFIRMED"
            ? "Confirmed · Queued for Packing"
            : "Preparing Components",
        ...ADMIN_ORDER_STATUS_TOKENS.PROCESSING,
      };
    case "READY_FOR_PICKUP":
      return {
        pipelineKey: "SHIPPED",
        badgeText: "READY_FOR_PICKUP",
        subLabel: "Ready at Lab Station (Bldg 3, Rm 204)",
        ...ADMIN_ORDER_STATUS_TOKENS.SHIPPED,
      };
    case "OUT_FOR_DELIVERY":
      return {
        pipelineKey: "SHIPPED",
        badgeText: "SHIPPED",
        subLabel:
          fulfillmentType === "PICKUP"
            ? "Ready for Pickup"
            : "Out for Delivery (Region III)",
        ...ADMIN_ORDER_STATUS_TOKENS.SHIPPED,
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        pipelineKey: "DELIVERED",
        badgeText: "DELIVERED",
        subLabel:
          fulfillmentType === "PICKUP"
            ? "Picked Up & Paid"
            : "Delivered & COD Collected",
        ...ADMIN_ORDER_STATUS_TOKENS.DELIVERED,
      };
    case "CANCELLED":
    default:
      return {
        pipelineKey: "CANCELLED",
        badgeText: "CANCELLED",
        subLabel: "Cancelled",
        ...ADMIN_ORDER_STATUS_TOKENS.CANCELLED,
      };
  }
}

export function formatPaymentMethodLabel(method: PaymentMethod): string {
  return method === "COD" ? "COD" : "Pay on Pickup";
}

export interface AdminOrderDrawerProps {
  order: EnrichedAdminOrder | null;
  onClose: () => void;
  onConfirmToProcessing: (orderId: string) => void;
  onDispatchDelivery: (orderId: string, trackingNo: string) => void;
  onMarkReadyForPickup: (orderId: string) => void;
  onMarkDelivered: (orderId: string) => void;
  onCancelOrder: (orderId: string, reason: string) => void;
}

const CANCELLATION_PRESETS = [
  "Customer requested cancellation before dispatch",
  "Unreachable contact number for Region III COD verification",
  "Component batch failed pre-shipment ESD inspection",
];

export function AdminOrderDrawer(props: AdminOrderDrawerProps) {
  const { order, onClose } = props;

  useEffect(() => {
    if (!order) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [order, onClose]);

  if (!order) return null;

  return (
    <AdminOrderDrawerContent
      key={`${order.id}-${order.status}`}
      order={order}
      onClose={props.onClose}
      onConfirmToProcessing={props.onConfirmToProcessing}
      onDispatchDelivery={props.onDispatchDelivery}
      onMarkReadyForPickup={props.onMarkReadyForPickup}
      onMarkDelivered={props.onMarkDelivered}
      onCancelOrder={props.onCancelOrder}
    />
  );
}

function AdminOrderDrawerContent({
  order,
  onClose,
  onConfirmToProcessing,
  onDispatchDelivery,
  onMarkReadyForPickup,
  onMarkDelivered,
  onCancelOrder,
}: Omit<AdminOrderDrawerProps, "order"> & { order: EnrichedAdminOrder }) {
  const [trackingInput, setTrackingInput] = useState(
    () =>
      order.trackingNo ||
      `PH-TRK-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${order.orderNumber.slice(-3)}9`
  );
  const [trackingError, setTrackingError] = useState("");
  const [isCancelPromptOpen, setIsCancelPromptOpen] = useState(false);
  const [cancelReasonInput, setCancelReasonInput] = useState("");
  const [cancelError, setCancelError] = useState("");

  const statusMeta = resolveAdminOrderStatus(
    order.status,
    order.fulfillmentType
  );
  const isActiveOrder =
    statusMeta.pipelineKey === "PENDING" ||
    statusMeta.pipelineKey === "PROCESSING" ||
    statusMeta.pipelineKey === "SHIPPED";

  const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0);

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = trackingInput.trim();
    if (!cleaned) {
      setTrackingError(
        "Please enter a courier tracking number before dispatching."
      );
      return;
    }
    setTrackingError("");
    onDispatchDelivery(order.id, cleaned);
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = cancelReasonInput.trim();
    if (!cleaned) {
      setCancelError("Please provide a cancellation reason for audit logging.");
      return;
    }
    setCancelError("");
    onCancelOrder(order.id, cleaned);
    setIsCancelPromptOpen(false);
  };

  const pipelineSteps: { key: AdminPipelineStatus; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "PROCESSING", label: "Processing" },
    {
      key: "SHIPPED",
      label:
        order.fulfillmentType === "PICKUP" ? "Ready for Pickup" : "Shipped",
    },
    { key: "DELIVERED", label: "Delivered" },
  ];

  const activeStepIdx = pipelineSteps.findIndex(
    (s) => s.key === statusMeta.pipelineKey
  );

  return (
    <div
      data-testid="admin-order-drawer-overlay"
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-order-drawer-title"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer Content Panel */}
      <div
        data-testid="admin-order-drawer"
        className="relative z-10 w-full max-w-2xl h-full bg-[#181825] border-l border-[#313244] shadow-[0_0_50px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden text-[#CDD6F4]"
      >
        {/* 1. Drawer Header: Order Number, Date, and Current Status Badge */}
        <div className="px-6 py-5 bg-[#1E1E2E] border-b border-[#313244] flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#89B4FA] font-bold">
                ORDER INSPECTION &amp; DISPATCH
              </span>
              <span className="text-[#45475A]">•</span>
              <span className="text-xs font-mono text-[#BAC2DE]">
                Placed {formatDate(order.createdAt)}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-3">
              <h2
                id="admin-order-drawer-title"
                data-testid="drawer-order-number"
                className="text-xl sm:text-2xl font-bold font-mono text-[#CDD6F4] tracking-tight"
              >
                #{order.orderNumber}
              </h2>

              <span
                data-testid="drawer-status-badge"
                data-status={statusMeta.pipelineKey}
                style={{
                  backgroundColor: statusMeta.bg,
                  color: statusMeta.text,
                  borderColor: statusMeta.border,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase border tracking-wide"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusMeta.text }}
                />
                <span>{statusMeta.badgeText}</span>
              </span>
            </div>

            <p className="mt-1 text-xs text-[#A6ADC8]">
              {statusMeta.subLabel} — {statusMeta.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close order management drawer"
            data-testid="close-order-drawer-btn"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-[#181825] border border-[#313244] text-[#BAC2DE] hover:text-[#CDD6F4] hover:border-[#89B4FA] transition-colors shrink-0 cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Lifecycle Progress Bar */}
        <div className="px-6 py-3 bg-[#11111B] border-b border-[#313244] shrink-0">
          {statusMeta.pipelineKey === "CANCELLED" ? (
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-[#F38BA8]">
              <span className="inline-flex items-center gap-2 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#F38BA8]" />
                ORDER LIFECYCLE TERMINATED (CANCELLED)
              </span>
              {order.cancellationReason && (
                <span className="text-[#BAC2DE] truncate">
                  Reason: {order.cancellationReason}
                </span>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {pipelineSteps.map((step, idx) => {
                const isCompleted = activeStepIdx >= idx;
                const isCurrent = activeStepIdx === idx;
                const token = ADMIN_ORDER_STATUS_TOKENS[step.key];
                return (
                  <div key={step.key} className="flex flex-col gap-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        backgroundColor: isCompleted ? token.text : "#313244",
                      }}
                    />
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-mono font-bold uppercase truncate ${
                          isCurrent
                            ? "text-[#CDD6F4]"
                            : isCompleted
                            ? "text-[#BAC2DE]"
                            : "text-[#A6ADC8]/60"
                        }`}
                      >
                        {idx + 1}. {step.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 5. Administrative Status Progression Actions (Core Functionality) */}
          <Surface
            variant="panel"
            data-testid="drawer-status-actions-panel"
            className="p-5 bg-[#1E1E2E] border border-[#45475A] flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#89B4FA]">
                  Administrative Status Progression
                </h3>
                <p className="text-xs text-[#BAC2DE] mt-0.5">
                  Advance order #{order.orderNumber} through the Version 1.0
                  fulfillment pipeline.
                </p>
              </div>
              <Badge
                variant={
                  order.fulfillmentType === "PICKUP" ? "secondary" : "primary"
                }
                className="font-mono"
              >
                {order.fulfillmentType === "PICKUP"
                  ? "PICKUP WORKFLOW"
                  : "DELIVERY WORKFLOW"}
              </Badge>
            </div>

            {/* Stage 1: If PENDING -> "Confirm & Move to Processing" */}
            {statusMeta.pipelineKey === "PENDING" && (
              <div className="p-4 rounded-xl bg-[#181825] border border-[#F9E2AF]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#F9E2AF]">
                    Order Awaiting Confirmation
                  </p>
                  <p className="text-xs text-[#BAC2DE] mt-0.5">
                    Verify component bin availability and lock stock for
                    preparation.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="accent"
                  size="small"
                  data-testid="action-confirm-processing"
                  onClick={() => onConfirmToProcessing(order.id)}
                  className="text-xs font-bold shrink-0"
                >
                  Confirm &amp; Move to Processing
                </Button>
              </div>
            )}

            {/* Stage 2A: If PROCESSING & Delivery -> Tracking Number Input + "Dispatch / Mark as Shipped" */}
            {statusMeta.pipelineKey === "PROCESSING" &&
              order.fulfillmentType === "DELIVERY" && (
                <form
                  onSubmit={handleDispatchSubmit}
                  className="p-4 rounded-xl bg-[#181825] border border-[#89B4FA]/30 flex flex-col gap-3"
                >
                  <div>
                    <label
                      htmlFor="tracking-number-input"
                      className="block text-xs font-bold text-[#CDD6F4]"
                    >
                      Region III Courier Tracking Number{" "}
                      <span className="text-[#F38BA8]">*</span>
                    </label>
                    <p className="text-[11px] text-[#A6ADC8] mt-0.5">
                      Assign a Central Luzon dispatch tracking ID before
                      marking parcel as shipped.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                    <input
                      id="tracking-number-input"
                      data-testid="input-tracking-number"
                      type="text"
                      value={trackingInput}
                      onChange={(e) => {
                        setTrackingInput(e.target.value);
                        if (trackingError) setTrackingError("");
                      }}
                      placeholder="e.g. PH-TRK-20260828-8812"
                      className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#11111B] border border-[#45475A] text-xs font-mono text-[#CDD6F4] placeholder:text-[#A6ADC8]/60 focus:border-[#89B4FA] focus:outline-none"
                    />
                    <Button
                      type="submit"
                      variant="accent"
                      size="small"
                      data-testid="action-dispatch-shipped"
                      className="text-xs font-bold shrink-0"
                    >
                      Dispatch / Mark as Shipped
                    </Button>
                  </div>

                  {trackingError && (
                    <p
                      role="alert"
                      className="text-xs font-mono text-[#F38BA8]"
                    >
                      {trackingError}
                    </p>
                  )}
                </form>
              )}

            {/* Stage 2B: If PROCESSING & Pickup -> "Mark Ready for Pickup" */}
            {statusMeta.pipelineKey === "PROCESSING" &&
              order.fulfillmentType === "PICKUP" && (
                <div className="p-4 rounded-xl bg-[#181825] border border-[#89B4FA]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[#89B4FA]">
                      Lab Pickup Kit Preparation
                    </p>
                    <p className="text-xs text-[#BAC2DE] mt-0.5">
                      Stage packed components at Building 3, Room 204 pickup
                      counter and notify buyer.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="accent"
                    size="small"
                    data-testid="action-mark-ready-pickup"
                    onClick={() => onMarkReadyForPickup(order.id)}
                    className="text-xs font-bold shrink-0"
                  >
                    Mark Ready for Pickup
                  </Button>
                </div>
              )}

            {/* Stage 3: If SHIPPED or READY_FOR_PICKUP -> "Complete / Mark as Delivered" */}
            {statusMeta.pipelineKey === "SHIPPED" && (
              <div className="p-4 rounded-xl bg-[#181825] border border-[#CBA6F7]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#CBA6F7]">
                    {order.fulfillmentType === "PICKUP"
                      ? "Awaiting Student / Buyer Collection"
                      : "In Transit with Region III Courier"}
                  </p>
                  <p className="text-xs text-[#BAC2DE] mt-0.5">
                    {order.fulfillmentType === "PICKUP"
                      ? `Confirm in-person payment (${formatPrice(
                          order.totalAmount
                        )}) and handoff at Building 3, Room 204.`
                      : `Confirm COD collection (${formatPrice(
                          order.totalAmount
                        )}) and parcel handoff.`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="accent"
                  size="small"
                  data-testid="action-mark-delivered"
                  onClick={() => onMarkDelivered(order.id)}
                  className="text-xs font-bold shrink-0"
                >
                  Complete / Mark as Delivered
                </Button>
              </div>
            )}

            {/* Terminal States Info */}
            {statusMeta.pipelineKey === "DELIVERED" && (
              <div className="p-3.5 rounded-xl bg-[#A6E3A1]/10 border border-[#A6E3A1]/30 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#A6E3A1]">
                  ✓ This order has been fulfilled and marked as DELIVERED.
                </span>
                <span className="text-[11px] font-mono text-[#BAC2DE]">
                  Read-only completed record
                </span>
              </div>
            )}

            {statusMeta.pipelineKey === "CANCELLED" && (
              <div className="p-3.5 rounded-xl bg-[#F38BA8]/10 border border-[#F38BA8]/30 flex flex-col gap-1">
                <span className="text-xs font-semibold text-[#F38BA8]">
                  ✕ Order Cancelled
                </span>
                <span className="text-xs text-[#BAC2DE]">
                  Reason:{" "}
                  {order.cancellationReason ||
                    order.notes ||
                    "Cancelled per administrative action"}
                </span>
              </div>
            )}

            {/* Cancel Order Action for any Active Order */}
            {isActiveOrder && (
              <div className="pt-2 border-t border-[#313244] flex flex-col gap-3">
                {!isCancelPromptOpen ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#A6ADC8]">
                      Need to halt fulfillment or release reserved stock?
                    </span>
                    <button
                      type="button"
                      data-testid="action-open-cancel-prompt"
                      onClick={() => setIsCancelPromptOpen(true)}
                      className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#F38BA8]/12 text-[#F38BA8] border border-[#F38BA8]/30 hover:bg-[#F38BA8]/20 transition-colors cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleConfirmCancel}
                    data-testid="cancel-order-form"
                    className="p-4 rounded-xl bg-[#11111B] border border-[#F38BA8]/40 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="cancel-reason-input"
                        className="text-xs font-bold text-[#F38BA8]"
                      >
                        Cancellation Reason (Required)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCancelPromptOpen(false);
                          setCancelError("");
                        }}
                        className="text-xs font-mono text-[#A6ADC8] hover:text-[#CDD6F4]"
                      >
                        Dismiss
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {CANCELLATION_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setCancelReasonInput(preset);
                            setCancelError("");
                          }}
                          className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1E1E2E] border border-[#313244] text-[#BAC2DE] hover:border-[#F38BA8]/50 hover:text-[#CDD6F4] transition-colors text-left cursor-pointer"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <input
                      id="cancel-reason-input"
                      data-testid="input-cancel-reason"
                      type="text"
                      value={cancelReasonInput}
                      onChange={(e) => {
                        setCancelReasonInput(e.target.value);
                        if (cancelError) setCancelError("");
                      }}
                      placeholder="Enter reason for cancelling this order..."
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#45475A] text-xs text-[#CDD6F4] placeholder:text-[#A6ADC8]/60 focus:border-[#F38BA8] focus:outline-none"
                    />

                    {cancelError && (
                      <p
                        role="alert"
                        className="text-xs font-mono text-[#F38BA8]"
                      >
                        {cancelError}
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="surface"
                        size="compact"
                        onClick={() => setIsCancelPromptOpen(false)}
                      >
                        Keep Active
                      </Button>
                      <button
                        type="submit"
                        data-testid="action-confirm-cancel-order"
                        className="min-h-[40px] px-4 py-1.5 rounded-xl text-xs font-bold bg-[#F38BA8] text-[#11111B] hover:brightness-110 transition-all cursor-pointer"
                      >
                        Confirm Cancel Order
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Surface>

          {/* 2. Customer & Logistics Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details Card */}
            <Surface
              variant="panel"
              data-testid="drawer-customer-info"
              className="p-4 bg-[#1E1E2E] border border-[#313244] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A6ADC8]">
                  Customer Information
                </h3>
                <Badge variant="neutral" className="font-mono text-[10px]">
                  VERIFIED BUYER
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[11px] text-[#A6ADC8] block">
                    Recipient Full Name
                  </span>
                  <span className="font-bold text-sm text-[#CDD6F4]">
                    {order.recipientName}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#A6ADC8] block">
                    Contact Phone Number
                  </span>
                  <span className="font-mono text-[#BAC2DE]">
                    {order.contactNumber}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#A6ADC8] block">
                    Email Address
                  </span>
                  <span className="font-mono text-[#89B4FA]">
                    {order.customerEmail}
                  </span>
                </div>
              </div>
            </Surface>

            {/* Logistics & Fulfillment Destination Card */}
            <Surface
              variant="panel"
              data-testid="drawer-logistics-info"
              className="p-4 bg-[#1E1E2E] border border-[#313244] flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#A6ADC8]">
                  Logistics &amp; Fulfillment
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    order.fulfillmentType === "PICKUP"
                      ? "bg-[#94E2D5]/12 text-[#94E2D5] border-[#94E2D5]/30"
                      : "bg-[#74C7EC]/12 text-[#74C7EC] border-[#74C7EC]/30"
                  }`}
                >
                  {order.fulfillmentType === "PICKUP"
                    ? "Store / Lab Pickup"
                    : "Region III Delivery"}
                </span>
              </div>

              {order.fulfillmentType === "DELIVERY" ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#A6ADC8] block">
                      Delivery Address (Central Luzon)
                    </span>
                    <p className="font-semibold text-[#CDD6F4] leading-relaxed mt-0.5">
                      {order.deliveryAddress}
                    </p>
                  </div>

                  {order.structuredAddress && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono text-[#BAC2DE]">
                      <div className="p-2 rounded-lg bg-[#181825] border border-[#313244]">
                        <span className="text-[10px] text-[#A6ADC8] block">
                          STREET / BRGY
                        </span>
                        <span className="truncate block">
                          {order.structuredAddress.streetAddress},{" "}
                          {order.structuredAddress.barangay}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#181825] border border-[#313244]">
                        <span className="text-[10px] text-[#A6ADC8] block">
                          CITY / PROVINCE / ZIP
                        </span>
                        <span className="truncate block">
                          {order.structuredAddress.cityMunicipality},{" "}
                          {order.structuredAddress.province}{" "}
                          {order.structuredAddress.postalCode}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#A6ADC8]">
                      Payment Method:
                    </span>
                    <span className="font-mono font-bold text-[#CDD6F4]">
                      {formatPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>

                  {order.trackingNo && (
                    <div className="p-2.5 rounded-lg bg-[#181825] border border-[#CBA6F7]/30 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#A6ADC8]">
                        Tracking No:
                      </span>
                      <span
                        data-testid="drawer-tracking-number"
                        className="text-xs font-mono font-bold text-[#CBA6F7]"
                      >
                        {order.trackingNo}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[11px] text-[#A6ADC8] block">
                      Designated Campus Pickup Station
                    </span>
                    <p
                      data-testid="drawer-pickup-station"
                      className="font-semibold text-[#94E2D5] leading-relaxed mt-0.5"
                    >
                      {order.pickupStation}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#181825] border border-[#313244] text-[11px] font-mono text-[#BAC2DE]">
                    Station Location: Building 3, Room 204 · Campus Electronics
                    Lab Counter
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#A6ADC8]">
                      Payment Method:
                    </span>
                    <span className="font-mono font-bold text-[#CDD6F4]">
                      {formatPaymentMethodLabel(order.paymentMethod)} (₱0.00
                      Pickup Fee)
                    </span>
                  </div>
                </div>
              )}

              {order.notes && (
                <div className="pt-2 border-t border-[#313244] text-xs">
                  <span className="text-[10px] font-mono uppercase text-[#A6ADC8] block">
                    Customer / Dispatch Notes
                  </span>
                  <p className="text-[#BAC2DE] italic mt-0.5">
                    &ldquo;{order.notes}&rdquo;
                  </p>
                </div>
              )}
            </Surface>
          </div>

          {/* 3. Purchased Items Breakdown */}
          <Surface
            variant="panel"
            data-testid="drawer-items-breakdown"
            className="bg-[#1E1E2E] border border-[#313244] overflow-hidden"
          >
            <div className="px-5 py-3.5 border-b border-[#313244] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#CDD6F4]">
                  Purchased Items Breakdown
                </h3>
                <Badge variant="neutral" className="font-mono">
                  {order.items.length}{" "}
                  {order.items.length === 1 ? "SKU" : "SKUs"} · {totalUnits}{" "}
                  {totalUnits === 1 ? "unit" : "units"}
                </Badge>
              </div>
            </div>

            <div className="divide-y divide-[#313244]">
              {order.items.map((item, idx) => {
                const lineTotal = item.price * item.qty;
                const bomProject = item.bundleName || item.bomProjectName;

                return (
                  <div
                    key={`${item.productId}-${idx}`}
                    data-testid={`drawer-item-${item.productSku}`}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#181825]/60 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#89B4FA]">
                          {item.productSku}
                        </span>
                        {bomProject && (
                          <span
                            data-testid={`bom-badge-${item.productSku}`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-[#94E2D5]/12 text-[#94E2D5] border border-[#94E2D5]/30"
                          >
                            <span>BOM:</span>
                            <span>{bomProject}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#CDD6F4] mt-0.5">
                        {item.productName}
                      </p>
                      <p className="text-xs font-mono text-[#A6ADC8] mt-0.5">
                        Unit Price: {formatPrice(item.price)} × Qty: {item.qty}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[10px] font-mono uppercase text-[#A6ADC8] block">
                        Line Total
                      </span>
                      <span className="text-sm font-mono font-bold text-[#CDD6F4]">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. Financial Breakdown */}
            <div
              data-testid="drawer-financial-breakdown"
              className="p-5 bg-[#181825] border-t border-[#313244] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between text-[#BAC2DE]">
                <span>Merchandise Subtotal</span>
                <span className="font-mono font-semibold">
                  {formatPrice(order.subtotalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[#BAC2DE]">
                <span>
                  Shipping / Fulfillment Fee (
                  {order.fulfillmentType === "PICKUP"
                    ? "Store Pickup — Always Free"
                    : order.deliveryFee === 0
                    ? "Region III Free Delivery ≥ ₱1,000"
                    : "Region III Standard Flat Rate"}
                  )
                </span>
                <span className="font-mono font-semibold text-[#94E2D5]">
                  {formatPrice(order.deliveryFee)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-[#313244] flex items-center justify-between text-sm font-bold text-[#CDD6F4]">
                <span>Grand Total ({formatPaymentMethodLabel(order.paymentMethod)})</span>
                <span
                  data-testid="drawer-grand-total"
                  className="text-base font-mono text-[#89B4FA]"
                >
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
