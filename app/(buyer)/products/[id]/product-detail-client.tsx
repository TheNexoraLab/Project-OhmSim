"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import type { Product } from "@/types/product";
import { getRelatedProductsSync } from "@/services/catalog-service";
import { useCart } from "@/hooks/use-cart";
import { useBom } from "@/hooks/use-bom";
import { StockBadge } from "@/components/ui/badge";
import { ProductGallery } from "@/components/buyer/product-gallery";
import { SpecsTable } from "@/components/buyer/specs-table";
import { ProductCard } from "@/components/buyer/product-card";
import { MobileProductCard } from "@/components/buyer/mobile-product-card";
import { BomChooserPopover } from "@/components/buyer/bom-chooser-popover";
import { toast } from "@/components/ui/toast";

interface ProductDetailClientProps {
  product: Product;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { cart, addToCart } = useCart();
  const { bomProjects, addToBomProject } = useBom();

  const bomTriggerRef = useRef<HTMLButtonElement>(null);
  const [bomOpen, setBomOpen] = useState(false);

  // Cart stock calculations
  const currentInCart = cart[product.id] ?? 0;
  const remainingStock = Math.max(0, product.stock - currentInCart);
  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = remainingStock <= 0 && !isOutOfStock;
  const isCartDisabled = isOutOfStock || isMaxInCart;

  const [qty, setQty] = useState(1);

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  // Obtain related products strictly via the approved service boundary
  const related = getRelatedProductsSync(product.id, product.category, 4);

  const handleAddToCart = () => {
    addToCart(product.id, qty);
    // Reset stepper to 1 or remaining
    setQty(1);
  };

  return (
    <div className="flex-1 max-w-[1240px] w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-[11px] text-mocha-text-muted">
        <Link href="/home" className="hover:text-mocha-accent transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-mocha-accent transition-colors">
          Products
        </Link>
        <span>/</span>
        <span className="font-mono text-mocha-text">{product.sku}</span>
      </nav>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left Column: Product Gallery */}
        <ProductGallery product={product} />

