"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export interface AdminNavItem {
  label: string;
  href: string;
  badge?: string;
  icon: React.ReactNode;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    badge: "2 Low",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Support Chat",
    href: "/admin/chat",
    badge: "3",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Sales Reports",
    href: "/admin/reports",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  pathname,
  onNavigate,
  showCloseButton = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  showCloseButton?: boolean;
}) {
  return (
    <div className="flex flex-col h-full w-full bg-[#181825] text-[#CDD6F4] select-none">
      {/* Sidebar Header: OhmSim logo with distinct ADMIN badge */}
      <div className="h-16 px-4 flex items-center justify-between gap-2 border-b border-[#313244] shrink-0">
        <Link
          href="/admin"
          onClick={onNavigate}
          aria-label="OhmSim Admin Dashboard"
          className="flex items-center gap-2.5 min-h-[44px] rounded-lg focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
        >
          <Image
            src="/logos/ohmsim-logo.png"
            alt="OhmSim"
            width={108}
            height={34}
            priority
            className="h-7 w-auto object-contain"
          />
          <Badge
            variant="primary"
            className="font-mono text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-[#89B4FA]/15 text-[#89B4FA] border-[#89B4FA]/40"
          >
            ADMIN
          </Badge>
        </Link>

        {showCloseButton && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Close navigation drawer"
            className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-[#BAC2DE] hover:text-[#CDD6F4] hover:bg-[#313244]/50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Console Section Label */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#A6ADC8]">
          Operations Console
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#94E2D5]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#A6E3A1]" />
          v1.0
        </span>
      </div>

      {/* Navigation Links (All 10 required links) */}
      <nav
        aria-label="Admin Sidebar Navigation"
        className="flex-1 overflow-y-auto px-2 py-1 space-y-1"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              data-admin-nav-link={item.href}
              data-active={isActive ? "true" : "false"}
              style={
                isActive
                  ? {
                      backgroundColor: "rgba(137, 180, 250, 0.14)",
                      color: "#89B4FA",
                      borderLeft: "3px solid #89B4FA",
                    }
                  : {
                      borderLeft: "3px solid transparent",
                    }
              }
              className={`group flex items-center justify-between gap-3 px-3 py-2.5 min-h-[44px] rounded-r-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-[rgba(137,180,250,0.14)] text-[#89B4FA] border-l-[3px] border-[#89B4FA] shadow-[inset_0_1px_0_rgba(137,180,250,0.12)]"
                  : "text-[#BAC2DE] hover:text-[#CDD6F4] hover:bg-[#1E1E2E] border-l-[3px] border-transparent"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span
                  className={
                    isActive
                      ? "text-[#89B4FA]"
                      : "text-[#A6ADC8] group-hover:text-[#CDD6F4] transition-colors"
                  }
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </span>

              {item.badge && (
                <span
                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                    item.badge.includes("Low")
                      ? "bg-[#F9E2AF]/12 text-[#F9E2AF] border-[#F9E2AF]/30"
                      : "bg-[#89B4FA]/15 text-[#89B4FA] border-[#89B4FA]/30"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer: Terminal Telemetry Status */}
      <div className="p-3.5 m-3 rounded-xl bg-[#1E1E2E] border border-[#313244] shrink-0">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#BAC2DE]">
          <span>REGION III HUB</span>
          <span className="text-[#A6E3A1] font-bold">ONLINE</span>
        </div>
        <p className="mt-1 text-[10px] text-[#A6ADC8] leading-relaxed">
          Central Luzon Pickup &amp; COD Fulfillment Terminal
        </p>
      </div>
    </div>
  );
}

export function AdminSidebar({
  isMobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname() || "/admin";

  useEffect(() => {
    if (!isMobileOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseMobile?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  return (
    <>
      {/* Desktop Persistent 250px Sidebar */}
      <aside
        data-testid="admin-desktop-sidebar"
        aria-label="Administrator Navigation"
        className="hidden lg:flex lg:flex-col w-[250px] shrink-0 bg-[#181825] border-r border-[#313244] min-h-screen sticky top-0 h-screen"
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile (< 1024px) Slide-Over Drawer */}
      {isMobileOpen && (
        <div
          data-testid="admin-mobile-drawer-overlay"
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Administrator Navigation"
        >
          {/* Backdrop */}
          <div
            aria-hidden="true"
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-over panel (250px) */}
          <div
            data-testid="admin-mobile-sidebar"
            className="relative z-10 w-[250px] max-w-[82vw] h-full bg-[#181825] border-r border-[#313244] shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col"
          >
            <SidebarContent
              pathname={pathname}
              onNavigate={onCloseMobile}
              showCloseButton
            />
          </div>
        </div>
      )}
    </>
  );
}
