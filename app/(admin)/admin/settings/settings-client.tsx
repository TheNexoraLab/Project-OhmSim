"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import { PaymentQr } from "@/components/buyer/payment-qr";
import {
  usePaymentSettings,
  DEFAULT_PAYMENT_SETTINGS,
  type StorePaymentSettings,
} from "@/lib/settings/payment-settings";
import {
  Upload,
  Trash2,
  QrCode,
  CheckCircle2,
  Building2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

type SettingsTabId = "ALL" | "HUB" | "SHIPPING" | "PAYMENTS" | "PROFILE";

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
  const { settings: globalPaymentSettings, updateSettings } = usePaymentSettings();

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

  // 3. Digital Payments & QR Ph Gateway State
  const [merchantName, setMerchantName] = useState("OHMSIM ELECTRONICS LABS");
  const [merchantSubtext, setMerchantSubtext] = useState(
    "Region III Electrical & IoT Engineering Fulfillment",
  );
  const [gcashEnabled, setGcashEnabled] = useState(true);
  const [gcashAccountName, setGcashAccountName] = useState("OHMSIM ELECTRONICS LABS");
  const [gcashAccountNumber, setGcashAccountNumber] = useState("0917 588 6467");
  const [gcashQrImage, setGcashQrImage] = useState<string | null>(null);

  const [mayaEnabled, setMayaEnabled] = useState(true);
  const [mayaAccountName, setMayaAccountName] = useState("OHMSIM ELECTRONICS LABS");
  const [mayaAccountNumber, setMayaAccountNumber] = useState("0918 599 6292");
  const [mayaQrImage, setMayaQrImage] = useState<string | null>(null);

  const gcashFileInputRef = useRef<HTMLInputElement>(null);
  const mayaFileInputRef = useRef<HTMLInputElement>(null);

  // 4. Admin Profile & Security State
  const [adminName, setAdminName] = useState("Engr. Marco Villanueva");
  const [adminEmail, setAdminEmail] = useState("ops.admin@ohmsim.nexoralabs.ph");
  const [adminRole] = useState("ADMIN");
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [notifySupportChat, setNotifySupportChat] = useState(true);
  const [notifyWeeklyLiquidation, setNotifyWeeklyLiquidation] = useState(true);

  const [lastSavedAt, setLastSavedAt] = useState<string>("Today, 9:00 AM");

  // Sync state from global settings when loaded
  useEffect(() => {
    if (globalPaymentSettings) {
      setMerchantName(globalPaymentSettings.merchantName || "OHMSIM ELECTRONICS LABS");
      setMerchantSubtext(
        globalPaymentSettings.merchantSubtext ||
        "Region III Electrical & IoT Engineering Fulfillment",
      );
      setGcashEnabled(globalPaymentSettings.gcash.enabled);
      setGcashAccountName(globalPaymentSettings.gcash.accountName);
      setGcashAccountNumber(globalPaymentSettings.gcash.accountNumber);
      setGcashQrImage(globalPaymentSettings.gcash.customQrImageUrl);

      setMayaEnabled(globalPaymentSettings.maya.enabled);
      setMayaAccountName(globalPaymentSettings.maya.accountName);
      setMayaAccountNumber(globalPaymentSettings.maya.accountNumber);
      setMayaQrImage(globalPaymentSettings.maya.customQrImageUrl);

      setCodEnabled(globalPaymentSettings.codEnabled ?? true);
      setPayOnPickupEnabled(globalPaymentSettings.payOnPickupEnabled ?? true);
    }
  }, [globalPaymentSettings]);

  const handleToggleProvince = (province: string) => {
    setEnabledProvinces((prev) =>
      prev.includes(province)
        ? prev.filter((p) => p !== province)
        : [...prev, province],
    );
  };

  const handleImageFileChange = (
    channel: "GCASH" | "MAYA",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast("Please select an image file (PNG, JPG, or WebP).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast("QR code image file must be smaller than 5MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (channel === "GCASH") {
        setGcashQrImage(dataUrl);
        toast("GCash QR code image loaded. Click 'Save Settings' to publish.", "success");
      } else {
        setMayaQrImage(dataUrl);
        toast("Maya QR code image loaded. Click 'Save Settings' to publish.", "success");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQr = (channel: "GCASH" | "MAYA") => {
    if (channel === "GCASH") {
      setGcashQrImage(null);
      if (gcashFileInputRef.current) gcashFileInputRef.current.value = "";
      toast("GCash QR reset to default BSP-compliant vector.", "info");
    } else {
      setMayaQrImage(null);
      if (mayaFileInputRef.current) mayaFileInputRef.current.value = "";
      toast("Maya QR reset to default BSP-compliant vector.", "info");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const feeNum = Math.max(0, Number(standardRegion3Fee) || 0);
    const thresholdNum = Math.max(0, Number(freeDeliveryThreshold) || 0);

    const timeNow = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    setLastSavedAt(`Today, ${timeNow}`);

    const updatedPaymentPayload: StorePaymentSettings = {
      merchantName: merchantName.trim() || DEFAULT_PAYMENT_SETTINGS.merchantName,
      merchantSubtext: merchantSubtext.trim() || DEFAULT_PAYMENT_SETTINGS.merchantSubtext,
      gcash: {
        enabled: gcashEnabled,
        accountName: gcashAccountName.trim() || DEFAULT_PAYMENT_SETTINGS.gcash.accountName,
        accountNumber: gcashAccountNumber.trim() || DEFAULT_PAYMENT_SETTINGS.gcash.accountNumber,
        customQrImageUrl: gcashQrImage,
        instructions: "Scan using GCash app or any QR Ph compliant banking app.",
      },
      maya: {
        enabled: mayaEnabled,
        accountName: mayaAccountName.trim() || DEFAULT_PAYMENT_SETTINGS.maya.accountName,
        accountNumber: mayaAccountNumber.trim() || DEFAULT_PAYMENT_SETTINGS.maya.accountNumber,
        customQrImageUrl: mayaQrImage,
        instructions: "Scan using Maya app or any QR Ph compliant banking app.",
      },
      codEnabled,
      payOnPickupEnabled,
    };

    await updateSettings(updatedPaymentPayload);

    toast(
      `Store, Hub & Payment QR Settings published successfully (Region III Fee: ${formatPrice(feeNum)}, Free Threshold: ${formatPrice(thresholdNum)}).`,
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

    setMerchantName(DEFAULT_PAYMENT_SETTINGS.merchantName);
    setMerchantSubtext(DEFAULT_PAYMENT_SETTINGS.merchantSubtext);
    setGcashEnabled(DEFAULT_PAYMENT_SETTINGS.gcash.enabled);
    setGcashAccountName(DEFAULT_PAYMENT_SETTINGS.gcash.accountName);
    setGcashAccountNumber(DEFAULT_PAYMENT_SETTINGS.gcash.accountNumber);
    setGcashQrImage(null);

    setMayaEnabled(DEFAULT_PAYMENT_SETTINGS.maya.enabled);
    setMayaAccountName(DEFAULT_PAYMENT_SETTINGS.maya.accountName);
    setMayaAccountNumber(DEFAULT_PAYMENT_SETTINGS.maya.accountNumber);
    setMayaQrImage(null);

    if (gcashFileInputRef.current) gcashFileInputRef.current.value = "";
    if (mayaFileInputRef.current) mayaFileInputRef.current.value = "";

    toast("Restored default OhmSim Region III, Lab Hub & QR Ph parameters.", "info");
  };

  const showHub = activeTab === "ALL" || activeTab === "HUB";
  const showShipping = activeTab === "ALL" || activeTab === "SHIPPING";
  const showPayments = activeTab === "ALL" || activeTab === "PAYMENTS";
  const showProfile = activeTab === "ALL" || activeTab === "PROFILE";

  return (
    <form
      onSubmit={handleSaveSettings}
      data-testid="admin-settings-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Page Header */}
      <div className="admin-page-header flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
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
              { id: "PAYMENTS", label: "3. Digital Payments & QR Ph Gateway" },
              { id: "PROFILE", label: "4. Admin Profile & Security" },
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
                className={`rounded-lg border px-3.5 py-1.5 text-xs font-semibold transition-all ${isActive
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
                      className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${active
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

      {/* Panel 3: Digital Payments & QR Ph Gateway */}
      {showPayments && (
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#313244] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#CDD6F4]">
                  Digital Payments &amp; QR Ph Gateway
                </h2>
                <Badge variant="success" className="font-mono text-[10px]">
                  BSP QR PH VERIFIED
                </Badge>
              </div>
              <p className="mt-1 text-xs text-[#A6ADC8]">
                Manage official store GCash and Maya merchant accounts, upload custom payment QR vouchers, and preview buyer checkout experience.
              </p>
            </div>
          </div>

          {/* Store Merchant Header Configuration */}
          <div className="mt-5 rounded-xl border border-[#313244] bg-[#181825] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 size={16} className="text-[#89B4FA]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#BAC2DE]">
                Store Organization &amp; Fulfillment Subtext
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="merchant-name"
                  className="mb-1 block text-xs font-medium text-[#BAC2DE]"
                >
                  Official Store / Merchant Registered Name
                </label>
                <input
                  id="merchant-name"
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g. OHMSIM ELECTRONICS LABS"
                  className="h-10 w-full rounded-lg border border-[#313244] bg-[#11111B] px-3.5 text-sm font-semibold text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="merchant-subtext"
                  className="mb-1 block text-xs font-medium text-[#BAC2DE]"
                >
                  Branch Fulfillment &amp; Operations Subtext
                </label>
                <input
                  id="merchant-subtext"
                  type="text"
                  value={merchantSubtext}
                  onChange={(e) => setMerchantSubtext(e.target.value)}
                  placeholder="e.g. Region III Electrical & IoT Engineering Fulfillment"
                  className="h-10 w-full rounded-lg border border-[#313244] bg-[#11111B] px-3.5 text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Payment Channels Grid */}
          <div className="mt-6 flex flex-col gap-6">
            {/* GCash Channel Box */}
            <div className="rounded-2xl border border-[#007DFE]/30 bg-[#007DFE]/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#007DFE]/20 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#007DFE] flex items-center justify-center text-white font-black text-sm shadow-xs">
                    G
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#CDD6F4]">
                        GCash E-Wallet &amp; QR Ph
                      </h3>
                      {gcashQrImage ? (
                        <span className="text-[10px] font-mono bg-[#89B4FA]/20 text-[#89B4FA] px-2 py-0.5 rounded-full border border-[#89B4FA]/40 font-bold">
                          Custom Upload Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-[#A6ADC8]/20 text-[#A6ADC8] px-2 py-0.5 rounded-full border border-[#A6ADC8]/40">
                          Auto BSP Vector Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A6ADC8]">
                      Centralized receiving account for GCash e-wallet transactions
                    </p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#007DFE]/40 bg-[#181825] px-3 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={gcashEnabled}
                    onChange={(e) => setGcashEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#007DFE]"
                  />
                  <span className="font-semibold text-[#CDD6F4]">
                    Accept GCash on Checkout
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Configuration & File Upload */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="gcash-account-name"
                        className="mb-1 block text-xs font-medium text-[#BAC2DE]"
                      >
                        GCash Account Name
                      </label>
                      <input
                        id="gcash-account-name"
                        type="text"
                        value={gcashAccountName}
                        onChange={(e) => setGcashAccountName(e.target.value)}
                        className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3 text-sm text-[#CDD6F4] focus:border-[#007DFE] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="gcash-account-number"
                        className="mb-1 block text-xs font-medium text-[#BAC2DE]"
                      >
                        Recipient Mobile Number
                      </label>
                      <input
                        id="gcash-account-number"
                        type="text"
                        value={gcashAccountNumber}
                        onChange={(e) => setGcashAccountNumber(e.target.value)}
                        placeholder="0917 588 6467"
                        className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3 font-mono text-sm text-[#89B4FA] focus:border-[#007DFE] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* QR Upload Dropzone */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#BAC2DE]">
                      Admin Uploaded GCash QR Code Image
                    </label>
                    <input
                      ref={gcashFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleImageFileChange("GCASH", e)}
                      className="hidden"
                      id="gcash-qr-file-input"
                    />

                    {gcashQrImage ? (
                      <div className="flex items-center gap-4 rounded-xl border border-[#007DFE]/40 bg-[#181825] p-3.5">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white p-1 shrink-0 border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={gcashQrImage}
                            alt="Uploaded GCash QR"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#A6E3A1]">
                            <CheckCircle2 size={14} />
                            <span>Custom QR Image Active</span>
                          </div>
                          <p className="text-[11px] text-[#A6ADC8] mt-0.5 truncate">
                            Displayed live to buyers on checkout &amp; order payment.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => gcashFileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded bg-[#007DFE]/20 text-[#89B4FA] hover:bg-[#007DFE]/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Upload size={12} />
                              <span>Replace Image</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQr("GCASH")}
                              className="px-2.5 py-1 rounded bg-mocha-red/20 text-[#F38BA8] hover:bg-mocha-red/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>Revert to Vector</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => gcashFileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#007DFE]/40 hover:border-[#007DFE] bg-[#181825] hover:bg-[#1e1e2e] rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#007DFE]/15 text-[#007DFE] flex items-center justify-center">
                          <Upload size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#CDD6F4]">
                            Upload Official GCash Merchant QR
                          </p>
                          <p className="text-[11px] text-[#A6ADC8] mt-0.5">
                            PNG, JPG, or WebP up to 5MB. Click or drag file here.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-[#BAC2DE] bg-[#11111B] px-2 py-0.5 rounded border border-[#313244]">
                          Auto-falls back to BSP QR Ph vector if empty
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Checkout Preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#A6ADC8] font-bold">
                    Live Buyer Checkout Preview (GCash)
                  </span>
                  <PaymentQr
                    channel="GCASH"
                    amount={1450}
                    customQrImageUrl={gcashQrImage}
                    merchantName={gcashAccountName}
                    merchantNumber={gcashAccountNumber}
                  />
                </div>
              </div>
            </div>

            {/* Maya Channel Box */}
            <div className="rounded-2xl border border-[#00D665]/30 bg-[#00D665]/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#00D665]/20 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#00D665] flex items-center justify-center text-white font-black text-sm shadow-xs">
                    M
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#CDD6F4]">
                        Maya E-Wallet &amp; QR Ph
                      </h3>
                      {mayaQrImage ? (
                        <span className="text-[10px] font-mono bg-[#A6E3A1]/20 text-[#A6E3A1] px-2 py-0.5 rounded-full border border-[#A6E3A1]/40 font-bold">
                          Custom Upload Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-[#A6ADC8]/20 text-[#A6ADC8] px-2 py-0.5 rounded-full border border-[#A6ADC8]/40">
                          Auto BSP Vector Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#A6ADC8]">
                      Centralized receiving account for Maya e-wallet &amp; bank QR Ph payments
                    </p>
                  </div>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#00D665]/40 bg-[#181825] px-3 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={mayaEnabled}
                    onChange={(e) => setMayaEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#00D665]"
                  />
                  <span className="font-semibold text-[#CDD6F4]">
                    Accept Maya on Checkout
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                {/* Configuration & File Upload */}
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="maya-account-name"
                        className="mb-1 block text-xs font-medium text-[#BAC2DE]"
                      >
                        Maya Account Name
                      </label>
                      <input
                        id="maya-account-name"
                        type="text"
                        value={mayaAccountName}
                        onChange={(e) => setMayaAccountName(e.target.value)}
                        className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3 text-sm text-[#CDD6F4] focus:border-[#00D665] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="maya-account-number"
                        className="mb-1 block text-xs font-medium text-[#BAC2DE]"
                      >
                        Recipient Mobile Number
                      </label>
                      <input
                        id="maya-account-number"
                        type="text"
                        value={mayaAccountNumber}
                        onChange={(e) => setMayaAccountNumber(e.target.value)}
                        placeholder="0918 599 6292"
                        className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3 font-mono text-sm text-[#A6E3A1] focus:border-[#00D665] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* QR Upload Dropzone */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#BAC2DE]">
                      Admin Uploaded Maya QR Code Image
                    </label>
                    <input
                      ref={mayaFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={(e) => handleImageFileChange("MAYA", e)}
                      className="hidden"
                      id="maya-qr-file-input"
                    />

                    {mayaQrImage ? (
                      <div className="flex items-center gap-4 rounded-xl border border-[#00D665]/40 bg-[#181825] p-3.5">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white p-1 shrink-0 border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mayaQrImage}
                            alt="Uploaded Maya QR"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#A6E3A1]">
                            <CheckCircle2 size={14} />
                            <span>Custom QR Image Active</span>
                          </div>
                          <p className="text-[11px] text-[#A6ADC8] mt-0.5 truncate">
                            Displayed live to buyers on checkout &amp; order payment.
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => mayaFileInputRef.current?.click()}
                              className="px-2.5 py-1 rounded bg-[#00D665]/20 text-[#A6E3A1] hover:bg-[#00D665]/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Upload size={12} />
                              <span>Replace Image</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveQr("MAYA")}
                              className="px-2.5 py-1 rounded bg-mocha-red/20 text-[#F38BA8] hover:bg-mocha-red/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>Revert to Vector</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => mayaFileInputRef.current?.click()}
                        className="border-2 border-dashed border-[#00D665]/40 hover:border-[#00D665] bg-[#181825] hover:bg-[#1e1e2e] rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#00D665]/15 text-[#00D665] flex items-center justify-center">
                          <Upload size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#CDD6F4]">
                            Upload Official Maya Merchant QR
                          </p>
                          <p className="text-[11px] text-[#A6ADC8] mt-0.5">
                            PNG, JPG, or WebP up to 5MB. Click or drag file here.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono text-[#BAC2DE] bg-[#11111B] px-2 py-0.5 rounded border border-[#313244]">
                          Auto-falls back to BSP QR Ph vector if empty
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Checkout Preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#A6ADC8] font-bold">
                    Live Buyer Checkout Preview (Maya)
                  </span>
                  <PaymentQr
                    channel="MAYA"
                    amount={1450}
                    customQrImageUrl={mayaQrImage}
                    merchantName={mayaAccountName}
                    merchantNumber={mayaAccountNumber}
                  />
                </div>
              </div>
            </div>
          </div>
        </Surface>
      )}

      {/* Panel 4: Admin Profile & Security */}
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
                  ADMIN ACCESS
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="admin-name"
                className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
              >
                Lead Administrator
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
                Operations Contact Email
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
                System Security Role
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
    </form>
  );
}
