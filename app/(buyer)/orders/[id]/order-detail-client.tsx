"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { getMockOrderById, ORDER_STATUS_META, getTimelineStepsForOrder } from "@/services/order-service";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "@/components/ui/toast";

interface OrderDetailClientProps {
  orderId: string;
}

export function OrderDetailClient({ orderId }: OrderDetailClientProps) {
  const order = useMemo(() => getMockOrderById(orderId), [orderId]);
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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center bg-mocha-bg">
        <div className="w-16 h-16 rounded-2xl bg-mocha-panel border border-mocha-border flex items-center justify-center mb-4 text-mocha-danger">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
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
            <Link
              href={`/chat?convo=c1&orderRef=${order.orderNumber}`}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-mocha-panel-raised border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors flex items-center gap-1.5 min-h-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Inquire</span>
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-mocha-panel border border-mocha-border text-mocha-accent hover:border-mocha-accent transition-colors flex items-center gap-1.5 min-h-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Invoice</span>
            </button>
          </div>
        </div>

        {/* Fulfillment Timeline Card */}
        {timeline && (
          <div className="p-4 sm:p-6 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-mocha-border">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">
                  Fulfillment Status & Timeline
                </h2>
                <p className="text-xs text-mocha-text font-medium mt-0.5">
                  {statusMeta.description}
                </p>
              </div>

              {order.trackingNo && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-mocha-text-muted">Tracking:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTracking(order.trackingNo!)}
                    className="min-h-[44px] min-w-[44px] font-mono text-xs font-bold text-mocha-accent hover:underline flex items-center gap-1"
                    title="Click to copy tracking number"
                  >
                    <span>{order.trackingNo}</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" />
                    </svg>
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
                <div className="flex items-center justify-between relative min-w-[560px]" data-timeline>
                  {timeline.steps.map((step, idx) => {
                    const isDone = idx <= timeline.currentStepIndex;
                    const isCurrent = idx === timeline.currentStepIndex;
                    const stepMeta = ORDER_STATUS_META[step];

                    return (
                      <div key={step} className="flex-1 flex flex-col items-center text-center relative z-10 px-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                            isCurrent
                              ? "bg-mocha-accent text-mocha-bg ring-4 ring-mocha-accent/25"
                              : isDone
                              ? "bg-mocha-accent/20 text-mocha-accent border border-mocha-accent"
                              : "bg-mocha-bg border border-mocha-border text-mocha-text-muted"
                          }`}
                        >
                          {isDone && !isCurrent ? "✓" : idx + 1}
                        </div>
                        <span
                          className={`text-[11px] font-bold mt-2 max-w-[95px] leading-tight ${
                            isCurrent
                              ? "text-mocha-accent"
                              : isDone
                              ? "text-mocha-text"
                              : "text-mocha-text-muted"
                          }`}
                        >
                          {stepMeta.label}
                        </span>
                      </div>
                    );
                  })}

                  {/* Connecting Progress Line */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-mocha-border -z-0">
                    <div
                      className="h-full bg-mocha-accent transition-all duration-300"
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
          <p className="text-[11px] text-mocha-text-muted sm:hidden">Scroll horizontally to see prices, quantities and line totals.</p>

          <div className="border border-mocha-border rounded-xl overflow-x-auto" tabIndex={0} role="region" aria-label="Ordered components, scroll horizontally to view all columns" data-order-items-scroll>
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
                    <td className="p-3 text-right font-mono text-mocha-text">
                      {formatPrice(item.price)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-mocha-text">
                      {item.qty}
                    </td>
                    <td className="p-3 pr-4 text-right font-mono font-bold text-mocha-accent">
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

                <div className="p-3 rounded-xl bg-mocha-panel border border-mocha-border text-[11px] text-mocha-text-muted leading-relaxed mt-1 flex items-start gap-2">
                  <span className="text-mocha-accent text-sm shrink-0 leading-none">ℹ</span>
                  <div>
                    <span className="font-bold text-mocha-text block mb-0.5">Order Support</span>
                    <span>
                      Need help with this order? Contact support.
                    </span>
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
