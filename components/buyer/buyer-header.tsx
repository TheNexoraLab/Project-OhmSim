"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Home2Icon,
  Widget4Icon,
  DocumentsIcon,
  BoxMinimalisticIcon,
  ChatRoundDotsIcon,
  MagnifierIcon,
  BellIcon,
  UserCircleIcon,
  CartLarge2Icon,
  Logout2Icon,
} from "@solar-icons/react/linear";
import { useCart } from "@/hooks/use-cart";
import { useBom } from "@/hooks/use-bom";
import { toast } from "@/components/ui/toast";
import styles from "./buyer-header.module.css";
import { CartFeedbackIcon } from "./cart-feedback";
import { useNotificationCount } from "./use-notification-count";

export function BuyerHeader() {
  const unreadCount = useNotificationCount();
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
      icon: <Home2Icon size={16} className="shrink-0" />,
    },
    {
      href: "/products",
      label: "Catalog",
      phase: "Batch 1",
      icon: <Widget4Icon size={16} className="shrink-0" />,
    },
    {
      href: "/bom",
      label: "BOM",
      phase: "Batch 2",
      badge: bomCount,
      icon: <DocumentsIcon size={16} className="shrink-0" />,
    },
    {
      href: "/orders",
      label: "Orders",
      phase: "Batch 3",
      icon: <BoxMinimalisticIcon size={16} className="shrink-0" />,
    },
    {
      href: "/chat",
      label: "Chat",
      phase: "Batch 3",
      icon: <ChatRoundDotsIcon size={16} className="shrink-0" />,
    },
  ];

  return (
    <header className="hidden md:flex items-center justify-between px-3 lg:px-6 h-[64px] shrink-0 sticky top-0 z-30 w-full max-w-full bg-mocha-bg-secondary/92 backdrop-blur-[20px] border-b border-mocha-border shadow-[0_1px_8px_rgba(0,0,0,0.32)]">
      {/* Left Cluster: Brand Logo + Primary Nav */}
      <div className="flex items-center gap-2.5 lg:gap-4 shrink-0">
        <Link
          href="/home"
          aria-label="OhmSim Home"
          className="flex flex-col items-start justify-center shrink-0 focus-visible:outline-2 focus-visible:outline-mocha-accent rounded-lg min-h-[44px]"
        >
          <Image
            src="/logos/ohmsim-logo.png"
            alt="OhmSim"
            width={112}
            height={36}
            priority
            className="h-8 w-auto object-contain"
          />
          <span className="text-[7px] uppercase tracking-[0.15em] leading-none mt-0.5 pl-0.5 text-mocha-accent/80">
            by NEXORA Labs
          </span>
        </Link>

        <div className="w-px h-6 shrink-0 bg-mocha-border" />

        {/* Main Navigation Bar */}
        <nav className="flex items-center gap-0.5 lg:gap-1" aria-label="Buyer Primary Navigation">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
            const isImplemented =
              item.href === "/home" ||
              item.href === "/products" ||
              item.href === "/bom" ||
              item.href === "/orders" ||
              item.href === "/chat";
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={isImplemented}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                onClick={(e) => {
                  if (!isImplemented) {
                    e.preventDefault();
                    toast(`${item.label} is scheduled for ${item.phase}`, "info");
                  }
                }}
                className={`relative flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 rounded-xl text-xs font-semibold min-h-[40px] justify-center transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                  isActive
                    ? "bg-[#89B4FA]/15 text-[#89B4FA] border border-[#89B4FA]/30 shadow-xs"
                    : "text-[#A6ADC8] hover:text-[#CDD6F4] hover:bg-[#1E1E2E] border border-transparent"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                      isActive
                        ? "bg-[#89B4FA] text-[#11111B]"
                        : "bg-[#313244] text-[#BAC2DE]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Center: Search Box (Prominently Widened & Centered in Header) */}
      <div className="flex-1 flex items-center justify-center min-w-0 mx-2 lg:mx-6 max-w-[170px] lg:max-w-[460px] xl:max-w-[560px]">
        <form
          onSubmit={handleSearchSubmit}
          className="group flex items-center gap-2 px-3 py-1.5 w-full bg-[#181825] border border-[#313244] rounded-xl focus-within:border-[#89B4FA] focus-within:ring-2 focus-within:ring-[#89B4FA]/20 transition-all min-h-[38px] shadow-xs"
        >
          <label htmlFor="buyer-desktop-search" className="sr-only">
            Search components or SKU
          </label>
          <MagnifierIcon size={16} className="text-[#A6ADC8] group-focus-within:text-[#89B4FA] shrink-0 transition-colors" />
          <input
            id="buyer-desktop-search"
            type="search"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            placeholder="Search components, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ outline: "none", boxShadow: "none" }}
            className="flex-1 bg-transparent text-xs text-[#CDD6F4] placeholder-[#6C7086] border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none min-w-0 [appearance:textfield] [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search query"
              className="text-xs text-[#A6ADC8] hover:text-[#CDD6F4] px-1 py-0.5 rounded transition-colors"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Right Cluster: Action Icons (Notifications, Profile, Cart, Exit) */}
      <div className="flex items-center gap-1 lg:gap-2.5 shrink-0">
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative min-w-[36px] lg:min-w-[38px] min-h-[36px] lg:min-h-[38px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent transition-colors rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <BellIcon size={18} />
          {unreadCount > 0 && (
            <span data-notification-count={unreadCount} className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full text-[7.5px] font-bold text-mocha-bg bg-mocha-accent flex items-center justify-center pointer-events-none">
              {unreadCount}
            </span>
          )}
        </Link>

        <Link
          href="/profile"
          aria-label="View profile"
          aria-current={pathname === "/profile" ? "page" : undefined}
          className="min-w-[36px] lg:min-w-[38px] min-h-[36px] lg:min-h-[38px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent transition-colors rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <UserCircleIcon size={18} />
        </Link>

        <Link
          href="/cart"
          aria-label="View shopping cart"
          className="relative min-w-[36px] lg:min-w-[38px] min-h-[36px] lg:min-h-[38px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent transition-colors rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <CartFeedbackIcon target="desktop">
            <CartLarge2Icon size={18} />
          </CartFeedbackIcon>
          {cartTotal > 0 && (
            <span data-cart-count={cartTotal} className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full text-[7.5px] font-extrabold text-mocha-bg bg-mocha-accent flex items-center justify-center shadow-sm pointer-events-none">
              {cartTotal}
            </span>
          )}
        </Link>

        <div className="w-px h-5 mx-0.5 shrink-0 bg-mocha-border" />

        <Link
          href="/"
          className={`${styles.exitLink} min-h-[38px] flex items-center gap-1.5 px-2 lg:px-3 py-1.5 rounded-xl text-xs font-semibold text-mocha-text-muted hover:text-mocha-danger transition-all focus-visible:outline-2 focus-visible:outline-mocha-danger`}
        >
          <Logout2Icon size={15} className="shrink-0" />
          Exit Store
        </Link>
      </div>
    </header>
  );
}
