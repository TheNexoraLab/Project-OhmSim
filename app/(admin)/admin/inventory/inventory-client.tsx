"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Download, History, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import type { StockStatus } from "@/types/product";
import { formatDate, formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { exportInventoryToCsv } from "@/services/inventory-service";
import styles from "./inventory.module.css";
import {
  type AdminProductRecord,
  type StockAdjustmentReason,
  type StockAdjustmentType,
  adjustAdminProductStock,
  computeStockStatus,
  syncAdminCatalogFromApi,
  useAdminCatalogStore,
} from "@/components/admin/admin-catalog-store";

type StockFilterTab = "ALL" | StockStatus;

const STOCK_FILTER_TABS: Array<{ id: StockFilterTab; label: string }> = [
  { id: "ALL", label: "All products" },
  { id: "in-stock", label: "In stock" },
  { id: "low-stock", label: "Low stock" },
  { id: "out-of-stock", label: "Out of stock" },
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
} {
  switch (status) {
    case "in-stock":
      return {
        label: "IN STOCK",
        color: "#A6E3A1",
        bg: "rgba(166, 227, 161, 0.12)",
        border: "rgba(166, 227, 161, 0.3)",
      };
    case "low-stock":
      return {
        label: "LOW STOCK",
        color: "#F9E2AF",
        bg: "rgba(249, 226, 175, 0.12)",
        border: "rgba(249, 226, 175, 0.3)",
      };
    case "out-of-stock":
      return {
        label: "OUT OF STOCK",
        color: "#F38BA8",
        bg: "rgba(243, 139, 168, 0.12)",
        border: "rgba(243, 139, 168, 0.3)",
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
      : adjustmentType === "REMOVE"
        ? Math.max(0, product.stock - parsedQty)
        : parsedQty;
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
    } else if (type === "SET") {
      setReason("Inventory Audit Adjustment");
      setQuantity(String(product.stock));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustmentType !== "SET" && (!Number.isFinite(parsedQty) || parsedQty <= 0)) {
      setErrorMessage("Please enter a valid quantity greater than 0.");
      return;
    }
    if (adjustmentType === "SET" && (!Number.isFinite(parsedQty) || parsedQty < 0)) {
      setErrorMessage("Please enter a valid non-negative stock count.");
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
      const actionText =
        adjustmentType === "ADD"
          ? `Added ${parsedQty} units for`
          : adjustmentType === "REMOVE"
            ? `Removed ${parsedQty} units for`
            : `Set stock to ${parsedQty} units for`;

      toast(
        `${actionText} ${updated.sku} (${product.stock} → ${updated.stock} units • ${reason}).`,
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
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-y-auto rounded-xl border border-[#45475A] bg-[#1E1E2E] shadow-2xl"
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
            <p className="mt-1 text-xs text-[#A6ADC8]">
              {product.brand ?? "Generic"} · {formatPrice(product.price)}
            </p>
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
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectType("ADD")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "ADD"
                    ? "border-[#A6E3A1] bg-[#A6E3A1]/14 text-[#A6E3A1]"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                <span>+ Add Stock</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectType("REMOVE")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "REMOVE"
                    ? "border-[#F38BA8] bg-[#F38BA8]/14 text-[#F38BA8]"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                <span>− Remove Stock</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectType("SET")}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  adjustmentType === "SET"
                    ? "border-[#89B4FA] bg-[#89B4FA]/14 text-[#89B4FA]"
                    : "border-[#313244] bg-[#181825] text-[#A6ADC8] hover:border-[#45475A] hover:text-[#CDD6F4]"
                }`}
              >
                <span>= Set Count</span>
              </button>
            </div>
          </div>

          {/* Quantity Input & Quick Presets */}
          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="adj-quantity"
                className="text-xs font-medium text-[#BAC2DE]"
              >
                {adjustmentType === "SET" ? "Exact Stock Count (Units) *" : "Adjustment Quantity (Units) *"}
              </label>
              <div className="flex items-center gap-1.5">
                {(adjustmentType === "SET" ? [0, 10, 25, 50, 100] : [5, 10, 25, 50]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuantity(String(preset))}
                    className="rounded border border-[#313244] bg-[#181825] px-2 py-0.5 font-mono text-[11px] text-[#A6ADC8] transition-colors hover:border-[#89B4FA]/50 hover:text-[#89B4FA]"
                  >
                    {adjustmentType === "ADD" ? `+${preset}` : adjustmentType === "REMOVE" ? `-${preset}` : `${preset}`}
                  </button>
                ))}
              </div>
            </div>
            <input
              id="adj-quantity"
              type="number"
              min="0"
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
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#313244] pt-4">
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

  useEffect(() => {
    syncAdminCatalogFromApi();
  }, []);

  const [activeStatusTab, setActiveStatusTab] = useState<StockFilterTab>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [adjustingProduct, setAdjustingProduct] =
    useState<AdminProductRecord | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ["ALL", ...Array.from(set)];
  }, [products]);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await syncAdminCatalogFromApi();
    setIsSyncing(false);
    setLastSyncedTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    toast("Warehouse inventory synchronized with live database.", "info");
  };

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
      if (selectedCategory !== "ALL" && product.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      return (
        product.sku.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    });
  }, [products, activeStatusTab, selectedCategory, searchQuery]);

  const handleExportCsv = () => {
    if (filteredProducts.length === 0) {
      toast("No inventory products to export.", "warning");
      return;
    }
    const exportableItems = filteredProducts.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: p.stock,
      minThreshold: p.minThreshold,
      status: computeStockStatus(p.stock, p.minThreshold),
      price: p.price,
      updatedAt: p.updatedAt,
    }));
    exportInventoryToCsv(exportableItems);
    toast(`Exported ${exportableItems.length} inventory records to CSV.`, "success");
  };

  const hasFilters = activeStatusTab !== "ALL" || selectedCategory !== "ALL" || searchQuery.trim() !== "";
  const resetFilters = () => {
    setActiveStatusTab("ALL");
    setSelectedCategory("ALL");
    setSearchQuery("");
  };

  return (
    <div data-testid="admin-inventory-page" className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Inventory</h1>
          <p>Monitor stock levels and manage adjustments.</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.syncTime} role="status">Updated {lastSyncedTime.toLowerCase()}</span>
          <button type="button" className={styles.secondaryButton} disabled={isSyncing} onClick={handleRefresh}>
            <RefreshCw size={15} aria-hidden="true" className={isSyncing ? "animate-spin" : undefined} />
            {isSyncing ? "Syncing…" : "Sync stock"}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={handleExportCsv}>
            <Download size={15} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </header>

      <dl className={styles.overview} aria-label="Stock overview">
        <div>
          <dt>Total products</dt>
          <dd>{overviewMetrics.totalSkus.toLocaleString("en-PH")}</dd>
        </div>
        <div>
          <dt>Units on hand</dt>
          <dd>{overviewMetrics.totalUnits.toLocaleString("en-PH")}</dd>
        </div>
        <div>
          <dt>Low stock</dt>
          <dd data-tone={overviewMetrics.lowStockCount > 0 ? "warning" : undefined}>{overviewMetrics.lowStockCount}</dd>
        </div>
        <div>
          <dt>Out of stock</dt>
          <dd data-tone={overviewMetrics.outOfStockCount > 0 ? "danger" : undefined}>{overviewMetrics.outOfStockCount}</dd>
        </div>
      </dl>

      <section className={styles.inventory} aria-label="Product inventory">
        <div className={styles.filters}>
          <div className={styles.search}>
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products or SKU…"
              aria-label="Search inventory SKUs"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <label htmlFor="inventory-cat-filter" className="sr-only">Filter by category</label>
          <select
            id="inventory-cat-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.categorySelect}
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category === "ALL" ? "All categories" : category}</option>
            ))}
          </select>
          <span className={styles.valuation}>Inventory value <strong>{formatPrice(overviewMetrics.totalInventoryValuation)}</strong></span>
        </div>

        <div className={styles.statusFilters} role="group" aria-label="Filter inventory by stock status">
          {STOCK_FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeStatusTab === tab.id}
              onClick={() => setActiveStatusTab(tab.id)}
            >
              {tab.label}<span>{statusTabCounts[tab.id]}</span>
            </button>
          ))}
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <caption className="sr-only">Inventory products, stock counts, minimum stock levels, and availability</caption>
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col" className={styles.stockColumn}>On hand</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    <Search size={24} aria-hidden="true" />
                    <p>No matching products</p>
                    <span>Try another search or adjust your filters.</span>
                    {hasFilters && <button type="button" onClick={resetFilters}>Clear filters</button>}
                  </td>
                </tr>
              ) : filteredProducts.map((product) => {
                const liveStatus = computeStockStatus(product.stock, product.minThreshold);
                const needsRestock = liveStatus !== "in-stock";
                return (
                  <tr key={product.id}>
                    <td className={styles.productCell}>
                      <p className={styles.productName}>{product.name}</p>
                      <div className={styles.productMeta}>
                        <span className={styles.sku}>{product.sku}</span>
                        <span aria-hidden="true">·</span>
                        <span>{product.category}</span>
                      </div>
                    </td>
                    <td className={styles.stockCell}>
                      <div className={styles.stockCount} data-tone={liveStatus === "low-stock" ? "warning" : liveStatus === "out-of-stock" ? "danger" : undefined}>
                        {product.stock.toLocaleString("en-PH")} <span>units</span>
                      </div>
                      <p className={styles.minimum}>Min. {product.minThreshold}</p>
                    </td>
                    <td className={styles.statusCell}>
                      <span className={styles.stockStatus} data-status={liveStatus}>
                        <span className={styles.statusDot} aria-hidden="true" />
                        {liveStatus === "in-stock" ? "In stock" : liveStatus === "low-stock" ? "Low stock" : "Out of stock"}
                      </span>
                      {needsRestock && <p className={styles.restockHint}>Add {product.minThreshold - product.stock + 1} to restock</p>}
                    </td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.adjustButton}
                        aria-label={`Adjust stock for ${product.name}`}
                        onClick={() => setAdjustingProduct(product)}
                      >
                        <SlidersHorizontal size={15} aria-hidden="true" />
                        <span>Adjust stock</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.tableFooter}>
          <span>{filteredProducts.length} of {products.length} products</span>
          {hasFilters && <button type="button" onClick={resetFilters}>Clear filters</button>}
        </footer>
      </section>

      <details className={styles.activity}>
        <summary>
          <History size={17} aria-hidden="true" />
          <h2>Recent adjustments</h2>
          <span className={styles.activityCount}>{adjustmentLogs.length} recorded</span>
          <ChevronDown size={16} className={styles.disclosureIcon} aria-hidden="true" />
        </summary>
        <div>
          {adjustmentLogs.length === 0 ? <p className={styles.activityEmpty}>No stock adjustments yet.</p> : (
            <ul className={styles.activityList}>
              {adjustmentLogs.slice(0, 8).map((entry) => {
                const delta = entry.newStock - entry.previousStock;
                return (
                  <li key={entry.id}>
                    <div className={styles.activityProduct}>
                      <p>{entry.productName}</p>
                      <span>{entry.sku} · {entry.reason}</span>
                    </div>
                    <div className={styles.activityDelta}>
                      <strong>{delta > 0 ? "+" : ""}{delta} units</strong>
                      <span>{entry.previousStock} → {entry.newStock}</span>
                    </div>
                    <time dateTime={entry.timestamp}>{formatDate(entry.timestamp)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>

      <AdjustStockModal product={adjustingProduct} onClose={() => setAdjustingProduct(null)} />
    </div>
  );
}
