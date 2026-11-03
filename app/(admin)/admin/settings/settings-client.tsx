"use client";

import React, { useState } from "react";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";

type SettingsTabId = "ALL" | "HUB" | "SHIPPING" | "PROFILE";

const REGION_III_PROVINCES = [
  "Pampanga",
  "Bulacan",
  "Nueva Ecija",
  "Bataan",
  "Tarlac",
  "Zambales",
  "Aurora",
] as const;

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("ALL");

  // 1. Fulfillment & Pickup Hub State
  const [hubName, setHubName] = useState(
    "Campus Electronics Lab Station — Building 3, Room 204",
  );
  const [hubAddress, setHubAddress] = useState(
    "Building 3, Room 204, Engineering Complex, Angeles City, Pampanga",
  );
  const [operatingHours, setOperatingHours] = useState(
    "Mon – Sat • 8:00 AM – 5:30 PM PHT",
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    "Present your Order # (e.g. #OHM-2026-055) and valid Student/Faculty or Government ID at the Building 3, Room 204 Lab Counter. Exact cash appreciated for Pay on Pickup orders.",
  );
  const [pickupHubEnabled, setPickupHubEnabled] = useState(true);

  // 2. Shipping Fee Rules State
  const [standardRegion3Fee, setStandardRegion3Fee] = useState("80");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState("1000");
  const [enabledProvinces, setEnabledProvinces] = useState<string[]>([
    "Pampanga",
    "Bulacan",
    "Nueva Ecija",
    "Bataan",
    "Tarlac",
    "Zambales",
  ]);
  const [codEnabled, setCodEnabled] = useState(true);
  const [payOnPickupEnabled, setPayOnPickupEnabled] = useState(true);

  // 3. Admin Profile & Security State
  const [adminName, setAdminName] = useState("Engr. Marco Villanueva");
  const [adminEmail, setAdminEmail] = useState("ops.admin@ohmsim.nexoralabs.ph");
  const [adminRole] = useState("ADMIN");
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifySupportChat, setNotifySupportChat] = useState(true);
  const [notifyWeeklyLiquidation, setNotifyWeeklyLiquidation] = useState(true);

  const [lastSavedAt, setLastSavedAt] = useState<string>("Today, 9:00 AM");

  const handleToggleProvince = (province: string) => {
    setEnabledProvinces((prev) =>
      prev.includes(province)
        ? prev.filter((p) => p !== province)
        : [...prev, province],
    );
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = Math.max(0, Number(standardRegion3Fee) || 0);
    const thresholdNum = Math.max(0, Number(freeDeliveryThreshold) || 0);

    const timeNow = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    setLastSavedAt(`Today, ${timeNow}`);

    toast(
      `Store & Hub Settings saved (Region III Fee: ${formatPrice(feeNum)}, Free Threshold: ${formatPrice(thresholdNum)}).`,
      "success",
    );
  };

  const handleResetDefaults = () => {
    setHubName("Campus Electronics Lab Station — Building 3, Room 204");
    setHubAddress(
      "Building 3, Room 204, Engineering Complex, Angeles City, Pampanga",
    );
    setOperatingHours("Mon – Sat • 8:00 AM – 5:30 PM PHT");
    setStandardRegion3Fee("80");
    setFreeDeliveryThreshold("1000");
    setEnabledProvinces([
      "Pampanga",
      "Bulacan",
      "Nueva Ecija",
      "Bataan",
      "Tarlac",
      "Zambales",
    ]);
    toast("Restored default OhmSim Region III & Lab Hub parameters.", "info");
  };

  const showHub = activeTab === "ALL" || activeTab === "HUB";
  const showShipping = activeTab === "ALL" || activeTab === "SHIPPING";
  const showProfile = activeTab === "ALL" || activeTab === "PROFILE";

  return (
    <form
      onSubmit={handleSaveSettings}
      data-testid="admin-settings-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#89B4FA]/30 bg-[#89B4FA]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#89B4FA] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#89B4FA]" />
              SYSTEM &amp; FULFILLMENT CONFIGURATION
            </span>
            <span className="font-mono text-xs text-[#A6ADC8]">
              Last saved: {lastSavedAt}
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Store &amp; Hub Settings
          </h1>
          <p className="mt-0.5 text-xs text-[#BAC2DE] sm:text-sm">
            Configure Campus Lab Pickup Hub parameters, Region III shipping fee
            rules, and administrator security preferences.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="small"
            onClick={handleResetDefaults}
          >
            Reset Defaults
          </Button>
          <Button type="submit" variant="accent" size="small">
            Save Settings
          </Button>
        </div>
      </div>

      {/* Configuration Section Selector Tabs */}
      <Surface
        variant="panel"
        className="border border-[#313244] bg-[#1E1E2E] p-3.5"
      >
        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex flex-wrap items-center gap-2"
        >
          {(
            [
              { id: "ALL", label: "All Configuration Panels" },
              { id: "HUB", label: "1. Fulfillment & Pickup Hub" },
              { id: "SHIPPING", label: "2. Shipping Fee Rules (Region III)" },
              { id: "PROFILE", label: "3. Admin Profile & Security" },
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                style={
                  isActive
                    ? {
                        color: "#89B4FA",
                        backgroundColor: "rgba(137, 180, 250, 0.14)",
                        borderColor: "rgba(137, 180, 250, 0.45)",
                      }
                    : undefined
                }
                className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "shadow-xs"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </Surface>

      {/* Panel 1: Fulfillment & Pickup Hub */}
      {showHub && (
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#313244] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#CDD6F4]">
                  Fulfillment &amp; Pickup Hub
                </h2>
                <Badge variant="success" className="font-mono">
                  BUILDING 3, ROOM 204
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[#A6ADC8]">
                Manage Campus Lab Station location, operating hours, and student
                / faculty pickup instructions.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-[#313244] bg-[#181825] px-3 py-1.5 text-xs">
              <input
                type="checkbox"
                checked={pickupHubEnabled}
                onChange={(e) => setPickupHubEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#89B4FA]"
              />
              <span className="font-semibold text-[#CDD6F4]">
                Accept Campus Lab Pickups (₱0.00 Fee)
              </span>
            </label>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="hub-name"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Pickup Station Designation
              </label>
              <input
                id="hub-name"
                type="text"
                value={hubName}
                onChange={(e) => setHubName(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3.5 text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="hub-hours"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Operating Hours
              </label>
              <input
                id="hub-hours"
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3.5 font-mono text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="hub-address"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Physical Campus / Hub Address
              </label>
              <input
                id="hub-address"
                type="text"
                value={hubAddress}
                onChange={(e) => setHubAddress(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3.5 text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="hub-instructions"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Buyer Pickup Instructions (Shown on Checkout &amp; Ready-for-Pickup Alerts)
              </label>
              <textarea
                id="hub-instructions"
                rows={3}
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                className="w-full rounded-lg border border-[#313244] bg-[#181825] p-3.5 text-xs leading-relaxed text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>
          </div>
        </Surface>
      )}

      {/* Panel 2: Shipping Fee Rules */}
      {showShipping && (
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#313244] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#CDD6F4]">
                  Shipping Fee Rules (Central Luzon — Region III)
                </h2>
                <Badge variant="primary" className="font-mono">
                  BR-045 / BR-046
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[#A6ADC8]">
                Standard Region III courier fee (₱80) and automatic free
                delivery threshold (₱1,000).
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="shipping-standard-fee"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Region III Standard Delivery Fee (PHP)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm text-[#A6ADC8]">
                  ₱
                </span>
                <input
                  id="shipping-standard-fee"
                  type="number"
                  min="0"
                  step="5"
                  value={standardRegion3Fee}
                  onChange={(e) => setStandardRegion3Fee(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] pr-4 pl-8 font-mono text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#A6ADC8]">
                Applied to Region III delivery orders below the free threshold.
              </p>
            </div>

            <div>
              <label
                htmlFor="shipping-free-threshold"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Free Delivery Subtotal Threshold (PHP)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm text-[#A6ADC8]">
                  ₱
                </span>
                <input
                  id="shipping-free-threshold"
                  type="number"
                  min="0"
                  step="50"
                  value={freeDeliveryThreshold}
                  onChange={(e) => setFreeDeliveryThreshold(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] pr-4 pl-8 font-mono text-sm text-[#94E2D5] focus:border-[#89B4FA] focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11px] text-[#A6ADC8]">
                Orders at or above{" "}
                {formatPrice(Number(freeDeliveryThreshold) || 0)} qualify for
                ₱0.00 Region III shipping.
              </p>
            </div>

            {/* Active Region III Provinces */}
            <div className="md:col-span-2">
              <span className="mb-2 block text-xs font-medium text-[#BAC2DE]">
                Active Region III Courier Coverage Provinces
              </span>
              <div className="flex flex-wrap gap-2">
                {REGION_III_PROVINCES.map((province) => {
                  const active = enabledProvinces.includes(province);
                  return (
                    <button
                      key={province}
                      type="button"
                      onClick={() => handleToggleProvince(province)}
                      className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                        active
                          ? "border-[#89B4FA] bg-[#89B4FA]/14 text-[#89B4FA]"
                          : "border-[#313244] bg-[#181825] text-[#A6ADC8]"
                      }`}
                    >
                      {active ? `✓ ${province}` : province}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Allowed Payment Methods */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:col-span-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#313244] bg-[#181825] p-3.5">
                <div>
                  <p className="text-xs font-bold text-[#CDD6F4]">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-[11px] text-[#A6ADC8]">
                    Collect payment upon Region III courier handoff
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={codEnabled}
                  onChange={(e) => setCodEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#89B4FA]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#313244] bg-[#181825] p-3.5">
                <div>
                  <p className="text-xs font-bold text-[#CDD6F4]">
                    Pay on Pickup (Lab Counter)
                  </p>
                  <p className="text-[11px] text-[#A6ADC8]">
                    Collect payment at Building 3, Room 204 station
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={payOnPickupEnabled}
                  onChange={(e) => setPayOnPickupEnabled(e.target.checked)}
                  className="h-4 w-4 accent-[#89B4FA]"
                />
              </label>
            </div>
          </div>
        </Surface>
      )}

      {/* Panel 3: Admin Profile & Security */}
      {showProfile && (
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#313244] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#CDD6F4]">
                  Admin Profile &amp; Security
                </h2>
                <span className="rounded-md border border-[#CBA6F7]/40 bg-[#CBA6F7]/14 px-2 py-0.5 font-mono text-xs font-bold text-[#CBA6F7]">
                  ROLE: {adminRole}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-[#A6ADC8]">
                Manage administrator identity, role credentials, and operational
                alert routing.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="admin-name"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Admin Full Name
              </label>
              <input
                id="admin-name"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3.5 text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-email"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Admin Operations Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3.5 font-mono text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="admin-role"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Access Role Level
              </label>
              <input
                id="admin-role"
                type="text"
                value={adminRole}
                readOnly
                className="h-10 w-full cursor-not-allowed rounded-lg border border-[#313244] bg-[#11111B] px-3.5 font-mono text-sm font-bold text-[#89B4FA]"
              />
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="mt-6 border-t border-[#313244] pt-5">
            <h3 className="mb-3 text-xs font-bold tracking-wider text-[#BAC2DE] uppercase">
              Operational Notification Preferences
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#313244] bg-[#181825] p-3.5">
                <div>
                  <p className="text-xs font-semibold text-[#CDD6F4]">
                    Safety Stock &amp; Depletion Alerts
                  </p>
                  <p className="text-[11px] text-[#A6ADC8]">
                    Trigger alert when SKU stock drops &lt;= minThreshold
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLowStock}
                  onChange={(e) => setNotifyLowStock(e.target.checked)}
                  className="h-4 w-4 accent-[#89B4FA]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#313244] bg-[#181825] p-3.5">
                <div>
                  <p className="text-xs font-semibold text-[#CDD6F4]">
                    New Order &amp; Lab Pickup Pings
                  </p>
                  <p className="text-[11px] text-[#A6ADC8]">
                    Immediate notification on new Region III or Building 3 order
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyNewOrders}
                  onChange={(e) => setNotifyNewOrders(e.target.checked)}
                  className="h-4 w-4 accent-[#89B4FA]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#313244] bg-[#181825] p-3.5">
                <div>
                  <p className="text-xs font-semibold text-[#CDD6F4]">
                    Support Chat Technical Inquiries
                  </p>
                  <p className="text-[11px] text-[#A6ADC8]">
                    Badge &amp; toast alert when buyers message engineering
                    support
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifySupportChat}
                  onChange={(e) => setNotifySupportChat(e.target.checked)}
                  className="h-4 w-4 accent-[#89B4FA]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#313244] bg-[#181825] p-3.5">
                <div>
                  <p className="text-xs font-semibold text-[#CDD6F4]">
                    Weekly COD Remittance &amp; Liquidation Digest
                  </p>
                  <p className="text-[11px] text-[#A6ADC8]">
                    Automated settlement summary every Friday at 6:00 PM PHT
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeeklyLiquidation}
                  onChange={(e) =>
                    setNotifyWeeklyLiquidation(e.target.checked)
                  }
                  className="h-4 w-4 accent-[#89B4FA]"
                />
              </label>
            </div>
          </div>
        </Surface>
      )}

      {/* Bottom Sticky Action Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-[#313244] pt-4">
        <Button
          type="button"
          variant="outline"
          size="small"
          onClick={handleResetDefaults}
        >
          Reset to Defaults
        </Button>
        <Button type="submit" variant="accent" size="small">
          Save Settings
        </Button>
      </div>
    </form>
  );
}

