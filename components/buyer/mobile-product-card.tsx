"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product, BomProject } from "@/types/product";
import { StockBadge } from "@/components/ui/badge";
import { BomChooserPopover } from "./bom-chooser-popover";
import { useCartFeedback } from "./cart-feedback";

interface MobileProductCardProps {
  product: Product;
  cartCount?: number;
  onCart: () => boolean;
  onAddToBomProject?: (projectId: string) => void;
  bomProjects?: BomProject[];
  align?: "left" | "right" | "auto";
}

export function MobileProductCard({
  product,
  cartCount = 0,
  onCart,
  onAddToBomProject,
  bomProjects = [],
  align = "left",
}: MobileProductCardProps) {
  const [bomOpen, setBomOpen] = useState(false);
  const bomTriggerRef = useRef<HTMLButtonElement>(null);
  const { flyToCart } = useCartFeedback();

  const formatPrice = (price: number) => {
    return `₱${price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  };

  const isOutOfStock = product.stock <= 0;
  const isMaxInCart = cartCount >= product.stock;
  const isCartDisabled = isOutOfStock || isMaxInCart;

  return (
    <div data-cart-source className="relative flex flex-col bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border rounded-[22px] shadow-[0_12px_30px_rgba(0,0,0,0.14)]">
      <Link
        href={`/products/${product.id}`}
        aria-label={`View details for ${product.name}`}
        className="relative h-44 bg-mocha-bg-secondary rounded-t-[22px] overflow-hidden block focus-visible:outline-2 focus-visible:outline-mocha-accent"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 33vw"
          className="object-cover"
        />
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
      </Link>

      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#89B4FA] truncate">
          {product.category || "Component"}
        </p>
        <Link
          href={`/products/${product.id}`}
          className="text-xs font-semibold leading-snug line-clamp-2 text-mocha-text hover:text-mocha-accent transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent rounded"
        >
          {product.name}
        </Link>
        <p className="text-[9px] font-mono text-mocha-text-subtle">
          {product.sku}
        </p>

        <div className="flex items-baseline justify-between mt-auto pt-1">
          <span className="text-sm font-bold font-mono tracking-tight text-mocha-accent">
            {formatPrice(product.price)}
          </span>
          <span className="text-[9px] font-mono text-mocha-text-subtle">
            {isOutOfStock ? "Out of stock" : `${product.stock} in stock`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
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
            className={`flex-1 min-h-[44px] text-xs font-bold flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
              isCartDisabled
                ? "border-mocha-border/40 text-mocha-text-muted/60 bg-mocha-panel-high/40 cursor-not-allowed opacity-60"
                : "border-mocha-border-strong text-mocha-accent bg-gradient-to-b from-mocha-panel-raised to-mocha-panel hover:brightness-110 active:scale-95 shadow-sm"
            }`}
          >
            {isOutOfStock ? (
              "Sold Out"
            ) : isMaxInCart ? (
              "Max in Cart"
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-bold leading-none">+</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </span>
            )}
          </button>

          {onAddToBomProject && bomProjects.length > 0 && (
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
                className={`min-h-[44px] px-3 flex items-center justify-center text-xs font-bold rounded-xl border whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent ${
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
          )}
        </div>
      </div>
    </div>
  );
}
