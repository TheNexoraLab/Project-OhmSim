"use client";

import { useState, useEffect, useCallback } from "react";

export interface PaymentChannelConfig {
  enabled: boolean;
  accountName: string;
  accountNumber: string;
  customQrImageUrl: string | null; // Data URL or web URL
  instructions?: string;
}

export interface StorePaymentSettings {
  merchantName: string;
  merchantSubtext: string;
  gcash: PaymentChannelConfig;
  maya: PaymentChannelConfig;
  codEnabled: boolean;
  payOnPickupEnabled: boolean;
  updatedAt?: string;
}

export const DEFAULT_PAYMENT_SETTINGS: StorePaymentSettings = {
  merchantName: "OHMSIM ELECTRONICS LABS",
  merchantSubtext: "Region III Electrical & IoT Engineering Fulfillment",
  gcash: {
    enabled: true,
    accountName: "OHMSIM ELECTRONICS LABS",
    accountNumber: "0917 588 6467",
    customQrImageUrl: null,
    instructions: "Scan using GCash app or any QR Ph compliant banking app.",
  },
  maya: {
    enabled: true,
    accountName: "OHMSIM ELECTRONICS LABS",
    accountNumber: "0918 599 6292",
    customQrImageUrl: null,
    instructions: "Scan using Maya app or any QR Ph compliant banking app.",
  },
  codEnabled: true,
  payOnPickupEnabled: true,
  updatedAt: "2026-11-17T00:00:00.000Z",
};

const STORAGE_KEY = "ohmsim_store_payment_settings";
const SETTINGS_EVENT_NAME = "ohmsim_payment_settings_updated";

/**
 * Retrieve current payment settings from localStorage (fallback to defaults)
 */
export function getStoredPaymentSettings(): StorePaymentSettings {
  if (typeof window === "undefined") {
    return DEFAULT_PAYMENT_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PAYMENT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PAYMENT_SETTINGS,
      ...parsed,
      gcash: { ...DEFAULT_PAYMENT_SETTINGS.gcash, ...(parsed.gcash || {}) },
      maya: { ...DEFAULT_PAYMENT_SETTINGS.maya, ...(parsed.maya || {}) },
    };
  } catch (err) {
    console.error("Failed to parse stored payment settings:", err);
    return DEFAULT_PAYMENT_SETTINGS;
  }
}

/**
 * Persist payment settings to localStorage and notify all active tabs
 */
export function saveStoredPaymentSettings(settings: StorePaymentSettings): void {
  if (typeof window === "undefined") return;

  const payload: StorePaymentSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(SETTINGS_EVENT_NAME, { detail: payload }));
  } catch (err) {
    console.error("Failed to save payment settings to localStorage:", err);
  }
}

/**
 * React hook for live synchronized payment settings across Admin and Buyer components
 */
export function usePaymentSettings() {
  const [settings, setSettings] = useState<StorePaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Sync from localStorage and API
  useEffect(() => {
    // 1. Initial read from localStorage
    const local = getStoredPaymentSettings();
    setSettings(local);
    setIsLoading(false);

    // 2. Fetch from backend API
    fetch("/api/settings/payment")
      .then((res) => {
        if (!res.ok) throw new Error("API returned status " + res.status);
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object") {
          const merged: StorePaymentSettings = {
            ...DEFAULT_PAYMENT_SETTINGS,
            ...data,
            gcash: { ...DEFAULT_PAYMENT_SETTINGS.gcash, ...(data.gcash || {}) },
            maya: { ...DEFAULT_PAYMENT_SETTINGS.maya, ...(data.maya || {}) },
          };
          setSettings(merged);
          // Sync with local storage
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
          }
        }
      })
      .catch(() => {
        // Fall back to local storage silently
      });

    // 3. Listen for changes dispatched within the same window or other tabs
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StorePaymentSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      } else {
        setSettings(getStoredPaymentSettings());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setSettings(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener(SETTINGS_EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(SETTINGS_EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const updateSettings = useCallback(async (newSettings: StorePaymentSettings) => {
    saveStoredPaymentSettings(newSettings);
    setSettings(newSettings);

    try {
      await fetch("/api/settings/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.warn("Could not sync payment settings to server API:", err);
    }
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
  };
}