        {/* Right Column: Information, Controls & CTAs */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
          {/* Brand & Category Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.brand && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-mocha-accent/15 text-mocha-accent border border-mocha-accent/30">
                {product.brand}
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-mocha-panel-raised text-mocha-text-muted border border-mocha-border">
              {product.category}
            </span>
          </div>

          {/* Product Title and Label */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-mocha-text">
              {product.name}
            </h1>
            <p className="text-[12px] mt-1 font-medium text-mocha-text-subtle">
              {product.label}
            </p>
          </div>

          {/* Price & Stock Display */}
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-mocha-accent">
              {formatPrice(product.price)}
            </span>
            <StockBadge status={product.status} />
          </div>

          {/* SKU Display */}
          <p className="text-[11px] font-mono text-mocha-text-subtle">
            SKU: <span className="text-mocha-text-muted">{product.sku}</span>
          </p>

          <div className="h-px bg-mocha-border w-full my-1" />

          {/* Quantity Selector — bounded by available remaining stock */}
          <div className="flex flex-col gap-2">
            <label htmlFor="product-qty-stepper" className="text-[11px] font-bold uppercase tracking-wider text-mocha-text-muted">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <div
                id="product-qty-stepper"
                className={`flex items-center overflow-hidden border rounded-xl bg-mocha-bg-secondary ${
                  isCartDisabled ? "border-mocha-border/50 opacity-60" : "border-mocha-border-strong"
                }`}
              >
                <button
                  type="button"
                  disabled={isCartDisabled || qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-11 h-11 flex items-center justify-center text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel-raised disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-lg font-bold"
                >
                  −
                </button>
                <span className="w-12 text-center text-[14px] font-bold font-mono text-mocha-text">
                  {isCartDisabled ? 0 : qty}
                </span>
                <button
                  type="button"
                  disabled={isCartDisabled || qty >= remainingStock}
                  onClick={() => setQty((q) => Math.min(remainingStock, q + 1))}
                  aria-label="Increase quantity"
                  className="w-11 h-11 flex items-center justify-center text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel-raised disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-lg font-bold"
                >
                  +
                </button>
              </div>
              <span id="product-stock-display" className="text-[11px] text-mocha-text-subtle">
                {isOutOfStock
                  ? "Out of stock"
                  : isMaxInCart
                  ? `Max stock in cart (${product.stock} units)`
                  : `${product.stock} available (${currentInCart} in cart, ${remainingStock} remaining)`}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col gap-2.5 mt-2">
            <button
              id="product-add-to-cart-btn"
              type="button"
              disabled={isCartDisabled}
              aria-disabled={isCartDisabled}
              onClick={handleAddToCart}
              className={`w-full min-h-[48px] flex items-center justify-center gap-2 font-bold text-[13px] rounded-xl shadow-lg transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                isCartDisabled
                  ? "border border-mocha-border/40 text-mocha-text-muted bg-mocha-panel-raised/50 cursor-not-allowed opacity-60 shadow-none"
                  : "bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg hover:brightness-105 active:scale-[0.99]"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {isOutOfStock
                ? "Out of Stock"
                : isMaxInCart
                ? "Maximum Stock in Cart"
                : `Add ${qty > 1 ? `${qty}× ` : ""}to Cart`}
            </button>

            <Link
              href="/chat"
              prefetch={false}
              onClick={(e) => {
                e.preventDefault();
                toast("Support Chat is scheduled for Batch 3", "info");
              }}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 font-bold text-[12px] bg-transparent border border-mocha-border-strong text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel-raised rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              Contact Administrator
            </Link>

            {/* Anchored + BOM Popover */}
            <div className="relative">
              <button
                ref={bomTriggerRef}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBomOpen((v) => !v);
                }}
                aria-haspopup="dialog"
                aria-expanded={bomOpen}
                aria-label="Add component to BOM project"
                className={`w-full min-h-[44px] flex items-center justify-between px-4 font-bold text-[12px] rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                  bomOpen
                    ? "border-mocha-accent-secondary text-mocha-accent-secondary bg-mocha-panel-raised"
                    : "border-mocha-border-strong text-mocha-accent-secondary bg-gradient-to-b from-mocha-panel-raised to-mocha-panel hover:border-mocha-accent-secondary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                  Add to BOM Project
                </span>
                <span className="text-[10px] font-mono text-mocha-text-subtle">
                  {bomProjects.length} projects
                </span>
              </button>

              <BomChooserPopover
                isOpen={bomOpen}
                onClose={() => setBomOpen(false)}
                bomProjects={bomProjects}
                onAddToBomProject={(projId) => addToBomProject(projId, product.id)}
                triggerRef={bomTriggerRef}
                placement="bottom"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & About Tabs */}
      <SpecsTable product={product} />

      {/* Related Components Section */}
      {related.length > 0 && (
        <section aria-labelledby="related-products-heading" className="flex flex-col gap-3 mt-4">
          <h2 id="related-products-heading" className="text-sm font-bold uppercase tracking-wider text-mocha-text-muted">
            Related {product.category}
          </h2>
          {/* Desktop Product Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {related.map((p, idx) => (
              <ProductCard
                key={p.id}
                product={p}
                align={idx % 4 === 0 ? "left" : "right"}
                cartCount={cart[p.id] ?? 0}
                onCart={() => addToCart(p.id)}
                onAddToBomProject={(projId) => addToBomProject(projId, p.id)}
                bomProjects={bomProjects}
              />
            ))}
          </div>

          {/* Mobile Product Grid */}
          <div className="grid md:hidden grid-cols-2 gap-2.5">
            {related.map((p, idx) => (
              <MobileProductCard
                key={p.id}
                product={p}
                align={idx % 2 === 0 ? "left" : "right"}
                cartCount={cart[p.id] ?? 0}
                onCart={() => addToCart(p.id)}
                onAddToBomProject={(projId) => addToBomProject(projId, p.id)}
                bomProjects={bomProjects}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
