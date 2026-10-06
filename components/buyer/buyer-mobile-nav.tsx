"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { toast } from "@/components/ui/toast";
import { CartFeedbackIcon } from "./cart-feedback";
import { useNotificationCount } from "./use-notification-count";

export function BuyerMobileHeader() {
  const unreadCount = useNotificationCount();
  return (
    <header className="flex md:hidden items-center justify-between px-3 h-14 shrink-0 sticky top-0 z-30 bg-mocha-bg-secondary/95 backdrop-blur-[20px] border-b border-mocha-border shadow-[0_1px_8px_rgba(0,0,0,0.32)]">
      <Link
        href="/home"
        aria-label="OhmSim Home"
        className="flex items-center min-h-[44px] min-w-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent rounded-lg"
      >
        <Image
          src="/logos/ohmsim-logo.png"
          alt="OhmSim"
          width={96}
          height={30}
          priority
          className="h-7 w-auto object-contain"
        />
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/products"
          aria-label="Search catalog"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </Link>
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative min-w-[44px] min-h-[44px] flex items-center justify-center text-mocha-text-muted hover:text-mocha-accent rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span data-notification-count={unreadCount} className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full text-[7px] font-extrabold text-mocha-bg bg-mocha-accent flex items-center justify-center pointer-events-none">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}

export function BuyerMobileBottomNav() {
  const pathname = usePathname();
  const { cartTotal } = useCart();

  const tabs = [
    {
      href: "/home",
      label: "Home",
      phase: "Batch 1",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/products",
      label: "Search",
      phase: "Batch 1",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      ),
    },
    {
      href: "/cart",
      label: "Cart",
      phase: "Batch 2",
      badge: cartTotal,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
    },
    {
      href: "/orders",
      label: "Orders",
      phase: "Batch 3",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      href: "/profile",
      label: "Profile",
      phase: "Batch 4",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center bg-mocha-bg-secondary/95 backdrop-blur-[20px] border-t border-mocha-border shadow-[0_-1px_16px_rgba(0,0,0,0.4)]"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || (tab.href !== "/home" && pathname.startsWith(tab.href));
        const isImplemented =
          tab.href === "/home" ||
          tab.href === "/products" ||
          tab.href === "/cart" ||
          tab.href === "/orders" ||
          tab.href === "/profile";
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={isImplemented}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => {
              if (!isImplemented) {
                e.preventDefault();
                toast(`${tab.label} is scheduled for ${tab.phase}`, "info");
              }
            }}
            className={`flex-1 min-h-[52px] flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors relative focus-visible:outline-2 focus-visible:outline-mocha-accent ${
              isActive ? "text-mocha-accent" : "text-mocha-text-muted hover:text-mocha-text"
            }`}
          >
            <span className="relative">
              {tab.href === "/cart" ? <CartFeedbackIcon target="mobile">{tab.icon}</CartFeedbackIcon> : tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span data-cart-count={tab.badge} className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[7px] font-extrabold text-mocha-bg bg-mocha-accent flex items-center justify-center pointer-events-none">
                  {tab.badge}
                </span>
              )}
            </span>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
