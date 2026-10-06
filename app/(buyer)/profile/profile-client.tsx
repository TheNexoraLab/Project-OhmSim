"use client";

import React, { useSyncExternalStore, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  getProfileSnapshot,
  subscribeProfile,
  getAddressesSnapshot,
  subscribeAddresses,
} from "@/services/profile-service";
import type { ProfileTab } from "@/types/profile";
import { ProfilePersonalInfo } from "@/components/buyer/profile-personal-info";
import { ProfileStatsSidebar } from "@/components/buyer/profile-stats-sidebar";
import { ProfileAddressesTab } from "@/components/buyer/profile-addresses-tab";
import { ProfileSecurityTab } from "@/components/buyer/profile-security-tab";
import { ProfilePreferencesTab } from "@/components/buyer/profile-preferences-tab";

const VALID_TABS: ProfileTab[] = ["account", "addresses", "security", "preferences"];

interface TabItem {
  id: ProfileTab;
  label: string;
  badge?: string;
  icon: React.ReactNode;
}

const emptySubscribe = () => () => {};

export function ProfileClient() {
  const searchParams = useSearchParams();
  const profile = useSyncExternalStore(subscribeProfile, getProfileSnapshot, getProfileSnapshot);
  const addresses = useSyncExternalStore(subscribeAddresses, getAddressesSnapshot, getAddressesSnapshot);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Tab resolution with safe fallback and immediate local state
  const queryTab = searchParams.get("tab") as ProfileTab | null;
  const resolvedTab: ProfileTab = queryTab && VALID_TABS.includes(queryTab) ? queryTab : "account";
  const [prevQueryTab, setPrevQueryTab] = React.useState<ProfileTab | null>(queryTab);
  const [activeTab, setActiveTab] = React.useState<ProfileTab>(resolvedTab);

  if (queryTab !== prevQueryTab) {
    setPrevQueryTab(queryTab);
    setActiveTab(resolvedTab);
  }

  // Handle native popstate events (e.g. browser back/forward without reload)
  React.useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as ProfileTab | null;
      const target: ProfileTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : "account";
      setActiveTab(target);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Keep selected tab visible in horizontal scroll area without stealing focus; honor reduced motion
  React.useEffect(() => {
    const scrollTabIntoView = () => {
      const el = document.getElementById(`profile-tab-${activeTab}`);
      if (el) {
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    };
    scrollTabIntoView();
    const rafId = requestAnimationFrame(scrollTabIntoView);
    return () => cancelAnimationFrame(rafId);
  }, [activeTab]);

  const handleSelectTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/profile?tab=${tab}`);
    }
  };

  const tabs: TabItem[] = [
    {
      id: "account",
      label: "Account",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      ),
    },
    {
      id: "addresses",
      label: "Addresses",
      badge: `${addresses.length}`,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
    {
      id: "security",
      label: "Security",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: "preferences",
      label: "Preferences",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
        </svg>
      ),
    },
  ];

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      targetIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      targetIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      e.preventDefault();
      targetIndex = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      targetIndex = tabs.length - 1;
    }

    if (targetIndex >= 0) {
      const nextTab = tabs[targetIndex];
      handleSelectTab(nextTab.id);
      const el = document.getElementById(`profile-tab-${nextTab.id}`);
      el?.focus();
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  };

  const initials = `${profile.firstName?.[0] || "A"}${profile.lastName?.[0] || "R"}`.toUpperCase();

  return (
    <div
      data-hydrated={hydrated ? "true" : undefined}
      className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-6 bg-mocha-bg w-full"
    >
      {/* Profile Hero Header */}
      <div
        id="profile-hero-card"
        className="p-5 sm:p-6 rounded-[22px] bg-gradient-to-r from-mocha-panel to-mocha-bg-secondary border border-mocha-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 w-full"
      >
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          {/* Avatar Rounded Square */}
          <div
            id="profile-avatar-circle"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-mocha-accent to-mocha-accent-secondary text-mocha-bg font-bold text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-md font-mono"
          >
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            <h1 id="profile-full-name" className="text-lg sm:text-xl font-bold text-mocha-text tracking-tight truncate">
              {profile.firstName} {profile.lastName}
            </h1>
            <p id="profile-email-display" className="text-xs text-mocha-text-muted mt-0.5 truncate font-mono">
              {profile.email}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {profile.role && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-mocha-accent/15 text-mocha-accent border border-mocha-accent/30">
                  {profile.role}
                </span>
              )}
              {profile.company && (
                <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-mocha-panel-raised text-mocha-text-muted border border-mocha-border">
                  {profile.company}
                </span>
              )}
              <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-full bg-mocha-accent-secondary/15 text-mocha-accent-secondary border border-mocha-accent-secondary/30">
                Mock Buyer Account
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-mocha-border/60">
          <Link
            href="/orders"
            id="profile-my-orders-btn"
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold rounded-xl bg-mocha-panel-raised border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors min-h-[44px] flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            My Orders →
          </Link>
        </div>
      </div>

      {/* Tab Bar (Roving focus model, horizontally scrollable on mobile) */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Profile section tabs"
          className="flex items-center gap-1 p-1 rounded-[14px] bg-mocha-bg-secondary border border-mocha-border w-max min-w-full sm:min-w-0"
        >
          {tabs.map((t, idx) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                id={`profile-tab-${t.id}`}
                aria-selected={isActive}
                aria-controls={`profile-tabpanel-${t.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelectTab(t.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`px-4 py-2 text-xs font-bold rounded-[10px] transition-all flex items-center gap-2 shrink-0 min-h-[44px] focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                  isActive
                    ? "bg-mocha-panel-raised text-mocha-text border border-mocha-border-strong shadow-xs"
                    : "text-mocha-text-muted hover:text-mocha-text hover:bg-mocha-panel border border-transparent"
                }`}
              >
                <span className={isActive ? "text-mocha-accent" : "text-mocha-text-subtle"}>{t.icon}</span>
                <span>{t.label}</span>
                {t.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-mocha-bg/40 text-mocha-text font-extrabold" : "bg-mocha-bg text-mocha-text-muted"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div
        id={`profile-tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`profile-tab-${activeTab}`}
        tabIndex={0}
        className="w-full flex-1 flex flex-col outline-none"
      >
        {activeTab === "account" && (
          <div className="flex flex-col lg:flex-row gap-5 items-stretch lg:items-start w-full">
            <ProfilePersonalInfo />
            <ProfileStatsSidebar />
          </div>
        )}

        {activeTab === "addresses" && <ProfileAddressesTab />}

        {activeTab === "security" && <ProfileSecurityTab />}

        {activeTab === "preferences" && <ProfilePreferencesTab />}
      </div>
    </div>
  );
}
