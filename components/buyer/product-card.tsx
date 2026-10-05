"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, BomProject } from "@/types/product";
import { StockBadge } from "@/components/ui/badge";
import { BomChooserPopover } from "./bom-chooser-popover";
import styles from "./home-product-card.module.css";
import { useCartFeedback } from "./cart-feedback";

interface ProductCardProps {
  product: Product;
  cartCount: number;
  onCart: () => boolean;
  onAddToBomProject: (projectId: string) => void;
  bomProjects: BomProject[];
  align?: "left" | "right" | "auto";
  variant?: "default" | "home";
}

export function ProductCard({
  product,
  cartCount,
  onCart,
  onAddToBomProject,
  bomProjects,
  align = "auto",
  variant = "default",
}: ProductCardProps) {
  const [bomOpen, setBomOpen] = useState(false);
  const bomTriggerRef = useRef<HTMLButtonElement>(null);
  const { flyToCart } = useCartFeedback();

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = cartCount >= product.stock;
  const isCartDisabled = isOutOfStock || isMaxInCart;
  const isHome = variant === "home";

  return (
    <div data-cart-source className="group relative flex flex-col bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border hover:border-mocha-border-strong rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.14)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-300">
      {/* Product Image Well — overflow-hidden localized here to prevent clipping outer popovers */}
      <div className="relative h-[138px] bg-mocha-bg-secondary rounded-t-[22px] overflow-hidden shrink-0">
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 block focus-visible:outline-2 focus-visible:outline-mocha-accent"
          aria-label={`View details for ${product.name}`}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-[1.04] transition-all duration-500 ease-out"
          />
        </Link>
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <StockBadge status={product.status} />
        </div>
        {cartCount > 0 && (
          <div
            aria-label={`${cartCount} in cart`}
            className="absolute top-2 left-2 z-10 w-5 h-5 rounded-full text-[9px] font-extrabold text-mocha-bg bg-mocha-accent flex items-center justify-center shadow-md pointer-events-none"
          >
            {cartCount}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={`p-3 flex flex-col flex-1 ${isHome ? "gap-0.5" : "gap-1"}`}>
        <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-mocha-accent truncate">
          {product.label}
        </p>
        <Link
          href={`/products/${product.id}`}
          className={`${isHome ? "text-[11px] mt-0.5" : "text-[12px]"} font-semibold leading-snug line-clamp-2 flex-1 text-mocha-text hover:text-mocha-accent transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent rounded`}
        >
          {product.name}
        </Link>
        <p className="text-[9px] font-mono text-mocha-text-subtle">
          {product.sku}
        </p>

        <div className={`flex items-baseline justify-between ${isHome ? "mt-2" : "mt-1"}`}>
          <p className={`${isHome ? "text-[13px]" : "text-[14px]"} font-bold font-mono tracking-tight text-mocha-accent`}>
            {formatPrice(product.price)}
          </p>
          {!isHome && <span className="text-[9.5px] font-mono text-mocha-text-subtle">
            {isOutOfStock ? "Out of stock" : `${product.stock} in stock`}
          </span>}
        </div>

        {/* Action Button Row — accessible >=44px effective touch targets without text truncation */}
        <div className="flex items-center gap-1.5 mt-2">
          <Link
            href={`/products/${product.id}`}
            aria-label={`View details for ${product.name}`}
            className={`flex-1 min-h-[38px] sm:min-h-[44px] flex items-center justify-center text-[10px] sm:text-[11px] font-bold px-2 rounded-xl border border-mocha-border-strong text-mocha-text bg-mocha-panel-high hover:border-mocha-accent hover:text-mocha-accent transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent ${isHome ? `${styles.action} ${styles.details}` : ""}`}
          >
            {isHome ? "View Details" : "Details"}
          </Link>

          <button
            type="button"
            onClick={event => {
              if (onCart()) flyToCart(event.currentTarget, product.image);
            }}
            disabled={isCartDisabled}
            aria-disabled={isCartDisabled}
            aria-label={
              isOutOfStock
                ? `${product.name} is out of stock`
                : isMaxInCart
                ? `Maximum stock reached for ${product.name}`
                : `Add ${product.name} to cart`
            }
            className={`flex-1 min-h-[38px] sm:min-h-[44px] flex items-center justify-center text-[10px] sm:text-[11px] font-bold px-2 rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${isHome ? `${styles.action} ${styles.cart}` : ""} ${
              isCartDisabled
                ? "border-mocha-border/40 text-mocha-text-muted/60 bg-mocha-panel-high/40 cursor-not-allowed opacity-60"
                : "border-mocha-border-strong text-mocha-accent bg-gradient-to-b from-mocha-panel-raised to-mocha-panel hover:border-mocha-accent hover:brightness-110 active:scale-95 shadow-sm"
            }`}
          >
            {isOutOfStock ? "Sold Out" : isMaxInCart ? "Max in Cart" : isHome ? "Add to Cart" : "+ Cart"}
          </button>

          {/* Inline Anchored BOM Chooser Popover */}
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
              aria-label={`Add ${product.name} to BOM project`}
              className={`min-h-[38px] sm:min-h-[44px] px-2.5 flex items-center justify-center text-[10px] sm:text-[11px] font-bold rounded-xl border whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent ${isHome ? `${styles.action} ${styles.bom}` : ""} ${
                bomOpen
                  ? "border-mocha-accent-secondary text-mocha-accent-secondary bg-mocha-panel-raised"
                  : "border-mocha-border-strong text-mocha-accent-secondary bg-mocha-panel-high hover:border-mocha-accent-secondary"
              }`}
            >
              + BOM
            </button>

            <BomChooserPopover
              isOpen={bomOpen}
              onClose={() => setBomOpen(false)}
              bomProjects={bomProjects}
              onAddToBomProject={onAddToBomProject}
              triggerRef={bomTriggerRef}
              placement="top"
              align={align}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
