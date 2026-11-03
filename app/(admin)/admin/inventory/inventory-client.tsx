"use client";

import React, { useMemo, useState } from "react";
import type { StockStatus } from "@/types/product";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import {
  type AdminProductRecord,
  type StockAdjustmentReason,
  type StockAdjustmentType,
  adjustAdminProductStock,
  computeStockStatus,
  useAdminCatalogStore,
} from "@/components/admin/admin-catalog-store";

type StockFilterTab = "ALL" | StockStatus;

const STOCK_FILTER_TABS: Array<{ id: StockFilterTab; label: string }> = [
  { id: "ALL", label: "All" },
  { id: "in-stock", label: "In Stock" },
  { id: "low-stock", label: "Low Stock (<= minThreshold)" },
  { id: "out-of-stock", label: "Out of Stock (= 0)" },
];

const ADJUSTMENT_REASONS: StockAdjustmentReason[] = [
  "Restock Shipment",
  "Damaged / Defective",
  "Inventory Audit Adjustment",
];

function getStockStatusStyle(status: StockStatus): {
  label: string;
  color: string;
  bg: string;
  border: string;
  barColor: string;
} {
  switch (status) {
    case "in-stock":
      return {
        label: "IN STOCK",
        color: "#A6E3A1",
        bg: "rgba(166, 227, 161, 0.12)",
        border: "rgba(166, 227, 161, 0.3)",
        barColor: "#A6E3A1",
      };
    case "low-stock":
      return {
        label: "LOW STOCK",
        color: "#F9E2AF",
        bg: "rgba(249, 226, 175, 0.12)",
        border: "rgba(249, 226, 175, 0.3)",
        barColor: "#F9E2AF",
      };
    case "out-of-stock":
      return {
        label: "OUT OF STOCK",
        color: "#F38BA8",
        bg: "rgba(243, 139, 168, 0.12)",
        border: "rgba(243, 139, 168, 0.3)",
        barColor: "#F38BA8",
      };
  }
}

interface AdjustStockModalProps {
  product: AdminProductRecord | null;
  onClose: () => void;
}

function AdjustStockModal({ product, onClose }: AdjustStockModalProps) {
  if (!product) return null;
  return (
    <AdjustStockModalInner
      key={`${product.id}-${product.stock}`}
      product={product}
      onClose={onClose}
    />
  );
}

