"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBom } from "@/hooks/use-bom";
import { useCart } from "@/hooks/use-cart";
import { getProductByIdSync } from "@/services/catalog-service";
import { StockBadge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import type { StockStatus } from "@/types/product";

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(price);
}

export function BomClient() {
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("id");

  const {
    bomProjects,
    selectedBomId,
    setSelectedBomId,
    addBomProject,
    setBomQty,
    removeBomLineItem,
    deleteProject,
  } = useBom();

  const { addBundleToCart } = useCart();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync with search parameter if provided
  useEffect(() => {
    if (requestedId && bomProjects.some((p) => p.id === requestedId)) {
      setSelectedBomId(requestedId);
    }
  }, [requestedId, bomProjects, setSelectedBomId]);

  const startCreate = () => {
    setCreating(true);
    setNewName("");
    setNewBudget("");
    setTimeout(() => nameInputRef.current?.focus(), 60);
  };

  const confirmCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast("Please enter a valid project name", "warning");
      return;
    }
    const parsedBudget = newBudget ? Math.max(0, parseFloat(newBudget)) : undefined;
    const newId = addBomProject(trimmed, undefined, parsedBudget);
    setSelectedBomId(newId);
    setCreating(false);
    setNewName("");
    setNewBudget("");
  };

  const cancelCreate = () => {
    setCreating(false);
    setNewName("");
    setNewBudget("");
  };

  const selProj = useMemo(() => {
    return bomProjects.find((p) => p.id === selectedBomId) ?? bomProjects[0];
  }, [bomProjects, selectedBomId]);

  const lineItems = useMemo(() => {
    return selProj?.lineItems ?? [];
  }, [selProj]);

  // Helper to resolve product from live DB item or fallback sync catalog
  const resolveProduct = (li: {
    productId: string;
    product?: {
      id: string;
      name: string;
      sku: string;
      brand?: string;
      price: number;
      stock?: number;
      status?: StockStatus;
      image?: string;
    };
  }) => {
    if (li.product) {
      const stockVal = li.product.stock ?? 50;
      const statusVal: StockStatus =
        li.product.status === "in-stock" ||
        li.product.status === "low-stock" ||
        li.product.status === "out-of-stock"
          ? li.product.status
          : stockVal > 0
          ? "in-stock"
          : "out-of-stock";

      return {
        id: li.product.id,
        name: li.product.name,
        sku: li.product.sku,
        category: li.product.brand || "Hardware",
        price: Number(li.product.price),
        stock: stockVal,
        status: statusVal,
        image: li.product.image || "/images/products/placeholder.svg",
      };
    }
    return getProductByIdSync(li.productId);
  };

  const totalCost = useMemo(() => {
    return lineItems.reduce((sum, li) => {
      const p = resolveProduct(li);
      return sum + (p ? p.price * li.qty : 0);
    }, 0);
  }, [lineItems]);

  const totalComponentCount = useMemo(() => {
    return lineItems.reduce((sum, li) => sum + li.qty, 0);
  }, [lineItems]);

  const allInStock = useMemo(() => {
    if (lineItems.length === 0) return false;
    return lineItems.every((li) => {
      const p = resolveProduct(li);
      return p && (p.status === "in-stock" || p.stock >= li.qty);
    });
  }, [lineItems]);

  const budgetProgress = useMemo(() => {
    if (!selProj?.targetBudget || selProj.targetBudget <= 0) return null;
    const percent = Math.min(100, Math.round((totalCost / selProj.targetBudget) * 100));
    const isOver = totalCost > selProj.targetBudget;
    return {
      target: selProj.targetBudget,
      percent,
      isOver,
    };
  }, [selProj, totalCost]);

  // Export to CSV client-side with reference designators
  const handleExportCsv = () => {
    if (!selProj || lineItems.length === 0) {
      toast("No components to export in this project", "warning");
      return;
    }

    const headers = [
      "Part Name",
      "SKU",
      "Category",
      "Reference Designator",
      "Unit Price (PHP)",
      "Quantity",
      "Subtotal (PHP)",
      "Stock Status",
    ];
    const rows = lineItems.map((li) => {
      const p = resolveProduct(li);
      const name = p ? `"${p.name.replace(/"/g, '""')}"` : "Unknown";
      const sku = p ? p.sku : li.productId;
      const cat = p ? p.category : "";
      const ref = li.referenceDesignator ? `"${li.referenceDesignator}"` : "—";
      const price = p ? p.price.toFixed(2) : "0.00";
      const qty = li.qty;
      const subtotal = p ? (p.price * li.qty).toFixed(2) : "0.00";
      const status = p ? p.status : "unknown";
      return [name, sku, cat, ref, price, qty, subtotal, status].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanFileName = selProj.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    link.setAttribute("href", url);
    link.setAttribute("download", `${cleanFileName}-bom.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast(`Exported "${selProj.name}" BOM to CSV`, "success");
  };

  const handleTransferAllToCart = () => {
    if (!selProj || lineItems.length === 0) {
      toast("No components to transfer", "warning");
      return;
    }
    addBundleToCart(selProj.id, selProj.name, lineItems);
  };

  const handleDeleteProject = () => {
    if (!selProj) return;
    if (confirm(`Are you sure you want to delete "${selProj.name}"?`)) {
      deleteProject(selProj.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-mocha-bg">
      {/* ── Left Sidebar / Mobile Project Selector ── */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-mocha-border bg-mocha-bg-secondary">
        {/* Header & Create Project */}
        <div className="p-4 border-b border-mocha-border shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-mocha-text-muted mb-0.5">
            Bill of Materials (BOM)
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-base font-bold text-mocha-text">Projects</h1>
            {!creating && (
              <button
                type="button"
                onClick={startCreate}
                className="text-[11px] font-bold text-mocha-accent hover:text-mocha-accent/80 transition-colors px-2 py-1 rounded-lg hover:bg-mocha-accent/10 focus-visible:outline-2 focus-visible:outline-mocha-accent"
              >
                + New Project
              </button>
            )}
          </div>

          {creating && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                ref={nameInputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmCreate();
                  if (e.key === "Escape") cancelCreate();
                }}
                placeholder="Project name..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-mocha-bg border border-mocha-accent text-mocha-text outline-none focus:ring-2 focus:ring-mocha-accent/30"
              />
              <input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="Target budget (PHP, optional)"
                className="w-full px-3 py-1.5 rounded-xl text-xs bg-mocha-bg border border-mocha-border text-mocha-text outline-none focus:ring-1 focus:ring-mocha-accent/50"
              />
              <div className="flex gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={confirmCreate}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-90 transition-opacity"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={cancelCreate}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-mocha-text-muted hover:text-mocha-danger bg-mocha-panel hover:bg-mocha-danger/10 border border-mocha-border transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 flex md:flex-col gap-1.5">
          {bomProjects.map((proj) => {
            const isActive = proj.id === selProj?.id;
            const projLineItems = proj.lineItems ?? [];
            const projItemCount = projLineItems.reduce((s, li) => s + li.qty, 0);
            const projTotal = projLineItems.reduce((sum, li) => {
              const p = resolveProduct(li);
              return sum + (p ? p.price * li.qty : 0);
            }, 0);

            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => setSelectedBomId(proj.id)}
                className={`text-left p-3 rounded-xl transition-all shrink-0 min-w-[200px] md:min-w-0 md:w-full border ${
                  isActive
                    ? "bg-mocha-accent/15 border-mocha-accent text-mocha-accent shadow-sm"
                    : "bg-mocha-panel border-mocha-border hover:border-mocha-border-strong text-mocha-text hover:bg-mocha-panel-raised"
                }`}
              >
                <p className="text-xs md:text-sm font-bold truncate leading-snug">
                  {proj.name}
                </p>
                <p className="text-[11px] font-mono mt-1 text-mocha-text-muted">
                  {projItemCount} items {projTotal > 0 && `· ${formatPrice(projTotal)}`}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Right Content: Selected Project Details ── */}
      {selProj ? (
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Project Header with Delete Action */}
          <div className="px-4 py-3 bg-mocha-bg border-b border-mocha-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm md:text-base font-bold text-mocha-text">
                {selProj.name}
              </h2>
              {selProj.description && (
                <p className="text-xs text-mocha-text-muted mt-0.5">{selProj.description}</p>
              )}
            </div>
            {bomProjects.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteProject}
                className="text-xs font-medium text-mocha-text-muted hover:text-mocha-danger transition-colors px-2.5 py-1 rounded-lg border border-mocha-border hover:border-mocha-danger/40"
              >
                Delete Project
              </button>
            )}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 shrink-0 bg-mocha-bg border-b border-mocha-border">
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted mb-0.5">
                Total Estimated Cost
              </p>
              <p className="text-xl md:text-2xl font-bold font-mono tracking-tight text-mocha-accent">
                {formatPrice(totalCost)}
              </p>
              {budgetProgress && (
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] font-mono text-mocha-text-muted mb-1">
                    <span>Target: {formatPrice(budgetProgress.target)}</span>
                    <span className={budgetProgress.isOver ? "text-mocha-danger font-bold" : "text-mocha-success"}>
                      {budgetProgress.percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-mocha-bg overflow-hidden border border-mocha-border">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetProgress.isOver ? "bg-mocha-danger" : "bg-mocha-success"
                      }`}
                      style={{ width: `${Math.min(100, budgetProgress.percent)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted mb-0.5">
                Total Components
              </p>
              <p className="text-xl md:text-2xl font-bold font-mono text-mocha-text">
                {totalComponentCount} <span className="text-xs font-normal text-mocha-text-muted">units</span>
              </p>
              <p className="text-[11px] text-mocha-text-muted mt-1">
                {lineItems.length} unique parts
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-mocha-panel border border-mocha-border shadow-sm flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  allInStock
                    ? "bg-mocha-success/15 text-mocha-success border border-mocha-success/30"
                    : lineItems.length === 0
                    ? "bg-mocha-panel-raised text-mocha-text-muted border border-mocha-border"
                    : "bg-mocha-warning/15 text-mocha-warning border border-mocha-warning/30"
                }`}
              >
                <span className="text-sm font-bold">{allInStock ? "✓" : lineItems.length === 0 ? "—" : "!"}</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted">
                  Stock Status
                </p>
                <p
                  className={`text-xs md:text-sm font-bold ${
                    allInStock
                      ? "text-mocha-success"
                      : lineItems.length === 0
                      ? "text-mocha-text-muted"
                      : "text-mocha-warning"
                  }`}
                >
                  {allInStock ? "All In Stock" : lineItems.length === 0 ? "No Components" : "Some Items Unavailable"}
                </p>
              </div>
            </div>
          </div>

          {/* Component Line Items Table / List */}
          <div className="flex-1 overflow-y-auto p-4">
            {lineItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-56 rounded-2xl bg-mocha-panel border border-mocha-border p-6 text-center">
                <svg className="w-12 h-12 text-mocha-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-sm font-semibold text-mocha-text">No components in this BOM project yet</p>
                <p className="text-xs text-mocha-text-muted mt-1 max-w-sm">
                  Browse the catalog and use the BOM Chooser to add sensors, controllers, and passives directly to this project.
                </p>
                <Link
                  href="/products"
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-mocha-accent text-mocha-bg hover:opacity-90 transition-opacity"
                >
                  Browse Catalog
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden border border-mocha-border bg-mocha-panel shadow-sm">
                {/* Table Header for desktop */}
                <div className="hidden 2xl:grid items-center px-4 py-3 bg-mocha-bg-secondary border-b border-mocha-border grid-cols-[56px_minmax(0,1fr)_110px_90px_100px_110px_110px_80px_40px] text-[10px] font-bold uppercase tracking-widest text-mocha-text-muted">
                  <span>Part</span>
                  <span>Component Details</span>
                  <span>Category</span>
                  <span>Designator</span>
                  <span>Unit Price</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-right">Subtotal</span>
                  <span className="text-center">Stock</span>
                  <span />
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-mocha-border">
                  {lineItems.map((li) => {
                    const prod = resolveProduct(li);
                    if (!prod) return null;
                    const subtotal = prod.price * li.qty;

                    return (
                      <div
                        key={li.productId}
                        data-mobile-bom-item
                        className="p-3 2xl:px-4 2xl:py-3.5 flex flex-col 2xl:grid 2xl:grid-cols-[56px_minmax(0,1fr)_110px_90px_100px_110px_110px_80px_40px] 2xl:items-center gap-3 hover:bg-mocha-panel-raised/40 transition-colors"
                      >
                        {/* Part Image */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-mocha-border bg-mocha-bg shrink-0">
                          <Image
                            src={prod.image}
                            alt={prod.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>

                        {/* Name & SKU */}
                        <div className="min-w-0">
                          <Link
                            href={`/products/${prod.id}`}
                            className="text-xs md:text-sm font-bold text-mocha-text hover:text-mocha-accent transition-colors line-clamp-1"
                          >
                            {prod.name}
                          </Link>
                          <p className="text-[10px] font-mono text-mocha-text-muted mt-0.5">
                            {prod.sku}
                          </p>
                        </div>

                        {/* Category */}
                        <div>
                          <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full bg-mocha-accent/10 text-mocha-accent border border-mocha-accent/20">
                            {prod.category}
                          </span>
                        </div>

                        {/* Reference Designator */}
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-mocha-bg border border-mocha-border text-mocha-text-muted">
                            {li.referenceDesignator || "—"}
                          </span>
                        </div>

                        {/* Unit Price */}
                        <div className="text-xs font-mono font-bold text-mocha-text">
                          {formatPrice(prod.price)}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-start 2xl:justify-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Decrease quantity of ${prod.name}`}
                            onClick={() => {
                              if (li.qty <= 1) {
                                removeBomLineItem(selProj.id, prod.id);
                              } else {
                                setBomQty(selProj.id, prod.id, li.qty - 1);
                              }
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-mocha-bg border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent transition-colors"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-xs font-bold font-mono text-mocha-text">
                            {li.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity of ${prod.name}`}
                            disabled={li.qty >= prod.stock}
                            onClick={() => {
                              if (li.qty < prod.stock) {
                                setBomQty(selProj.id, prod.id, li.qty + 1);
                              } else {
                                toast(`Maximum stock for ${prod.name} is ${prod.stock}`, "warning");
                              }
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold bg-mocha-bg border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-xs font-mono font-bold text-mocha-accent text-left 2xl:text-right">
                          {formatPrice(subtotal)}
                        </div>

                        {/* Stock Badge */}
                        <div className="flex justify-start 2xl:justify-center">
                          <StockBadge status={prod.status} stockCount={prod.stock} />
                        </div>

                        {/* Delete Action */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            aria-label={`Remove ${prod.name} from project`}
                            onClick={() => removeBomLineItem(selProj.id, prod.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-mocha-text-muted hover:text-mocha-danger hover:bg-mocha-danger/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Bottom Action Bar ── */}
          <div className="p-4 border-t border-mocha-border bg-mocha-bg-secondary flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted">
                  Total BOM Cost
                </p>
                <p className="text-lg font-bold font-mono text-mocha-accent">
                  {formatPrice(totalCost)}
                </p>
              </div>
              <div className="border-l border-mocha-border pl-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-mocha-text-muted">
                  Total Items
                </p>
                <p className="text-lg font-bold font-mono text-mocha-text">
                  {totalComponentCount}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={lineItems.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-mocha-panel border border-mocha-border text-mocha-text hover:border-mocha-accent hover:text-mocha-accent disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>

              <button
                type="button"
                onClick={handleTransferAllToCart}
                disabled={lineItems.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                Transfer All to Cart
              </button>
            </div>
          </div>
        </main>
      ) : null}
    </div>
  );
}
