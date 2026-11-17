"use client";

import React, { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { useBom } from "@/hooks/use-bom";
import {
  getProducts,
  getProductsSync,
  getFeaturedProducts,
  getFeaturedProductsSync,
} from "@/services/catalog-service";
import { ProductCard } from "@/components/buyer/product-card";
import { MobileProductCard } from "@/components/buyer/mobile-product-card";

export default function BuyerHomePage() {
  const { cart, addToCart, cartTotal } = useCart();
  const { bomProjects, addToBomProject } = useBom();

  // Initialized with verified sync fixtures, hydrated live from backend APIs
  const [allProducts, setAllProducts] = useState(() => getProductsSync());
  const [featured, setFeatured] = useState(() => getFeaturedProductsSync(4));

  useEffect(() => {
    let isMounted = true;
    getProducts()
      .then((prods) => {
        if (isMounted && prods.length > 0) setAllProducts(prods);
      })
      .catch(() => {});

    getFeaturedProducts(4)
      .then((feat) => {
        if (isMounted && feat.length > 0) setFeatured(feat);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = [
    {
      label: "Products Available",
      value: allProducts.length,
      color: "text-mocha-accent",
    },
    {
      label: "Cart Items",
      value: cartTotal,
      color: "text-mocha-accent",
    },
    {
      label: "BOM Projects",
      value: bomProjects.length,
      color: "text-mocha-accent-secondary",
    },
  ];

  return (
    <div data-buyer-home className="flex-1 w-full p-3 sm:p-6 flex flex-col bg-[image:var(--gradient-page)]">
      {/* Welcome Heading */}
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight text-mocha-text">
          Welcome back!
        </h1>
        <p className="text-sm mt-1 text-mocha-text-muted">
          Browse electronic components for your next project.
        </p>
      </div>

      {/* 3 Metric Cards Grid (No Carousel) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {stats.map((s) => (
          <div
            key={s.label}
            id={`metric-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
            className="min-w-0 p-2.5 sm:p-4 rounded-xl bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border shadow-[0_12px_30px_rgba(0,0,0,0.14)]"
          >
            <p className={`text-xl sm:text-2xl font-bold font-mono ${s.color}`}>
              {s.value}
            </p>
            <p className="text-[11px] mt-1 text-mocha-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Featured Components Grid (No Carousel, exactly 4 items) */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-mocha-text-muted">
          Featured Components
        </h2>
      </div>

      {/* Desktop Product Grid */}
      <div data-home-featured className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {featured.map((p, idx) => (
          <ProductCard
            key={p.id}
            product={p}
            variant="home"
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
        {featured.map((p, idx) => (
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
    </div>
  );
}