function AdjustStockModalInner({
  product,
  onClose,
}: {
  product: AdminProductRecord;
  onClose: () => void;
}) {
  const [adjustmentType, setAdjustmentType] =
    useState<StockAdjustmentType>("ADD");
  const [quantity, setQuantity] = useState<string>("10");
  const [reason, setReason] =
    useState<StockAdjustmentReason>("Restock Shipment");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const parsedQty = Math.max(0, Math.floor(Number(quantity) || 0));
  const projectedStock =
    adjustmentType === "ADD"
      ? product.stock + parsedQty
      : Math.max(0, product.stock - parsedQty);
  const projectedStatus = computeStockStatus(
    projectedStock,
    product.minThreshold,
  );
  const projectedBadge = getStockStatusStyle(projectedStatus);

  const handleSelectType = (type: StockAdjustmentType) => {
    setAdjustmentType(type);
    if (type === "ADD" && reason === "Damaged / Defective") {
      setReason("Restock Shipment");
    } else if (type === "REMOVE" && reason === "Restock Shipment") {
      setReason("Damaged / Defective");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(parsedQty) || parsedQty <= 0) {
      setErrorMessage("Please enter a valid quantity greater than 0.");
      return;
    }
    if (adjustmentType === "REMOVE" && product.stock === 0) {
      setErrorMessage("Cannot remove units from a SKU with 0 current stock.");
      return;
    }

    const result = adjustAdminProductStock({
      productId: product.id,
      type: adjustmentType,
      quantity: parsedQty,
      reason,
    });

    if (result) {
      const updated = result.product;
      toast(
        `${adjustmentType === "ADD" ? "Added" : "Removed"} ${parsedQty} units for ${updated.sku} (${product.stock} → ${updated.stock} units • ${reason}).`,
        updated.status === "out-of-stock"
          ? "error"
          : updated.status === "low-stock"
            ? "warning"
            : "success",
      );
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="adjust-stock-modal-title"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#45475A] bg-[#1E1E2E] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#313244] bg-[#181825] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#313244] bg-[#1E1E2E] text-[#89B4FA]">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </div>
            <div>
              <h2
                id="adjust-stock-modal-title"
                className="text-base font-semibold text-[#CDD6F4]"
              >
                Adjust Inventory Stock
              </h2>
              <p className="font-mono text-xs text-[#89B4FA]">{product.sku}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg border border-transparent p-1.5 text-[#A6ADC8] transition-colors hover:border-[#313244] hover:bg-[#1E1E2E] hover:text-[#CDD6F4]"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {errorMessage && (
            <div className="rounded-lg border border-[#F38BA8]/40 bg-[#F38BA8]/10 px-4 py-3 text-xs font-medium text-[#F38BA8]">
              {errorMessage}
            </div>
          )}

          {/* Product Summary Banner */}
          <div className="rounded-lg border border-[#313244] bg-[#181825] p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#CDD6F4]">
                {product.name}
              </p>
              <span className="text-xs text-[#A6ADC8]">{product.category}</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-[#313244]/70 pt-3 text-center">
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                  Current Stock
                </p>
                <p className="mt-0.5 font-mono text-base font-bold text-[#CDD6F4]">
                  {product.stock}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                  Min Threshold
                </p>
                <p className="mt-0.5 font-mono text-base font-semibold text-[#BAC2DE]">
                  {product.minThreshold}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                  Projected Stock
                </p>
                <p
                  className="mt-0.5 font-mono text-base font-bold"
                  style={{ color: projectedBadge.color }}
                >
                  {projectedStock}
                </p>
              </div>
            </div>
          </div>

          {/* Adjustment Type Selector */}
          <div>
            <span className="mb-2 block text-xs font-medium text-[#BAC2DE]">
              Select Adjustment Type
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSelectType("ADD")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                  adjustmentType === "ADD"
                    ? "border-[#A6E3A1] bg-[#A6E3A1]/14 text-[#A6E3A1]"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                <span>+ Add Stock (+)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectType("REMOVE")}
                className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all ${
                  adjustmentType === "REMOVE"
                    ? "border-[#F38BA8] bg-[#F38BA8]/14 text-[#F38BA8]"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                <span>− Remove Stock (-)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input & Quick Presets */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="adj-quantity"
                className="text-xs font-medium text-[#BAC2DE]"
              >
                Adjustment Quantity (Units) *
              </label>
              <div className="flex items-center gap-1.5">
                {[5, 10, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(String(preset))}
                    className="rounded border border-[#313244] bg-[#181825] px-2 py-0.5 font-mono text-[11px] text-[#A6ADC8] transition-colors hover:border-[#89B4FA]/50 hover:text-[#89B4FA]"
                  >
                    {adjustmentType === "ADD" ? `+${preset}` : `-${preset}`}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="adj-quantity"
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3 font-mono text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            />
          </div>

          {/* Adjustment Reason */}
          <div>
            <label
              htmlFor="adj-reason"
              className="mb-1.5 block text-xs font-medium text-[#BAC2DE]"
            >
              Adjustment Reason *
            </label>
            <select
              id="adj-reason"
              value={reason}
              onChange={(e) =>
                setReason(e.target.value as StockAdjustmentReason)
              }
              className="h-10 w-full rounded-lg border border-[#313244] bg-[#181825] px-3 text-sm text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            >
              {ADJUSTMENT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Projected Status Preview */}
          <div className="flex items-center justify-between rounded-lg border border-[#313244] bg-[#11111B] px-3.5 py-2.5 text-xs">
            <span className="text-[#A6ADC8]">Resulting Safety Status:</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
              style={{
                color: projectedBadge.color,
                backgroundColor: projectedBadge.bg,
                border: `1px solid ${projectedBadge.border}`,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: projectedBadge.color }}
              />
              {projectedBadge.label} ({projectedStock} units)
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-[#313244] pt-4">
            <Button
              type="button"
              variant="outline"
              size="small"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="accent" size="small">
              Confirm Stock Adjustment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InventoryClient() {
  const { products, adjustmentLogs } = useAdminCatalogStore();

  const [activeStatusTab, setActiveStatusTab] = useState<StockFilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustingProduct, setAdjustingProduct] =
    useState<AdminProductRecord | null>(null);

  // Stock Overview KPI metrics
  const overviewMetrics = useMemo(() => {
    const totalSkus = products.length;
    let totalUnits = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalInventoryValuation = 0;

    for (const product of products) {
      totalUnits += product.stock;
      totalInventoryValuation += product.stock * product.price;
      const liveStatus = computeStockStatus(
        product.stock,
        product.minThreshold,
      );
      if (liveStatus === "out-of-stock") {
        outOfStockCount += 1;
      } else if (liveStatus === "low-stock") {
        lowStockCount += 1;
      } else {
        inStockCount += 1;
      }
    }

    return {
      totalSkus,
      totalUnits,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalInventoryValuation,
    };
  }, [products]);

  const statusTabCounts = useMemo<Record<StockFilterTab, number>>(
    () => ({
      ALL: overviewMetrics.totalSkus,
      "in-stock": overviewMetrics.inStockCount,
      "low-stock": overviewMetrics.lowStockCount,
      "out-of-stock": overviewMetrics.outOfStockCount,
    }),
    [overviewMetrics],
  );

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const liveStatus = computeStockStatus(
        product.stock,
        product.minThreshold,
      );
      if (activeStatusTab !== "ALL" && liveStatus !== activeStatusTab) {
        return false;
      }
      if (!query) return true;
      return (
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [products, activeStatusTab, searchQuery]);

  return (
    <div
      data-testid="admin-inventory-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#94E2D5]/30 bg-[#94E2D5]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#94E2D5] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#94E2D5]" />
              WAREHOUSE &amp; SAFETY STOCK TELEMETRY
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Inventory &amp; Stock Control
          </h1>
          <p className="mt-0.5 text-xs text-[#BAC2DE] sm:text-sm">
            Track real-time warehouse unit counts, safety stock thresholds, and
            log restock or audit adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-[#313244] bg-[#181825] px-3.5 py-2 sm:self-auto">
          <span className="text-xs text-[#A6ADC8]">Est. Stock Valuation:</span>
          <span className="font-mono text-sm font-bold text-[#94E2D5]">
            {formatPrice(overviewMetrics.totalInventoryValuation)}
          </span>
        </div>
      </div>

      {/* Stock Overview Cards (4 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Total SKUs Tracked */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Total SKUs Tracked
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#CDD6F4]">
                {overviewMetrics.totalSkus}
              </p>
            </div>
            <Badge variant="primary" className="font-mono">
              TRACKED
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Active catalog components monitored for safety thresholds
          </p>
        </Surface>

        {/* Card 2: Total Units in Stock */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Total Units in Stock
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#94E2D5]">
                {overviewMetrics.totalUnits.toLocaleString("en-PH")}
              </p>
            </div>
            <Badge variant="success" className="font-mono">
              UNITS
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Combined physical inventory across all shelves &amp; bins
          </p>
        </Surface>

        {/* Card 3: Low Stock Count */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Low Stock Count
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#F9E2AF]">
                {overviewMetrics.lowStockCount}
              </p>
            </div>
            <Badge variant="warning" className="font-mono">
              LOW STOCK
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            SKUs at or below minimum safety threshold (&lt;= minThreshold)
          </p>
        </Surface>

        {/* Card 4: Out of Stock Count */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Out of Stock Count
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#F38BA8]">
                {overviewMetrics.outOfStockCount}
              </p>
            </div>
            <Badge variant="danger" className="font-mono">
              DEPLETED
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Depleted SKUs (stock = 0) requiring immediate restock
          </p>
        </Surface>
      </div>

      {/* Filter by Stock Status + Search Bar */}
      <Surface
        variant="panel"
        className="space-y-4 border border-[#313244] bg-[#1E1E2E] p-4"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Stock Status Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter inventory by stock status"
            className="flex flex-wrap items-center gap-2"
          >
            {STOCK_FILTER_TABS.map((tab) => {
              const isActive = activeStatusTab === tab.id;
              const count = statusTabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveStatusTab(tab.id)}
                  style={
                    isActive
                      ? {
                          color: "#89B4FA",
                          backgroundColor: "rgba(137, 180, 250, 0.14)",
                          borderColor: "rgba(137, 180, 250, 0.45)",
                        }
                      : undefined
                  }
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "shadow-xs"
                      : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] ${
                      isActive
                        ? "bg-[#89B4FA]/20 text-[#89B4FA]"
                        : "bg-[#313244]/70 text-[#BAC2DE]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full lg:max-w-xs">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#A6ADC8]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, product name, category..."
              aria-label="Search inventory SKUs"
              className="h-9 w-full rounded-lg border border-[#313244] bg-[#181825] pr-8 pl-10 text-xs text-[#CDD6F4] placeholder-[#A6ADC8] transition-colors focus:border-[#89B4FA] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-[#A6ADC8] hover:text-[#CDD6F4]"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </Surface>

      {/* Inventory Stock Table */}
      <Surface
        variant="panel"
        className="overflow-hidden border border-[#313244] bg-[#1E1E2E] p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#313244] bg-[#181825] text-[11px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">Product Name</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Current Stock</th>
                <th className="px-4 py-3.5 text-right">Min Threshold</th>
                <th className="px-4 py-3.5">Safety Stock Status Indicator</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/60 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-[#CDD6F4]">
                        No matching SKUs found
                      </p>
                      <p className="text-xs text-[#A6ADC8]">
                        Try selecting another stock status tab or clearing your
                        search query.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const liveStatus = computeStockStatus(
                    product.stock,
                    product.minThreshold,
                  );
                  const statusStyle = getStockStatusStyle(liveStatus);
                  const maxScale = Math.max(product.minThreshold * 3, 50);
                  const fillPercent = Math.min(
                    100,
                    Math.round((product.stock / maxScale) * 100),
                  );
                  const thresholdMarkerPercent = Math.min(
                    100,
                    Math.round((product.minThreshold / maxScale) * 100),
                  );

                  return (
                    <tr
                      key={product.id}
                      className="transition-colors hover:bg-[#181825]/80"
                    >
                      {/* SKU */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-[#89B4FA]">
                          {product.sku}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-[200px]">
                          <p className="font-medium text-[#CDD6F4]">
                            {product.name}
                          </p>
                          <p className="text-xs text-[#A6ADC8]">
                            {product.brand ?? "Generic"} •{" "}
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center rounded-md border border-[#313244] bg-[#181825] px-2.5 py-1 text-xs font-medium text-[#BAC2DE]">
                          {product.category}
                        </span>
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span
                          className="font-mono text-sm font-bold"
                          style={{ color: statusStyle.color }}
                        >
                          {product.stock}
                        </span>
                        <span className="ml-1 text-xs text-[#A6ADC8]">
                          units
                        </span>
                      </td>

                      {/* Min Threshold */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <span className="font-mono text-xs text-[#BAC2DE]">
                          {product.minThreshold} units
                        </span>
                      </td>

                      {/* Safety Stock Status Indicator */}
                      <td className="px-4 py-3.5">
                        <div className="min-w-[210px] space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide"
                              style={{
                                color: statusStyle.color,
                                backgroundColor: statusStyle.bg,
                                border: `1px solid ${statusStyle.border}`,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: statusStyle.color }}
                              />
                              {statusStyle.label}
                            </span>

                            <span className="font-mono text-[11px] text-[#A6ADC8]">
                              {product.stock === 0
                                ? "Depleted"
                                : product.stock <= product.minThreshold
                                  ? `${product.minThreshold - product.stock + 1} to safe`
                                  : `+${product.stock - product.minThreshold} above min`}
                            </span>
                          </div>

                          {/* Safety Stock Progress Bar */}
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#11111B]">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${fillPercent}%`,
                                backgroundColor: statusStyle.barColor,
                              }}
                            />
                            <div
                              title={`Safety Min Threshold (${product.minThreshold})`}
                              className="absolute top-0 bottom-0 w-0.5 bg-[#CDD6F4]/60"
                              style={{ left: `${thresholdMarkerPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => setAdjustingProduct(product)}
                        >
                          Adjust Stock
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Recent Stock Adjustment Audit Log */}
      <Surface
        variant="panel"
        className="overflow-hidden border border-[#313244] bg-[#1E1E2E] p-0"
      >
        <div className="flex items-center justify-between border-b border-[#313244] bg-[#181825] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#89B4FA]" />
            <h2 className="text-sm font-semibold text-[#CDD6F4]">
              Recent Stock Adjustment Log
            </h2>
          </div>
          <span className="font-mono text-xs text-[#A6ADC8]">
            {adjustmentLogs.length} entries recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#313244] bg-[#181825]/60 text-[11px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">SKU &amp; Component</th>
                <th className="px-5 py-3">Adjustment</th>
                <th className="px-5 py-3">Reason</th>
                <th className="px-5 py-3 text-right">Stock Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/60 text-xs">
              {adjustmentLogs.slice(0, 8).map((entry) => {
                const isAdd = entry.type === "ADD";
                return (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-[#181825]/60"
                  >
                    <td className="px-5 py-3 whitespace-nowrap text-[#A6ADC8]">
                      {formatDate(entry.timestamp)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-semibold text-[#89B4FA]">
                        {entry.sku}
                      </span>
                      <span className="ml-2 text-[#CDD6F4]">
                        {entry.productName}
                      </span>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold"
                        style={
                          isAdd
                            ? {
                                color: "#A6E3A1",
                                backgroundColor: "rgba(166, 227, 161, 0.12)",
                              }
                            : {
                                color: "#F38BA8",
                                backgroundColor: "rgba(243, 139, 168, 0.12)",
                              }
                        }
                      >
                        {isAdd ? `+${entry.quantity}` : `-${entry.quantity}`}{" "}
                        units
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#BAC2DE]">{entry.reason}</td>
                    <td className="px-5 py-3 text-right font-mono whitespace-nowrap text-[#CDD6F4]">
                      {entry.previousStock} →{" "}
                      <span className="font-bold text-[#89B4FA]">
                        {entry.newStock}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Quick Adjust Stock Modal */}
      <AdjustStockModal
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
      />
    </div>
  );
}
