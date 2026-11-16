"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Widget4Icon,
  BoxMinimalisticIcon,
  Widget2Icon,
  ArchiveCheckIcon,
  BillListIcon,
  UsersGroupTwoRoundedIcon,
  ChatRoundDotsIcon,
  Chart2Icon,
  BellIcon,
  SettingsIcon,
} from "@solar-icons/react/linear";

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
    icon: <Widget4Icon size={18} className="shrink-0" />,
  },
  {
    label: "Products",
    href: "/admin/products",
    icon: <BoxMinimalisticIcon size={18} className="shrink-0" />,
  },
  {
    label: "Categories",
    href: "/admin/categories",
    icon: <Widget2Icon size={18} className="shrink-0" />,
  },
  {
    label: "Inventory",
    href: "/admin/inventory",
    badge: "2 Low",
    icon: <ArchiveCheckIcon size={18} className="shrink-0" />,
  },
  {
    label: "Orders",
    href: "/admin/orders",
    icon: <BillListIcon size={18} className="shrink-0" />,
  },
  {
    label: "Customers",
    href: "/admin/customers",
    icon: <UsersGroupTwoRoundedIcon size={18} className="shrink-0" />,
  },
  {
    label: "Support Chat",
    href: "/admin/chat",
    badge: "3",
    icon: <ChatRoundDotsIcon size={18} className="shrink-0" />,
  },
  {
    label: "Sales Reports",
    href: "/admin/reports",
    icon: <Chart2Icon size={18} className="shrink-0" />,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: <BellIcon size={18} className="shrink-0" />,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <SettingsIcon size={18} className="shrink-0" />,
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
      <div className="h-16 px-4 flex items-center justify-between gap-2 shrink-0">
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

      {/* Navigation Links (All 10 required links) */}
      <nav
        aria-label="Admin Sidebar Navigation"
        className="flex-1 overflow-y-auto px-2 py-2 space-y-1"
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
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#A6E3A1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A6E3A1]" />
            Online
          </span>
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
