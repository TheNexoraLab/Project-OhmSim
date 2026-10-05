"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { getProductByIdSync } from "@/services/catalog-service";
import { toast } from "@/components/ui/toast";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(price);
}

const BUNDLE_PALETTE = [
  { solid: "#94E2D5", bg: "rgba(148,226,213,0.10)", border: "rgba(148,226,213,0.40)" }, // teal
  { solid: "#CBA6F7", bg: "rgba(203,166,247,0.10)", border: "rgba(203,166,247,0.40)" }, // mauve
  { solid: "#FAB387", bg: "rgba(250,179,135,0.10)", border: "rgba(250,179,135,0.40)" }, // peach
  { solid: "#89DCEB", bg: "rgba(137,220,235,0.10)", border: "rgba(137,220,235,0.40)" }, // sky
  { solid: "#A6E3A1", bg: "rgba(166,227,161,0.10)", border: "rgba(166,227,161,0.40)" }, // green
  { solid: "#F38BA8", bg: "rgba(243,139,168,0.10)", border: "rgba(243,139,168,0.40)" }, // red
  { solid: "#F9E2AF", bg: "rgba(249,226,175,0.10)", border: "rgba(249,226,175,0.40)" }, // yellow
  { solid: "#89B4FA", bg: "rgba(137,180,250,0.10)", border: "rgba(137,180,250,0.40)" }, // blue
];

