"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { getButtonClasses } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { ADMIN_NAV_ITEMS } from "@/components/admin/admin-sidebar";

export interface AdminTopbarProps {
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

function getSectionMeta(pathname: string): {
  title: string;
  segmentLabel: string;
} {
  if (pathname === "/admin") {
    return { title: "Dashboard", segmentLabel: "Overview & Telemetry" };
  }

  const matched = ADMIN_NAV_ITEMS.find(
    (item) =>
      item.href !== "/admin" &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`))
  );

  if (matched) {
    return { title: matched.label, segmentLabel: matched.label };
  }

  const rawSegment = pathname.replace(/^\/admin\/?/, "").split("/")[0] || "Dashboard";
  const formatted =
    rawSegment.charAt(0).toUpperCase() + rawSegment.slice(1).replace(/-/g, " ");
  return { title: formatted, segmentLabel: formatted };
}

export function AdminTopbar({
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}: AdminTopbarProps) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const { title, segmentLabel } = getSectionMeta(pathname);

  const handleSimulatedLogout = () => {
    toast("Simulated logout complete for Admin Nexora.", "info");
    router.push("/login");
  };

  return (
    <header
      data-testid="admin-topbar"
      className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-[#181825]/95 backdrop-blur-md border-b border-[#313244] flex items-center justify-between gap-3 shrink-0"
    >
      {/* Left: Mobile Hamburger + Breadcrumb / Current Section Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-label="Toggle admin navigation menu"
          aria-expanded={isMobileMenuOpen}
          data-testid="admin-mobile-menu-button"
          className="lg:hidden min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl bg-[#1E1E2E] border border-[#313244] text-[#CDD6F4] hover:border-[#89B4FA] hover:text-[#89B4FA] transition-colors shrink-0"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>

        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-mono text-[#A6ADC8]"
          >
            <Link
              href="/admin"
              className="hover:text-[#89B4FA] transition-colors rounded-xs"
            >
              Admin
            </Link>
            <span aria-hidden="true" className="text-[#45475A]">
              /
            </span>
            <span className="text-[#89B4FA] font-semibold truncate">
              {title}
            </span>
            <span
              aria-hidden="true"
              className="hidden md:inline text-[#45475A]"
            >
              ·
            </span>
            <span className="hidden md:inline text-[#BAC2DE] truncate">
              {segmentLabel}
            </span>
          </nav>

          <p className="text-sm sm:text-base font-bold text-[#CDD6F4] leading-tight truncate">
            {title}
          </p>
        </div>
      </div>

      {/* Right: Storefront Link + Admin Profile Chip + Simulated Logout */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <a
          href="/home"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="view-storefront-link"
          className={getButtonClasses(
            "outline",
            "small",
            "gap-1.5 text-xs border-[#45475A] text-[#CDD6F4] hover:border-[#89B4FA] hover:text-[#89B4FA]"
          )}
        >
          <span>View Storefront</span>
          <svg
            aria-hidden="true"
            className="w-3.5 h-3.5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>

        {/* Admin Profile Chip */}
        <div
          data-testid="admin-profile-chip"
          className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-[#1E1E2E] border border-[#313244]"
        >
          <div
            aria-hidden="true"
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#89B4FA] to-[#94E2D5] text-[#11111B] font-mono text-xs font-extrabold flex items-center justify-center shrink-0"
          >
            AN
          </div>

          <div className="hidden sm:flex flex-col min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#CDD6F4] leading-none">
                Admin Nexora
              </span>
              <Badge
                variant="secondary"
                className="text-[9px] font-mono px-1.5 py-0 uppercase"
              >
                ROOT
              </Badge>
            </div>
            <span className="text-[10px] font-mono text-[#A6ADC8] mt-0.5 leading-none">
              ops@nexoralabs.ph
            </span>
          </div>

          <button
            type="button"
            onClick={handleSimulatedLogout}
            aria-label="Log out Admin Nexora"
            title="Simulated Logout"
            data-testid="admin-logout-button"
            className="min-w-[44px] min-h-[36px] px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#BAC2DE] hover:text-[#F38BA8] hover:bg-[#F38BA8]/12 border border-transparent hover:border-[#F38BA8]/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
