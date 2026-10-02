"use client";

import React, { useState, useMemo, Suspense, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { Category, ProductSortOption } from "@/types/product";
import { getProductsSync, getCategoriesSync } from "@/services/catalog-service";
import { useCart } from "@/hooks/use-cart";
import { useBom } from "@/hooks/use-bom";
import { ProductCard } from "@/components/buyer/product-card";
import { MobileProductCard } from "@/components/buyer/mobile-product-card";
import { FilterPanel } from "@/components/buyer/filter-panel";

function CatalogContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  const { cart, addToCart } = useCart();
  const { bomProjects, addToBomProject, addBomProject } = useBom();

  // Obtain typed data strictly through the approved service boundary
  const allProducts = useMemo(() => getProductsSync(), []);
  const categories = useMemo(() => getCategoriesSync(), []);

  // State synchronized with URL query
  const [search, setSearch] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [voltage, setVoltage] = useState<[number, number]>([3.3, 12]);
  const [resistance, setResistance] = useState<[number, number]>([10, 1000]);
  const [minStock, setMinStock] = useState(0);
  const [sortOption, setSortOption] = useState<ProductSortOption>("relevance");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Synchronize mounted search state on URL changes (header submissions, back/forward, direct links)
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearch(urlQuery);
  }

  // Synchronize search input changes with URL parameter
  const updateSearchQuery = useCallback(
    (newVal: string) => {
      setSearch(newVal);
      const params = new URLSearchParams(searchParams.toString());
      if (newVal.trim()) {
        params.set("q", newVal.trim());
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const clearFilters = useCallback(() => {
    setActiveCategory("All");
    setVoltage([3.3, 12]);
    setResistance([10, 1000]);
    setMinStock(0);
    setSearch("");
    setSortOption("relevance");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const isFiltered =
    activeCategory !== "All" ||
    search.trim().length > 0 ||
    voltage[0] > 3.3 ||
    voltage[1] < 12 ||
    resistance[0] > 10 ||
    resistance[1] < 1000 ||
    minStock > 0;

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      // Category filter
      if (activeCategory !== "All" && p.category !== activeCategory) {
        return false;
      }

      // Keyword Search (Name, SKU, or Brand)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBrand = p.brand?.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesBrand) return false;
      }

      // Voltage filter
      if (p.voltage < voltage[0] || p.voltage > voltage[1]) {
        return false;
      }

      // Resistance filter
      if (
        p.resistance !== null &&
        (p.resistance < resistance[0] || p.resistance > resistance[1])
      ) {
        return false;
      }

      // Stock threshold filter
      if (p.stock < minStock) {
        return false;
      }

      return true;
    });
  }, [allProducts, activeCategory, search, voltage, resistance, minStock]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortOption) {
      case "price-asc":
        return list.sort((a, b) => a.price - b.price);
      case "price-desc":
        return list.sort((a, b) => b.price - a.price);
      case "name-asc":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "stock-desc":
        return list.sort((a, b) => b.stock - a.stock);
      case "relevance":
      default:
        return list;
    }
  }, [filtered, sortOption]);

  return (
    <div className="flex-1 max-w-[1280px] w-full mx-auto p-3 sm:p-4 lg:p-6 flex flex-col gap-4">
      {/* Mobile Search Bar (Restored from handoff reference lines 3684-3693) */}
      <div className="md:hidden flex items-center gap-2 px-3.5 py-2 rounded-xl bg-mocha-bg-secondary border border-mocha-border focus-within:border-mocha-border-strong transition-colors min-h-[44px]">
        <label htmlFor="mobile-catalog-search" className="sr-only">
          Search components or SKU
        </label>
        <svg className="w-4 h-4 text-mocha-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          id="mobile-catalog-search"
          type="search"
          placeholder="Search components..."
          value={search}
          onChange={(e) => updateSearchQuery(e.target.value)}
          className="flex-1 bg-transparent text-sm text-mocha-text placeholder-mocha-text-subtle outline-none min-w-0"
        />
        {search && (
          <button
            type="button"
            onClick={() => updateSearchQuery("")}
            aria-label="Clear search input"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-xs text-mocha-text-muted hover:text-mocha-text rounded-lg"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Pills Header Row */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {categories.map((c) => {
          const isActive = activeCategory === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => setActiveCategory(c)}
              aria-pressed={isActive}
              className={`shrink-0 text-[11px] font-bold px-3.5 py-2 rounded-full min-h-[44px] transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                isActive
                  ? "bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg shadow-sm"
                  : "bg-mocha-panel-raised text-mocha-text-muted hover:text-mocha-text border border-mocha-border"
              }`}
            >
              {c}
            </button>
          );
        })}

        {/* Mobile Filter Toggle */}
        <button
          type="button"
          onClick={() => setMobileFilterOpen((v) => !v)}
          aria-expanded={mobileFilterOpen}
          aria-label="Toggle parametric filter drawer"
          className="md:hidden shrink-0 ml-auto text-[11px] font-bold px-3.5 py-2 min-h-[44px] flex items-center gap-1.5 text-mocha-text-muted border border-mocha-border rounded-full bg-mocha-panel-raised hover:text-mocha-text focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters {isFiltered && "•"}
        </button>
      </div>

      {/* Main Layout Area — flex-col on mobile (stacked), md:flex-row on desktop */}
      <div className="flex flex-col md:flex-row flex-1 gap-4 items-start w-full">
        {/* Left Sidebar Parametric Filter (Desktop) */}
        <FilterPanel
          idPrefix="desktop"
          voltage={voltage}
          onVoltage={setVoltage}
          resistance={resistance}
          onResistance={setResistance}
          minStock={minStock}
          onMinStock={setMinStock}
          bomProjects={bomProjects}
          onAddBomProject={addBomProject}
          className="hidden md:flex shrink-0 w-64"
        />

        {/* Mobile Filter Panel (Stacked vertically above grid when open, no horizontal crowding) */}
        {mobileFilterOpen && (
          <div className="md:hidden w-full mb-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <FilterPanel
              idPrefix="mobile"
              voltage={voltage}
              onVoltage={setVoltage}
              resistance={resistance}
              onResistance={setResistance}
              minStock={minStock}
              onMinStock={setMinStock}
              bomProjects={bomProjects}
              onAddBomProject={addBomProject}
              className="w-full"
            />
          </div>
        )}

        {/* Product Grid Area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          {/* Header Controls: Result Count & Functional Sort */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[11px] text-mocha-text-muted">
              Showing{" "}
              <span className="font-semibold font-mono text-mocha-accent">
                {sorted.length}
              </span>{" "}
              components
              {isFiltered && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-2 min-h-[44px] inline-flex items-center px-1.5 underline text-mocha-text-muted hover:text-mocha-accent transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent rounded"
                >
                  clear filters
                </button>
              )}
            </p>

            {/* Sort Select with Functional State */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="catalog-sort-select" className="text-[11px] text-mocha-text-subtle font-medium">
                Sort:
              </label>
              <select
                id="catalog-sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as ProductSortOption)}
                aria-label="Sort components by"
                className="text-[11px] min-h-[44px] px-2.5 py-1 bg-mocha-bg-secondary border border-mocha-border text-mocha-text rounded-xl outline-none cursor-pointer focus-visible:outline-2 focus-visible:outline-mocha-accent"
              >
                <option value="relevance">Relevance</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="stock-desc">Stock: Most Available</option>
              </select>
            </div>
          </div>

          {/* Cards Display */}
          {sorted.length > 0 ? (
            <>
              {/* Desktop Product Grid */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {sorted.map((p, idx) => (
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
                {sorted.map((p, idx) => (
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
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 bg-mocha-panel/40 border border-mocha-border rounded-2xl text-center">
              <div className="w-14 h-14 flex items-center justify-center text-2xl font-mono rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-text-subtle">
                Ω
              </div>
              <p className="text-sm font-medium text-mocha-text">No components match your filters</p>
              <p className="text-xs text-mocha-text-muted">
                Try widening your parametric ranges or clearing search keywords.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-2 text-xs font-semibold px-4 py-2.5 min-h-[44px] rounded-xl text-mocha-accent border border-mocha-border-strong bg-gradient-to-b from-mocha-panel-raised to-mocha-panel hover:border-mocha-accent transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuyerProductsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-mocha-text-muted">Loading catalog...</div>}>
      <CatalogContent />
    </Suspense>
  );
}