export function CartClient() {
  const router = useRouter();
  const {
    cart,
    cartBundles,
    setCartQty,
    removeFromCart,
    removeBundleFromCart,
    setBundleItemQty,
    clearCart,
    cartTotal,
    cartSubtotal,
    deliveryFee,
    totalAmount,
  } = useCart();

  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(
    () => new Set(cartBundles.map((b) => b.id))
  );
  const [promoCode, setPromoCode] = useState("");

  const toggleBundle = (id: string) => {
    setExpandedBundles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast("Please enter a promo code", "warning");
      return;
    }
    toast(`Promo code "${promoCode.trim().toUpperCase()}" is invalid or expired`, "error");
  };

  const standaloneEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
  const isEmpty = standaloneEntries.length === 0 && cartBundles.length === 0;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-mocha-bg">
      <div className="max-w-[1200px] w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-mocha-border mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-mocha-text tracking-tight flex items-center gap-2">
              Shopping Cart
              {!isEmpty && (
                <span className="text-xs md:text-sm font-normal text-mocha-text-muted">
                  ({cartTotal} {cartTotal === 1 ? "item" : "items"})
                </span>
              )}
            </h1>
            <p className="text-xs text-mocha-text-muted mt-0.5">
              Review individual items and BOM bundles before checkout
            </p>
          </div>

          {!isEmpty && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-mocha-text-muted hover:text-mocha-danger transition-colors px-3 py-1.5 rounded-lg hover:bg-mocha-danger/10 focus-visible:outline-2 focus-visible:outline-mocha-danger"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Empty State */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 text-center">
            <div className="w-20 h-20 rounded-2xl bg-mocha-panel border border-mocha-border flex items-center justify-center mb-4 text-mocha-text-muted shadow-sm">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-mocha-text">Your cart is currently empty</h2>
            <p className="text-xs md:text-sm text-mocha-text-muted mt-1 max-w-sm">
              Add components from the catalog or transfer an entire project from the BOM workspace.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Link
                href="/products"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-95 shadow-md transition-opacity"
              >
                Browse Catalog
              </Link>
              <Link
                href="/bom"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-mocha-panel border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors"
              >
                View BOM Projects
              </Link>
            </div>
          </div>
        ) : (
          /* Non-Empty Layout: Items Column + Summary Sidebar */
          <div className="flex flex-col lg:flex-row gap-6 items-start pb-20 md:pb-6">
            {/* Left: Cart Line Items */}
            <div className="flex-1 w-full flex flex-col gap-4">
              {/* ── BOM Bundles ── */}
              {cartBundles.map((bundle, bundleIdx) => {
                const palette = BUNDLE_PALETTE[bundleIdx % BUNDLE_PALETTE.length];
                const isExpanded = expandedBundles.has(bundle.id);
                const bundleItemCount = bundle.items.reduce((s, i) => s + i.qty, 0);
                const bundleSubtotal = bundle.items.reduce((s, li) => {
                  const p = getProductByIdSync(li.productId);
                  return s + (p ? p.price * li.qty : 0);
                }, 0);

                return (
                  <div
                    key={bundle.id}
                    className="rounded-2xl overflow-hidden border bg-mocha-panel shadow-sm transition-all"
                    style={{ borderColor: palette.border }}
                  >
                    {/* Bundle Header */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 select-none"
                      style={{
                        background: palette.bg,
                        borderBottom: isExpanded ? `1px solid ${palette.border}` : "none",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleBundle(bundle.id)}
                        aria-expanded={isExpanded}
                        data-bundle-toggle
                        className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-mocha-accent rounded-lg"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{ background: palette.bg, borderColor: palette.border, color: palette.solid }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                            <line x1="12" y1="22.08" x2="12" y2="12" />
                          </svg>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.solid }}>
                            BOM Project Bundle
                          </span>
                          <h2 className="text-sm font-bold text-mocha-text truncate">
                            {bundle.bomName}
                          </h2>
                        </div>

                        <div className="text-right shrink-0 mr-1">
                          <p className="text-[11px] text-mocha-text-muted">
                            {bundleItemCount} {bundleItemCount === 1 ? "unit" : "units"}
                          </p>
                          <p className="text-sm font-bold font-mono" style={{ color: palette.solid }}>
                            {formatPrice(bundleSubtotal)}
                          </p>
                        </div>

                        {/* Chevron */}
                        <svg
                          className="w-4 h-4 text-mocha-text-muted transition-transform shrink-0"
                          style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Remove Entire Bundle Button */}
                      <button
                        type="button"
                        aria-label={`Remove bundle ${bundle.bomName}`}
                        onClick={() => removeBundleFromCart(bundle.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-mocha-text-muted hover:text-mocha-danger hover:bg-mocha-danger/10 transition-colors shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Expanded Bundle Items */}
                    {isExpanded && (
                      <div className="divide-y divide-mocha-border bg-mocha-panel">
                        {bundle.items.map(({ productId, qty: itemQty }) => {
                          const product = getProductByIdSync(productId);
                          if (!product) return null;

                          return (
                            <div key={productId} className="p-3 md:px-4 flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-mocha-border bg-mocha-bg shrink-0">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="48px"
                                  className="object-cover"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-mocha-accent">
                                  {product.category}
                                </p>
                                <p className="text-xs font-semibold text-mocha-text truncate">
                                  {product.name}
                                </p>
                                <p className="text-[10px] font-mono text-mocha-text-muted">
                                  {product.sku}
                                </p>
                              </div>

                              {/* Quantity Controls inside bundle */}
                              <div className="flex items-center gap-1 bg-mocha-bg border border-mocha-border rounded-lg p-0.5 shrink-0">
                                <button
                                  type="button"
                                  aria-label={`Decrease bundle quantity of ${product.name}`}
                                  onClick={() => setBundleItemQty(bundle.id, productId, itemQty - 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-mocha-text hover:text-mocha-danger transition-colors"
                                >
                                  {itemQty <= 1 ? "×" : "−"}
                                </button>
                                <span className="w-6 text-center text-xs font-mono font-bold text-mocha-text">
                                  {itemQty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Increase bundle quantity of ${product.name}`}
                                  onClick={() => setBundleItemQty(bundle.id, productId, itemQty + 1)}
                                  className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-mocha-text hover:text-mocha-accent transition-colors"
                                >
                                  +
                                </button>
                              </div>

                              <div className="text-right shrink-0 min-w-[70px]">
                                <span className="text-xs font-bold font-mono text-mocha-accent">
                                  {formatPrice(product.price * itemQty)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Individual Items Section ── */}
              {standaloneEntries.length > 0 && cartBundles.length > 0 && (
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-mocha-text-muted mb-2">
                    Individual Items
                  </p>
                </div>
              )}

              {standaloneEntries.map(([productId, qty]) => {
                const product = getProductByIdSync(productId);
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="p-4 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex items-center gap-4 hover:border-mocha-border-strong transition-all"
                  >
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-mocha-border bg-mocha-bg shrink-0">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-mocha-accent">
                        {product.category}
                      </p>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-xs md:text-sm font-bold text-mocha-text hover:text-mocha-accent transition-colors line-clamp-1"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[10px] font-mono text-mocha-text-muted mt-0.5">
                        {product.sku} · {formatPrice(product.price)} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 bg-mocha-bg border border-mocha-border rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${product.name}`}
                        onClick={() => {
                          if (qty <= 1) {
                            removeFromCart(productId);
                          } else {
                            setCartQty(productId, qty - 1);
                          }
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-mocha-text hover:text-mocha-danger transition-colors"
                      >
                        {qty <= 1 ? "×" : "−"}
                      </button>
                      <span className="w-8 text-center text-xs font-mono font-bold text-mocha-text">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${product.name}`}
                        disabled={qty >= product.stock}
                        onClick={() => setCartQty(productId, qty + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-mocha-text hover:text-mocha-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Line Total */}
                    <div className="text-right shrink-0 min-w-[80px]">
                      <span className="text-sm font-bold font-mono text-mocha-accent">
                        {formatPrice(product.price * qty)}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      aria-label={`Remove ${product.name} from cart`}
                      onClick={() => removeFromCart(productId)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl text-mocha-text-muted hover:text-mocha-danger hover:bg-mocha-danger/10 transition-colors shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Right: Order Summary Sidebar */}
            <div className="w-full lg:w-80 lg:shrink-0 flex flex-col gap-4 sticky top-20">
              <div className="p-5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-mocha-text-muted">
                  Order Summary
                </h3>

                {/* Subtotals & Fees */}
                <div className="flex flex-col gap-2.5 pt-2 border-t border-mocha-border">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mocha-text-muted">Subtotal</span>
                    <span className="font-mono font-bold text-mocha-text">
                      {formatPrice(cartSubtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mocha-text-muted">Est. Delivery Fee (Region III)</span>
                    {deliveryFee === 0 ? (
                      <span className="font-bold text-mocha-success">FREE</span>
                    ) : (
                      <span className="font-mono font-bold text-mocha-text">
                        {formatPrice(deliveryFee)}
                      </span>
                    )}
                  </div>

                  {/* Free shipping progress notice per BR-046 */}
                  {cartSubtotal < 1000 ? (
                    <div className="p-2.5 rounded-xl bg-mocha-panel-raised border border-mocha-border text-[11px] text-mocha-text-muted leading-relaxed">
                      Add <span className="font-bold text-mocha-accent font-mono">{formatPrice(1000 - cartSubtotal)}</span> more to qualify for <span className="font-bold text-mocha-success">FREE delivery</span> in Region III!
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-mocha-success/10 border border-mocha-success/20 text-[11px] text-mocha-success font-medium flex items-center gap-1.5">
                      <span>✓</span>
                      <span>Your order qualifies for FREE Region III delivery!</span>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-mocha-border">
                  <span className="text-sm font-bold text-mocha-text">Total</span>
                  <span className="text-xl font-bold font-mono text-mocha-accent">
                    {formatPrice(totalAmount)}
                  </span>
                </div>

                {/* Promo Code Input */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-mocha-bg border border-mocha-border rounded-xl text-mocha-text outline-none focus:border-mocha-accent uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-mocha-panel-raised border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {/* Proceed to Checkout CTA */}
                <button
                  type="button"
                  onClick={() => router.push("/checkout")}
                  className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl text-xs font-bold bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg hover:opacity-95 shadow-md transition-all mt-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Proceed to Checkout
                </button>

                <p className="text-[10px] text-center text-mocha-text-muted mt-0.5">
                  Secure checkout · Cash on Delivery (COD) & In-Person Pickup
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
