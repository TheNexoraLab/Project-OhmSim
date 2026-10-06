"use client";

import React, { useSyncExternalStore } from "react";
import {
  getPreferencesSnapshot,
  subscribePreferences,
  updatePreferences,
} from "@/services/profile-service";
import { toast } from "@/components/ui/toast";

export function ProfilePreferencesTab() {
  const prefs = useSyncExternalStore(subscribePreferences, getPreferencesSnapshot, getPreferencesSnapshot);

  const handleToggle = (key: keyof typeof prefs, label: string) => {
    const nextVal = !prefs[key];
    updatePreferences({ [key]: nextVal });
    toast(`${label} ${nextVal ? "enabled" : "disabled"}`, "info");
  };

  const emailItems: { key: keyof typeof prefs; label: string; sub: string }[] = [
    {
      key: "emailOrders",
      label: "Order updates & shipping",
      sub: "Local preference for order and shipping notifications",
    },
    {
      key: "emailPromos",
      label: "Promotions & new arrivals",
      sub: "Local preference for new arrivals and product announcements",
    },
    {
      key: "emailStock",
      label: "Restock & low-stock alerts",
      sub: "Local preference for component inventory alerts",
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-[620px] w-full">
      {/* Email Notifications */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-mocha-text tracking-tight">Email Notifications</h2>
          <p className="text-xs text-mocha-text-muted mt-0.5">
            Preferences are saved locally in your browser and do not send outbound email
          </p>
        </div>

        <div className="divide-y divide-mocha-border">
          {emailItems.map((item) => (
            <div key={item.key} className="py-3 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs font-semibold text-mocha-text">{item.label}</p>
                <p className="text-[11px] text-mocha-text-muted mt-0.5">{item.sub}</p>
              </div>

              {/* Compact switch with 44px effective touch target */}
              <button
                type="button"
                role="switch"
                aria-checked={prefs[item.key]}
                aria-label={`Toggle ${item.label}`}
                id={`pref-toggle-${item.key}`}
                onClick={() => handleToggle(item.key, item.label)}
                className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-mocha-accent"
              >
                <span
                  className={`relative inline-block w-10 h-6 rounded-full transition-colors ${
                    prefs[item.key]
                      ? "bg-mocha-accent border border-mocha-accent"
                      : "bg-mocha-panel-raised border border-mocha-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full transition-all bg-mocha-bg shadow-xs ${
                      prefs[item.key] ? "left-[calc(100%-22px)]" : "left-0.5"
                    }`}
                  />
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Display Settings (Canonical locked theme & standard grid) */}
      <div className="p-5 sm:p-6 rounded-[18px] bg-mocha-panel border border-mocha-border shadow-sm flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-mocha-text tracking-tight">Display & Theme</h2>
          <p className="text-xs text-mocha-text-muted mt-0.5">
            System appearance tokens and workspace layout options
          </p>
        </div>

        <div className="divide-y divide-mocha-border">
          {/* Dark Mode: Locked */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-mocha-text">Catppuccin Mocha Dark Theme</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-mocha-accent/15 text-mocha-accent border border-mocha-accent/30">
                  Locked
                </span>
              </div>
              <p className="text-[11px] text-mocha-text-muted mt-0.5">
                Canonical engineering-grade palette for all OhmSim buyer views
              </p>
            </div>

            <div
              aria-disabled="true"
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center shrink-0 cursor-not-allowed opacity-80"
            >
              <span className="relative inline-block w-10 h-6 rounded-full bg-mocha-accent border border-mocha-accent">
                <span className="absolute top-0.5 left-[calc(100%-22px)] w-5 h-5 rounded-full bg-mocha-bg shadow-xs" />
              </span>
            </div>
          </div>

          {/* Compact View: Static / Unavailable */}
          <div className="py-3 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-mocha-text">Compact Product Grid</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mocha-panel-raised text-mocha-text-muted border border-mocha-border">
                  Standard Grid
                </span>
              </div>
              <p className="text-[11px] text-mocha-text-muted mt-0.5">
                Standard grid layout is active across the catalog
              </p>
            </div>

            <div
              aria-disabled="true"
              className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center shrink-0 cursor-not-allowed opacity-50"
            >
              <span className="relative inline-block w-10 h-6 rounded-full bg-mocha-panel-raised border border-mocha-border">
                <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-mocha-text-muted/40 shadow-xs" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
