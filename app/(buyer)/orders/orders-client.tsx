"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { MockOrder, OrderStatus } from "@/types/order";
import {
  getMockOrders,
  ORDER_STATUS_META,
  getTimelineStepsForOrder,
} from "@/services/order-service";
import { formatPrice, formatDate } from "@/lib/format";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export function OrdersClient() {
  const [orders] = useState<MockOrder[]>(() => getMockOrders());
  const [selectedId, setSelectedId] = useState<string>(() => orders[0]?.id ?? "");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "ALL" && o.status !== statusFilter) return false;
      if (q) {
        const matchRef = o.orderNumber.toLowerCase().includes(q);
        const matchItem = o.items.some(
          (i) =>
            i.productName.toLowerCase().includes(q) ||
            i.productSku.toLowerCase().includes(q)
        );
        const matchAddr = o.deliveryAddress?.toLowerCase().includes(q) ?? false;
        if (!matchRef && !matchItem && !matchAddr) return false;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  const selectedOrder = useMemo(() => {
    return filteredOrders.find((o) => o.id === selectedId) ?? filteredOrders[0] ?? null;
  }, [selectedId, filteredOrders]);

  const timeline = useMemo(() => {
    return selectedOrder ? getTimelineStepsForOrder(selectedOrder) : null;
  }, [selectedOrder]);

  const handleCopyTracking = async (trackingNo: string) => {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(trackingNo);
      toast(`Tracking number ${trackingNo} copied to clipboard`, "success");
    } catch {
      toast(`Unable to copy. Tracking: ${trackingNo}`, "info");
    }
  };

  const statusChips: { label: string; value: OrderStatus | "ALL" }[] = [
    { label: "All", value: "ALL" },
    { label: "Preparing", value: "PREPARING" },
    { label: "Out for Delivery", value: "OUT_FOR_DELIVERY" },
    { label: "Ready for Pickup", value: "READY_FOR_PICKUP" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Cancelled", value: "CANCELLED" },
  ];

  return (
    <div data-orders-workspace className="flex flex-none flex-col min-w-0 bg-mocha-bg md:flex-row md:h-[calc(100dvh-64px)] md:min-h-[480px] print:h-auto print:block">
      {/* Reference composition: a compact fixed-width rail, not standalone cards. */}
      <aside data-orders-rail aria-label="Orders list" className="w-full shrink-0 flex flex-col bg-mocha-panel border-b border-mocha-panel-high md:w-72 md:border-b-0 md:border-r md:min-h-0 print:hidden">
        <div className="px-3 py-3 border-b border-mocha-panel-high shrink-0">
          <h1 className="text-base font-bold text-mocha-text mb-2">Orders</h1>
          <div className="relative">
            <label htmlFor="orders-search" className="sr-only">Search orders by reference, component name, or address</label>
            <svg aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-mocha-text-subtle pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" />
            </svg>
            <input id="orders-search" type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ref..." className="min-h-11 w-full min-w-0 pl-9 pr-11 rounded-control border border-mocha-panel-high bg-mocha-bg-secondary text-xs text-mocha-text placeholder:text-mocha-text-subtle focus:border-mocha-accent focus:outline-none" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-0 inset-y-0 w-11 flex items-center justify-center text-mocha-text-subtle hover:text-mocha-text rounded-control">✕</button>}
          </div>
        </div>
        <div aria-label="Filter orders by status" className="flex flex-wrap gap-x-1.5 px-3 py-1 border-b border-mocha-panel-high shrink-0">
          {statusChips.map(chip => {
            const active = statusFilter === chip.value;
            return (
              <button key={chip.value} type="button" onClick={() => setStatusFilter(chip.value)} aria-pressed={active} className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-pill">
                <span className={"px-2.5 py-1 rounded-pill text-[9px] font-bold border transition-colors " + (active ? "bg-mocha-accent/15 border-mocha-accent text-mocha-accent" : "bg-mocha-panel-raised border-mocha-panel-high text-mocha-text-subtle hover:text-mocha-text")}>{chip.label}</span>
              </button>
            );
          })}
        </div>
        <div data-orders-list className="flex-1 min-h-0 overflow-y-auto py-1">
          {filteredOrders.map(o => {
            const selected = selectedOrder?.id === o.id;
            const meta = ORDER_STATUS_META[o.status];
            const units = o.items.reduce((sum, item) => sum + item.qty, 0);
            return (
              <div key={o.id} data-order-id={o.id} data-selected={selected} className={"relative group border-l-[3px] transition-colors " + (selected ? "bg-mocha-accent/15 border-mocha-accent" : "border-transparent hover:bg-mocha-accent/5")}>
                <button type="button" onClick={() => setSelectedId(o.id)} aria-pressed={selected} className="w-full text-left px-4 py-3 min-h-11">
                  <span className="flex items-center justify-between gap-2 mb-1">
                    <span className={"font-mono text-sm font-bold " + (selected ? "text-mocha-accent" : "text-mocha-text")}>#{o.orderNumber}</span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-pill border shrink-0" style={{ background: meta.bg, color: meta.color, borderColor: meta.border }}>{meta.label}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-mocha-text-subtle">{formatDate(o.createdAt)} · {units} items</span>
                    <span className="text-[11px] font-mono font-bold text-mocha-text-muted">{formatPrice(o.subtotalAmount)}</span>
                  </span>
                </button>
                <Link href={"/orders/" + o.id} className="flex min-h-11 min-w-11 items-center px-4 text-[11px] font-semibold text-mocha-accent md:sr-only md:focus:not-sr-only md:focus:relative md:focus:flex md:focus:min-h-11 md:focus:bg-mocha-bg-secondary">Details →</Link>
              </div>
            );
          })}
          {!filteredOrders.length && (
            <div className="p-4 text-center flex flex-col items-center gap-2">
              <h2 className="text-sm text-mocha-text-muted">No matching orders found</h2>
              <Button size="compact" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>Clear Filters</Button>
            </div>
          )}
        </div>
      </aside>

      {selectedOrder ? (
        <section data-orders-preview aria-label="Selected order" className="hidden md:flex min-w-0 flex-1 flex-col overflow-y-auto print:flex">
          <header data-orders-detail-header className="shrink-0 flex flex-wrap items-start justify-between gap-3 px-6 py-4 border-b border-mocha-panel-high bg-mocha-panel-raised">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h2 className="text-lg font-bold font-mono text-mocha-text">
                  <Link href={"/orders/" + selectedOrder.id} aria-label="Full Details Page" title="Open full order details" className="inline-flex min-h-11 min-w-11 -my-2 items-center rounded-small hover:text-mocha-accent">#{selectedOrder.orderNumber}</Link>
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-pill border" style={{ background: ORDER_STATUS_META[selectedOrder.status].bg, color: ORDER_STATUS_META[selectedOrder.status].color, borderColor: ORDER_STATUS_META[selectedOrder.status].border }}>{ORDER_STATUS_META[selectedOrder.status].label}</span>
              </div>
              <p className="text-[11px] text-mocha-text-subtle">Placed on {formatDate(selectedOrder.createdAt)} · {selectedOrder.fulfillmentType === "PICKUP" ? "Store Pickup" : "Region III Delivery"}</p>
            </div>
            <Button variant="raised" size="compact" onClick={() => window.print()} className="text-[11px] text-mocha-accent print:hidden">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5 mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></svg>
              Invoice
            </Button>
          </header>

          <div data-orders-detail-body className="flex-1 min-w-0 px-6 py-5 flex flex-col gap-5">
            {timeline && (
              <Surface data-orders-progress variant="panel" className="p-4 bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border-mocha-panel-high shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-mocha-text-subtle mb-4">Order Progress</h3>
                {timeline.isCancelled ? (
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="w-8 h-8 rounded-pill bg-mocha-danger/15 border border-mocha-danger flex items-center justify-center text-mocha-danger">✕</span>
                    <div><p className="text-sm font-bold text-mocha-danger">Order Cancelled</p><p className="text-[10px] text-mocha-text-subtle mt-0.5">This order was cancelled and will not be processed.</p></div>
                  </div>
                ) : (
                  <div role="region" aria-label="Order progress, scroll horizontally to view all steps" tabIndex={0} data-orders-progress-scroll className="overflow-x-auto">
                    <ol className="flex min-w-[560px]">
                      {timeline.steps.map((step, index) => {
                        const done = index <= timeline.currentStepIndex;
                        const current = index === timeline.currentStepIndex;
                        return (
                          <li key={step} aria-current={current ? "step" : undefined} className="flex flex-1 items-start last:flex-none">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={"w-7 h-7 rounded-pill border-2 flex items-center justify-center text-[11px] font-bold shrink-0 " + (current ? "bg-mocha-accent border-mocha-accent text-mocha-bg" : done ? "bg-mocha-accent/15 border-mocha-accent text-mocha-accent" : "bg-mocha-panel-raised border-mocha-border-strong text-mocha-text-subtle")}>{done && !current ? "✓" : index + 1}</span>
                              <span className={"text-[9px] font-bold whitespace-nowrap " + (current ? "text-mocha-accent" : done ? "text-mocha-text-muted" : "text-mocha-text-subtle")}>{ORDER_STATUS_META[step].label}</span>
                            </div>
                            {index < timeline.steps.length - 1 && <span aria-hidden="true" className={"flex-1 h-0.5 mt-3.5 mx-1 " + (index < timeline.currentStepIndex ? "bg-mocha-accent" : "bg-mocha-border-strong")} />}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </Surface>
            )}

            <div data-orders-detail-columns className="flex flex-col lg:flex-row items-stretch gap-4 min-w-0">
              <div data-orders-items-panel className="flex-1 min-w-0 border border-mocha-panel-high rounded-panel overflow-hidden">
                <div role="region" aria-label="Ordered items, scroll horizontally to view all columns" tabIndex={0} data-orders-items-scroll className="overflow-x-auto">
                  <table data-orders-preview-items className="w-full min-w-[560px] table-fixed text-left">
                    <colgroup><col /><col className="w-20" /><col className="w-[70px]" /><col className="w-20" /></colgroup>
                    <thead className="bg-mocha-panel-raised border-b border-mocha-panel-high">
                      <tr className="text-[9px] uppercase tracking-widest text-mocha-text-subtle">
                        <th scope="col" className="font-bold px-4 py-2.5 pl-16">Item</th><th scope="col" className="font-bold py-2.5">Unit Price</th><th scope="col" className="font-bold py-2.5">Qty</th><th scope="col" className="font-bold py-2.5 pr-4">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={item.productId} className={"border-b border-mocha-panel-high last:border-b-0 " + (index % 2 === 0 ? "bg-mocha-panel" : "bg-mocha-panel-raised")}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative w-9 h-9 shrink-0 rounded-small border border-mocha-panel-high overflow-hidden"><Image src={item.productImage} alt={item.productName} fill sizes="36px" className="object-cover" /></div>
                              <Link href={"/products/" + item.productId} className="flex flex-col justify-center min-h-11 min-w-0 flex-1 hover:text-mocha-accent rounded-small">
                                <span className="text-xs font-bold">{item.productName}</span><span className="text-[9px] font-mono text-mocha-text-subtle mt-0.5">{item.productSku}</span>
                              </Link>
                            </div>
                          </td>
                          <td className="text-xs font-mono font-bold text-mocha-text-muted">{formatPrice(item.price)}</td>
                          <td className="text-xs font-mono font-bold text-mocha-text">×{item.qty}</td>
                          <td className="text-xs font-mono font-bold text-mocha-accent pr-4">{formatPrice(item.price * item.qty)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-mocha-panel-raised border-t border-mocha-border-strong">
                      <tr><th scope="row" colSpan={3} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-mocha-text-subtle">Order Subtotal</th><td className="py-3 pr-4 text-base font-bold font-mono text-mocha-accent">{formatPrice(selectedOrder.subtotalAmount)}</td></tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div data-orders-info-rail className="w-full lg:w-56 shrink-0 flex flex-col gap-3">
                <Surface variant="panel" className="p-4 bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border-mocha-panel-high flex flex-col gap-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-mocha-text-subtle">{selectedOrder.fulfillmentType === "PICKUP" ? "Pickup Info" : "Shipping Info"}</h3>
                  <div className="flex items-start gap-2">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 mt-0.5 shrink-0 text-mocha-text-subtle"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    <p className="text-xs text-mocha-text-muted leading-snug">{selectedOrder.deliveryAddress}</p>
                  </div>
                  <div className="flex items-center gap-2 text-mocha-text-muted">
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M12 3L2 8l10 5 10-5-10-5z" /><path d="M2 8v8l10 5 10-5V8" /><line x1="12" y1="13" x2="12" y2="21" /><path d="M7 5.5L17 10.5" /></svg>
                    <p className="text-xs font-bold">{selectedOrder.fulfillmentType === "PICKUP" ? "Store Pickup · Pay on Pickup" : "Region III Delivery · COD"}</p>
                  </div>
                </Surface>
                {selectedOrder.trackingNo && (
                  <Surface variant="panel" className="p-4 bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border-mocha-panel-high">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-mocha-text-subtle mb-2">Tracking No.</h3>
                    <button type="button" onClick={() => handleCopyTracking(selectedOrder.trackingNo!)} className="min-h-11 min-w-11 text-[11px] text-left font-bold font-mono break-all text-mocha-accent rounded-small hover:underline">{selectedOrder.trackingNo}</button>
                  </Surface>
                )}
                <Surface data-orders-summary variant="panel" className="p-4 bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border-mocha-panel-high">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-mocha-text-subtle mb-2">Summary</h3>
                  <dl className="text-xs">
                    <div className="flex justify-between gap-2 mb-1"><dt className="text-mocha-text-subtle">Items</dt><dd className="font-mono font-bold">{selectedOrder.items.reduce((sum, item) => sum + item.qty, 0)}</dd></div>
                    <div className="flex justify-between gap-2 mb-1"><dt className="text-mocha-text-subtle">{selectedOrder.fulfillmentType === "PICKUP" ? "Pickup" : "Shipping"}</dt><dd data-order-fee className="font-mono font-bold">{formatPrice(selectedOrder.deliveryFee)}</dd></div>
                    <div className="flex justify-between gap-2 pt-2 border-t border-mocha-panel-high"><dt className="font-bold">Total</dt><dd data-order-total className="font-mono font-bold text-mocha-accent">{formatPrice(selectedOrder.totalAmount)}</dd></div>
                  </dl>
                </Surface>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-sm text-mocha-text-subtle p-6">Select an order to view its details.</div>
      )}
    </div>
  );
}
