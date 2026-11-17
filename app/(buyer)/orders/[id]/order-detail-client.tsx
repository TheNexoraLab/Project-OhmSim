"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MockOrder } from "@/types/order";
import {
  getOrderById,
  getMockOrderById,
  updateOrderStatus,
  ORDER_STATUS_META,
  getTimelineStepsForOrder,
} from "@/services/order-service";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { chatWidgetStore } from "@/lib/chat/chat-widget-store";
import {
  AlertCircle,
  MessageSquare,
  Printer,
  Copy,
} from "lucide-react";

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const [order, setOrder] = useState<MockOrder | null>(() => getMockOrderById(orderId) ?? null);
  const [isLoading, setIsLoading] = useState(!order);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOrder = () => {
      getOrderById(orderId)
        .then((liveOrder) => {
          if (isMounted && liveOrder) {
            setOrder((prev) => {
              if (prev && prev.status !== liveOrder.status) {
                const label = ORDER_STATUS_META[liveOrder.status]?.label || liveOrder.status;
                toast(`📦 Order #${liveOrder.orderNumber} status updated to: ${label}`, "info");
              }
              return liveOrder;
            });
            setIsLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    fetchOrder();

    // Live sync polling every 8 seconds
    const interval = setInterval(fetchOrder, 8000);
    window.addEventListener("focus", fetchOrder);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", fetchOrder);
    };
  }, [orderId]);

  const timeline = useMemo(() => (order ? getTimelineStepsForOrder(order) : null), [order]);

  const handleCopyTracking = async (trackingNo: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(trackingNo);
      toast(`Tracking number ${trackingNo} copied to clipboard`, "success");
    } catch {
      toast(`Unable to copy. Tracking: ${trackingNo}`, "info");
    }
  };

  const handleCancelOrder = async () => {
    if (!order || isCancelling) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Are you sure you want to cancel this order? Stock will be restored and preparation halted.");
      if (!confirmed) return;
    }
    setIsCancelling(true);
    const result = await updateOrderStatus(order.id, {
      status: "CANCELLED",
      cancelledReason: "Customer requested cancellation",
    });
    setIsCancelling(false);

    if (result.success) {
      toast("Order cancelled successfully.", "info");
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    } else {
      toast(result.error || "Failed to cancel order.", "error");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center bg-mocha-bg">
        <div className="w-12 h-12 rounded-xl border-2 border-mocha-accent border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-mocha-text-muted">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center bg-mocha-bg">
        <div className="w-16 h-16 rounded-2xl bg-mocha-panel border border-mocha-border flex items-center justify-center mb-4 text-mocha-danger">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-mocha-text mb-1">Order Not Found</h1>
        <p className="text-xs text-mocha-text-muted max-w-sm mb-6">
          We could not locate an order matching identifier &ldquo;{orderId}&rdquo;. Please verify your reference number or check your orders list.
        </p>
        <Link
          href="/orders"
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-95 shadow-sm transition-opacity min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          ← Return to Orders
        </Link>
      </div>
    );
  }

  const statusMeta = ORDER_STATUS_META[order.status];

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-mocha-bg print:bg-white print:text-black">
      <div className="max-w-[1100px] w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col gap-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-mocha-text-muted print:hidden">
          <Link
            href="/orders"
            className="flex items-center gap-1.5 font-semibold text-mocha-text hover:text-mocha-accent transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent rounded"
          >
            <span>←</span>
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span>Orders</span>
            <span>/</span>
            <span className="text-mocha-text font-bold">{order.orderNumber}</span>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="p-4 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <h1 className="text-xl md:text-2xl font-bold font-mono text-mocha-text tracking-tight">
                {order.orderNumber}
              </h1>
              <span
                className="text-[11px] font-bold px-3 py-0.5 rounded-full border shrink-0"
                style={{
                  background: statusMeta.bg,
                  color: statusMeta.color,
                  borderColor: statusMeta.border,
                }}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-mocha-text-muted">
              Placed on {formatDate(order.createdAt)} · Mode:{" "}
              <span className="font-semibold text-mocha-text">
                {order.fulfillmentType === "PICKUP" ? "In-Store / Lab Pickup" : "Door-to-Door Delivery (Region III)"}
              </span>{" "}
              · Payment:{" "}
              <span className="font-semibold text-mocha-text">
                {order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Pay on Pickup"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden">
            {(order.status === "PENDING" || order.status === "PREPARING") && (
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#F38BA8]/10 border border-[#F38BA8]/30 text-[#F38BA8] hover:bg-[#F38BA8]/20 transition-colors flex items-center gap-1.5 min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#F38BA8]"
              >
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}

            <Link
              href={`/chat?convo=c1&orderRef=${order.orderNumber}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-mocha-panel-raised border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors flex items-center gap-1.5 min-h-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              <MessageSquare size={14} className="text-[#89B4FA]" />
              <span>Inquire</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-mocha-panel border border-mocha-border text-mocha-accent hover:border-mocha-accent transition-colors flex items-center gap-1.5 min-h-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              <Printer size={14} />
              <span>Invoice</span>
            </button>
          </div>
        </div>

        {/* Fulfillment Timeline Card */}
        {timeline && (
          <div className="p-4 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-mocha-border">
              <div>
                <h2 className="text-xs font-semibold text-mocha-text-muted">
                  Fulfillment Status
                </h2>
                <p className="text-sm font-semibold text-mocha-text mt-0.5">
                  {statusMeta.description}
                </p>
              </div>

              {order.trackingNo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-mocha-text-muted">Tracking:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTracking(order.trackingNo!)}
                    className="min-h-[36px] px-2.5 py-1 rounded-lg bg-mocha-panel-raised border border-mocha-border font-mono text-xs font-bold text-mocha-accent hover:border-mocha-accent flex items-center gap-1.5 transition-colors"
                    title="Click to copy tracking number"
                  >
                    <span>{order.trackingNo}</span>
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>

            {timeline.isCancelled ? (
              <div className="p-4 rounded-xl bg-mocha-danger/10 border border-mocha-danger/20 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-mocha-danger/20 text-mocha-danger flex items-center justify-center font-bold text-sm shrink-0">
                  ✕
                </div>
                <div>
                  <p className="text-xs font-bold text-mocha-danger">Order Cancelled</p>
                  <p className="text-[11px] text-mocha-text-muted mt-0.5">
                    This order was cancelled prior to fulfillment and will not be prepared or shipped.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-2 pb-1 overflow-x-auto" tabIndex={0} role="region" aria-label="Fulfillment timeline" data-timeline-scroll>
                <div className="flex items-start justify-between relative min-w-[560px]" data-timeline>
                  {timeline.steps.map((step, idx) => {
                    const isDone = idx < timeline.currentStepIndex;
                    const isCurrent = idx === timeline.currentStepIndex;
                    const stepMeta = ORDER_STATUS_META[step];

                    return (
                      <div key={step} className="flex-1 flex flex-col items-center text-center relative z-10 px-1">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs transition-all shadow-sm ${
                            isCurrent
                              ? "bg-[#89B4FA] text-[#11111B] ring-4 ring-[#89B4FA]/25 shadow-md font-bold scale-105"
                              : isDone
                              ? "bg-[#89B4FA] text-[#11111B] font-bold"
                              : "bg-[#1E1E2E] border-2 border-[#313244] text-[#6C7086] font-medium"
                          }`}
                        >
                          {isDone ? (
                            <svg
                              className="w-4 h-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] sm:text-xs mt-2.5 max-w-[95px] leading-tight ${
                            isCurrent
                              ? "font-bold text-[#89B4FA]"
                              : isDone
                              ? "font-medium text-[#CDD6F4]"
                              : "text-[#6C7086]"
                          }`}
                        >
                          {stepMeta.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Connecting Progress Line Track */}
                  <div
                    className="absolute top-[18px] h-0.5 bg-[#313244] -z-0"
                    style={{
                      left: `${100 / (2 * timeline.steps.length)}%`,
                      right: `${100 / (2 * timeline.steps.length)}%`,
                    }}
                  >
                    <div
                      className="h-full bg-[#89B4FA] transition-all duration-300"
                      style={{
                        width: `${(timeline.currentStepIndex / (timeline.steps.length - 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ordered Components Table */}
        <div className="p-4 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">
            Ordered Components ({order.items.reduce((s, i) => s + i.qty, 0)} items)
          </h2>
          

          <div className="border border-mocha-border rounded-xl overflow-x-auto" tabIndex={0} role="region" aria-label="Ordered components" data-order-items-scroll>
            <table className="w-full min-w-[600px] text-left text-xs" data-order-items>
              <thead className="bg-mocha-panel-raised border-b border-mocha-border text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted">
                <tr>
                  <th scope="col" className="p-3 pl-4">Component</th>
                  <th scope="col" className="p-3 hidden sm:table-cell">SKU</th>
                  <th scope="col" className="p-3 text-right">Unit Price</th>
                  <th scope="col" className="p-3 text-center">Qty</th>
                  <th scope="col" className="p-3 pr-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mocha-border bg-mocha-bg">
                {order.items.map((item) => (
                  <tr key={item.productId} className="hover:bg-mocha-panel/40 transition-colors">
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-mocha-border bg-mocha-panel shrink-0">
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.productId}`}
                            className="font-semibold text-mocha-text hover:text-mocha-accent transition-colors min-h-[44px] min-w-[44px] flex items-center"
                          >
                            {item.productName}
                          </Link>
                          <span className="sm:hidden font-mono text-[10px] text-mocha-text-muted block mt-0.5">
                            {item.productSku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell font-mono text-mocha-text-muted">
                      {item.productSku}
                    </td>
                    <td data-label="Unit price" className="p-3 text-right font-mono text-mocha-text">
                      {formatPrice(item.price)}
                    </td>
                    <td data-label="Quantity" className="p-3 text-center font-mono font-bold text-mocha-text">
                      {item.qty}
                    </td>
                    <td data-label="Subtotal" className="p-3 pr-4 text-right font-mono font-bold text-mocha-accent">
                      {formatPrice(item.price * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2-Column: Delivery / Station Details + Financial Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Fulfillment Details */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">
                {order.fulfillmentType === "PICKUP" ? "Pickup Information" : "Delivery Information"}
              </h3>

              <div className="flex flex-col gap-2 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-mocha-text-muted block">Recipient Name</span>
                  <p className="font-semibold text-mocha-text">{order.recipientName}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-mocha-text-muted block">Contact Number</span>
                  <p className="font-mono text-mocha-text">{order.contactNumber}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-mocha-text-muted block">
                    {order.fulfillmentType === "PICKUP" ? "Designated Station" : "Region III Address"}
                  </span>
                  <p className="text-mocha-text leading-relaxed">{order.deliveryAddress}</p>
                </div>

                {order.notes && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-mocha-text-muted block">Delivery Notes</span>
                    <p className="text-mocha-text-muted italic">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Financial Summary */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="p-4 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">
                Payment Summary
              </h3>

              <div className="flex flex-col gap-2.5 pt-1 text-xs">
                <div className="flex justify-between text-mocha-text-muted">
                  <span>Subtotal Amount</span>
                  <span className="font-mono font-bold text-mocha-text">
                    {formatPrice(order.subtotalAmount)}
                  </span>
                </div>

                <div className="flex justify-between text-mocha-text-muted">
                  <span>
                    {order.fulfillmentType === "PICKUP"
                      ? "Pickup Fee"
                      : "Delivery Fee (Region III)"}
                  </span>
                  <span className="font-mono font-bold text-mocha-text">
                    {order.deliveryFee === 0 ? (
                      <span className="text-mocha-success">FREE</span>
                    ) : (
                      formatPrice(order.deliveryFee)
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-mocha-border">
                  <span className="text-sm font-bold text-mocha-text">Total</span>
                  <span className="text-lg font-bold font-mono text-mocha-accent">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-mocha-panel-raised border border-mocha-border text-[11px] text-mocha-text-muted leading-relaxed mt-2">
                  <span className="font-bold text-mocha-text block mb-0.5">
                    {order.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "Pay on Pickup"}
                  </span>
                  {order.paymentMethod === "COD"
                    ? "Please prepare the exact cash amount upon parcel arrival. Courier delivery strictly restricted to Region 3 (Central Luzon)."
                    : "Payment will be collected on-site at the campus electronics lab station upon parcel inspection."}
                </div>

                <div className="p-3 rounded-xl bg-mocha-panel border border-mocha-border text-[11px] text-mocha-text-muted leading-relaxed mt-1 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <span className="text-mocha-accent text-sm shrink-0 leading-none">ℹ</span>
                    <div>
                      <span className="font-bold text-mocha-text block mb-0.5">Order Support</span>
                      <span>
                        Need help or have delivery questions regarding this order?
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-mocha-border/60">
                    <button
                      type="button"
                      onClick={() => {
                        chatWidgetStore.open({
                          mode: "seller",
                          order: {
                            orderNumber: order.orderNumber,
                            status: order.status,
                          },
                          prompt: `Hello! I would like an update regarding my order #${order.orderNumber} (Status: ${order.status}).`,
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-mocha-panel-raised hover:bg-mocha-panel border border-mocha-border hover:border-mocha-accent text-mocha-text hover:text-mocha-accent text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>💬</span>
                      <span>Chat with Seller</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        chatWidgetStore.open({
                          mode: "bot",
                          order: {
                            orderNumber: order.orderNumber,
                            status: order.status,
                          },
                          prompt: `How do I track my delivery and courier waybill for order #${order.orderNumber}?`,
                        });
                      }}
                      className="px-3 py-1.5 rounded-lg bg-mocha-panel-raised hover:bg-mocha-panel border border-mocha-border hover:border-mocha-accent text-mocha-text hover:text-mocha-accent text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <span>🤖</span>
                      <span>Ask OhmBot</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
