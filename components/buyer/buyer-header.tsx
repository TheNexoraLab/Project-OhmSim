"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { useBom } from "@/hooks/use-bom";
import { toast } from "@/components/ui/toast";

export function BuyerHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const { cartTotal } = useCart();
  const { bomCount } = useBom();

  // Synchronize visible search input text with active URL query q
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/products");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    router.push("/products");
  };

  const navLinks = [
    {
      href: "/home",
      label: "Home",
      phase: "Batch 1",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/products",
      label: "Catalog",
      phase: "Batch 1",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
    },
    {
      href: "/bom",
      label: "BOM",
      phase: "Batch 2",
      badge: bomCount,
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        </svg>
      ),
    },
    {
      href: "/orders",
      label: "Orders",
      phase: "Batch 3",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      href: "/chat",
      label: "Chat",
      phase: "Batch 3",
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <header className="hidden md:flex items-center gap-2 lg:gap-3 px-3 lg:px-4 h-[64px] shrink-0 sticky top-0 z-30 w-full max-w-full overflow-hidden bg-mocha-bg-secondary/92 backdrop-blur-[20px] border-b border-mocha-border shadow-[0_1px_8px_rgba(0,0,0,0.32)]">
      {/* Brand Logo */}
      <Link
        href="/home"
        aria-label="OhmSim Home"
        className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-mocha-accent rounded-lg p-1 min-h-[44px]"
      >
        <Image
          src="/logos/ohmsim-logo.png"
          alt="OhmSim"
          width={112}
          height={36}
          priority
          className="h-8 w-auto object-contain"
        />
      </Link>

      <div className="w-px h-6 mx-1 shrink-0 bg-mocha-border" />

      {/* Main Navigation Bar */}
      <nav className="flex items-center gap-1" aria-label="Buyer Primary Navigation">
        {navLinks.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
          const isImplemented = item.href === "/home" || item.href === "/products" || item.href === "/bom";
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={isImplemented}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                if (!isImplemented) {
                  e.preventDefault();
                  toast(`${item.label} is scheduled for ${item.phase}`, "info");
                }
              }}
              className={`relative flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-[11px] font-bold min-h-[40px] transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                isActive
                  ? "bg-mocha-accent/15 text-mocha-accent border border-mocha-accent/25"
                  : "text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-accent/5 border border-transparent"
              } ${item.phase !== "Batch 1" && item.phase !== "Batch 2" ? "hidden xl:flex" : ""}`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="w-4 h-4 rounded-full text-[8px] font-extrabold flex items-center justify-center shrink-0 bg-mocha-accent text-mocha-bg">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="w-px h-6 mx-1 shrink-0 bg-mocha-border" />

      {/* Search Input with accessible label */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 flex-1 min-w-0 max-w-[160px] lg:max-w-xs bg-mocha-bg border border-mocha-border rounded-xl focus-within:border-mocha-border-strong transition-colors min-h-[40px]"
        >
          <label htmlFor="buyer-desktop-search" className="sr-only">
            Search components or SKU
          </label>
          <svg className="w-4 h-4 text-mocha-text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            id="buyer-desktop-search"
            type="search"
            placeholder="Search components, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-[12px] text-mocha-text placeholder-mocha-text-subtle outline-none min-w-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search query"
              className="text-[10px] text-mocha-text-muted hover:text-mocha-text px-1 py-0.5"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Right Icons: Notifications, Profile, Cart with >= 44x44px touch targets */}
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <Link
          href="/notifications"
          prefetch={false}
          onClick={(e) => {
            e.preventDefault();
            toast("Notifications are scheduled for Batch 3", "info");
          }}
          aria-label="View notifications"
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent transition-colors rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full text-[7.5px] font-bold text-mocha-bg bg-mocha-accent flex items-center justify-center pointer-events-none">
            1
          </span>
        </Link>

        <Link
          href="/profile"
          prefetch={false}
          onClick={(e) => {
            e.preventDefault();
            toast("Profile is scheduled for Batch 4", "info");
          }}
          aria-label="View profile"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent transition-colors rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </Link>

        <Link
          href="/cart"
          aria-label="View shopping cart"
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent transition-colors rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartTotal > 0 && (
            <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full text-[7.5px] font-extrabold text-mocha-bg bg-mocha-accent flex items-center justify-center shadow-sm pointer-events-none">
              {cartTotal}
            </span>
          )}
        </Link>

        <div className="w-px h-5 mx-1 shrink-0 bg-mocha-border" />

        <Link
          href="/"
          className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold bg-gradient-to-b from-mocha-panel-raised to-mocha-panel border border-mocha-border-strong text-mocha-text-muted hover:border-mocha-danger hover:text-mocha-danger transition-all focus-visible:outline-2 focus-visible:outline-mocha-danger"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Exit Store
        </Link>
      </div>
    </header>
  );
}
