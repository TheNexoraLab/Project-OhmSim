"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import {
  useAdminCatalogStore,
  upsertAdminProduct,
  computeStockStatus,
  type AdminProductRecord,
} from "@/components/admin/admin-catalog-store";

interface SpecKeyValueRow {
  id: string;
  key: string;
  value: string;
}

const STOCK_STATUS_BADGE_TOKENS = {
  "in-stock": {
    label: "In-Stock",
    text: "#A6E3A1",
    bg: "rgba(166, 227, 161, 0.12)",
    border: "rgba(166, 227, 161, 0.32)",
  },
  "low-stock": {
    label: "Low-Stock",
    text: "#F9E2AF",
    bg: "rgba(249, 226, 175, 0.12)",
    border: "rgba(249, 226, 175, 0.32)",
  },
  "out-of-stock": {
    label: "Out-of-Stock",
    text: "#F38BA8",
    bg: "rgba(243, 139, 168, 0.12)",
    border: "rgba(243, 139, 168, 0.32)",
  },
} as const;

export function ProductsClient() {
  const { products, categories } = useAdminCatalogStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Modal State ("add" | "edit" | null)
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editingProduct, setEditingProduct] =
    useState<AdminProductRecord | null>(null);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const liveStatus = computeStockStatus(
        product.stock,
        product.minThreshold
      );

      if (
        selectedCategory !== "ALL" &&
        product.category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      if (selectedStatus !== "ALL" && liveStatus !== selectedStatus) {
        return false;
      }

      if (q) {
        const matchSku = product.sku.toLowerCase().includes(q);
        const matchName = product.name.toLowerCase().includes(q);
        const matchBrand = (product.brand || "").toLowerCase().includes(q);
        const matchCategory = product.category.toLowerCase().includes(q);
        if (!matchSku && !matchName && !matchBrand && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  const kpiSummary = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    for (const p of products) {
      const st = computeStockStatus(p.stock, p.minThreshold);
      if (st === "out-of-stock") outOfStock += 1;
      else if (st === "low-stock") lowStock += 1;
      else inStock += 1;
    }

    return {
      total: products.length,
      inStock,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setModalMode("add");
  };

  const handleOpenEditModal = (product: AdminProductRecord) => {
    setEditingProduct(product);
    setModalMode("edit");
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setEditingProduct(null);
  };

  return (
    <div
      data-testid="admin-products-page"
      className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#313244]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#89B4FA]/12 text-[#89B4FA] border border-[#89B4FA]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#89B4FA]" />
              CATALOG &amp; COMPONENT ENGINEERING
            </span>
            <span className="text-xs font-mono text-[#A6ADC8]">
              {products.length} Active SKUs
            </span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-[#CDD6F4] tracking-tight">
            Admin Product Management
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#BAC2DE]">
            Manage hardware SKUs, parametric technical specifications,
            datasheets, and pricing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/categories"
            prefetch={false}
            className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#1E1E2E] border border-[#313244] hover:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] inline-flex items-center gap-1.5 transition-colors"
          >
            <span>Manage Categories</span>
            <span className="font-mono text-[#89B4FA]">
              ({categories.length})
            </span>
          </Link>

          <Button
            type="button"
            variant="accent"
            size="small"
            data-testid="open-add-product-modal-btn"
            onClick={handleOpenAddModal}
            className="text-xs font-bold gap-1.5"
          >
            <svg
              aria-hidden="true"
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Catalog Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Surface
          variant="panel"
          className="p-4 bg-[#1E1E2E] border border-[#313244] flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A6ADC8]">
              Total Catalog SKUs
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#CDD6F4]">
              {kpiSummary.total}
            </p>
          </div>
          <Badge variant="primary" className="font-mono">
            ALL SKUS
          </Badge>
        </Surface>

        <Surface
          variant="panel"
          className="p-4 bg-[#1E1E2E] border border-[#313244] flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A6ADC8]">
              In-Stock Healthy
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#A6E3A1]">
              {kpiSummary.inStock}
            </p>
          </div>
          <Badge variant="success" className="font-mono">
            ACTIVE
          </Badge>
        </Surface>

        <Surface
          variant="panel"
          className="p-4 bg-[#1E1E2E] border border-[#313244] flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A6ADC8]">
              Low-Stock SKUs
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#F9E2AF]">
              {kpiSummary.lowStock}
            </p>
          </div>
          <Badge variant="warning" className="font-mono">
            ALERT
          </Badge>
        </Surface>

        <Surface
          variant="panel"
          className="p-4 bg-[#1E1E2E] border border-[#313244] flex items-center justify-between"
        >
          <div>
            <p className="text-[11px] font-mono uppercase text-[#A6ADC8]">
              Out-of-Stock SKUs
            </p>
            <p className="mt-1 text-xl font-bold font-mono text-[#F38BA8]">
              {kpiSummary.outOfStock}
            </p>
          </div>
          <Badge variant="danger" className="font-mono">
            DEPLETED
          </Badge>
        </Surface>
      </div>

      {/* Search & Category Filter Bar */}
      <Surface
        variant="panel"
        data-testid="products-filter-bar"
        className="p-4 sm:p-5 bg-[#1E1E2E] border border-[#313244] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
      >
        <div className="relative flex-1 min-w-0">
          <label htmlFor="admin-products-search" className="sr-only">
            Search products by name, SKU, or brand
          </label>
          <svg
            aria-hidden="true"
            className="w-4 h-4 text-[#A6ADC8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="admin-products-search"
            data-testid="admin-products-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by component name, SKU (e.g. ESP32-WROOM-32U), or brand..."
            className="w-full min-h-[44px] pl-10 pr-10 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs text-[#CDD6F4] placeholder:text-[#A6ADC8] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              aria-label="Clear product search"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] inline-flex items-center justify-center rounded-lg text-xs text-[#A6ADC8] hover:text-[#CDD6F4]"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="product-category-filter"
              className="text-xs font-mono text-[#A6ADC8]"
            >
              Category:
            </label>
            <select
              id="product-category-filter"
              data-testid="product-category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter Dropdown */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="product-status-filter"
              className="text-xs font-mono text-[#A6ADC8]"
            >
              Status:
            </label>
            <select
              id="product-status-filter"
              data-testid="product-status-filter-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] hover:border-[#45475A] focus:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="in-stock">In-Stock</option>
              <option value="low-stock">Low-Stock</option>
              <option value="out-of-stock">Out-of-Stock</option>
            </select>
          </div>
        </div>
      </Surface>

      {/* Products Master Table */}
      <Surface
        variant="panel"
        data-testid="products-table-panel"
        className="bg-[#1E1E2E] border border-[#313244] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
      >
        <div
          role="region"
          aria-label="Products catalog table"
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table
            data-testid="admin-products-table"
            className="w-full min-w-[980px] text-left border-collapse"
          >
            <thead>
              <tr className="bg-[#181825] border-b border-[#313244] text-[10px] font-mono font-bold uppercase tracking-wider text-[#A6ADC8]">
                <th scope="col" className="py-3.5 pl-5 pr-3">
                  SKU
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Image
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Component Name
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Category
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Price
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Stock Level
                </th>
                <th scope="col" className="py-3.5 px-3">
                  Status
                </th>
                <th scope="col" className="py-3.5 pl-3 pr-5 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#313244] text-xs">
              {filteredProducts.map((product) => {
                const liveStatus = computeStockStatus(
                  product.stock,
                  product.minThreshold
                );
                const statusBadge = STOCK_STATUS_BADGE_TOKENS[liveStatus];
                const specCount = Object.keys(product.specs || {}).length;

                return (
                  <tr
                    key={product.id}
                    data-testid={`product-row-${product.sku}`}
                    className="hover:bg-[#313244]/35 transition-colors"
                  >
                    {/* 1. SKU */}
                    <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#89B4FA] text-xs">
                        {product.sku}
                      </span>
                      <span className="block text-[10px] font-mono text-[#A6ADC8] mt-0.5">
                        {product.brand || "Generic"}
                      </span>
                    </td>

                    {/* 2. Image Thumbnail */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#181825] border border-[#313244] shrink-0 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>

                    {/* 3. Component Name */}
                    <td className="py-3.5 px-3 max-w-[300px]">
                      <div className="font-bold text-[#CDD6F4] leading-snug">
                        {product.name}
                      </div>
                      <div className="text-[11px] text-[#A6ADC8] truncate mt-0.5">
                        {product.shortDescription}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-[#94E2D5]">
                          {specCount} technical specs
                        </span>
                        {product.datasheetUrl && (
                          <a
                            href={product.datasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-[#89B4FA] hover:underline"
                          >
                            Datasheet PDF ↗
                          </a>
                        )}
                      </div>
                    </td>

                    {/* 4. Category */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <Badge variant="neutral" className="font-mono">
                        {product.category}
                      </Badge>
                    </td>

                    {/* 5. Price */}
                    <td className="py-3.5 px-3 font-mono font-bold text-[#CDD6F4] whitespace-nowrap">
                      {formatPrice(product.price)}
                    </td>

                    {/* 6. Stock Level */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#CDD6F4]">
                        {product.stock} units
                      </div>
                      <div className="text-[10px] font-mono text-[#A6ADC8]">
                        Min Threshold: {product.minThreshold}
                      </div>
                    </td>

                    {/* 7. Status */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        data-testid={`product-status-${product.sku}`}
                        style={{
                          backgroundColor: statusBadge.bg,
                          color: statusBadge.text,
                          borderColor: statusBadge.border,
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase border tracking-wide"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: statusBadge.text }}
                        />
                        <span>{statusBadge.label}</span>
                      </span>
                    </td>

                    {/* 8. Actions */}
                    <td className="py-3.5 pl-3 pr-5 text-right whitespace-nowrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="compact"
                        data-testid={`edit-product-btn-${product.sku}`}
                        onClick={() => handleOpenEditModal(product)}
                        className="text-xs font-semibold"
                      >
                        Edit Product
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 px-6 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center gap-3">
                      <p className="text-sm font-bold text-[#CDD6F4]">
                        No components match your filter criteria
                      </p>
                      <p className="text-xs text-[#A6ADC8]">
                        Try clearing your search keyword or switching the
                        category filter back to All Categories.
                      </p>
                      <Button
                        type="button"
                        variant="surface"
                        size="small"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("ALL");
                          setSelectedStatus("ALL");
                        }}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Add / Edit Product Modal */}
      {modalMode && (
        <ProductFormModal
          key={editingProduct ? `edit-${editingProduct.id}` : "add-new-product"}
          mode={modalMode}
          initialProduct={editingProduct}
          categoryOptions={categories.map((c) => c.name)}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

interface ProductFormModalProps {
  mode: "add" | "edit";
  initialProduct: AdminProductRecord | null;
  categoryOptions: string[];
  onClose: () => void;
}

function ProductFormModal({
  mode,
  initialProduct,
  categoryOptions,
  onClose,
}: ProductFormModalProps) {
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [brand, setBrand] = useState(initialProduct?.brand ?? "Espressif");
  const [category, setCategory] = useState(
    initialProduct?.category ?? categoryOptions[0] ?? "Microcontrollers"
  );
  const [price, setPrice] = useState(
    initialProduct ? String(initialProduct.price) : "250"
  );
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct ? String(initialProduct.stock) : "45"
  );
  const [minThreshold, setMinThreshold] = useState(
    initialProduct ? String(initialProduct.minThreshold) : "15"
  );
  const [shortDescription, setShortDescription] = useState(
    initialProduct?.shortDescription ?? ""
  );
  const [fullDescription, setFullDescription] = useState(
    initialProduct?.fullDescription ?? ""
  );
  const [datasheetUrl, setDatasheetUrl] = useState(
    initialProduct?.datasheetUrl ?? ""
  );
  const [imageUrl, setImageUrl] = useState(
    initialProduct?.image ??
      "https://images.unsplash.com/photo-1634452015397-ad0686a2ae2d?w=400&h=300&fit=crop&auto=format"
  );

  const [specRows, setSpecRows] = useState<SpecKeyValueRow[]>(() => {
    const entries = Object.entries(initialProduct?.specs ?? {});
    if (entries.length === 0) {
      return [
        { id: "spec-1", key: "Operating Voltage", value: "3.3V – 5V DC" },
        { id: "spec-2", key: "Package / Footprint", value: "Breakout Module" },
      ];
    }
    return entries.map(([key, value], index) => ({
      id: `spec-${index}`,
      key,
      value,
    }));
  });

  const [formError, setFormError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleAddSpecRow = () => {
    setSpecRows((prev) => [
      ...prev,
      { id: `spec-${Date.now()}-${prev.length}`, key: "", value: "" },
    ]);
  };

  const handleRemoveSpecRow = (id: string) => {
    setSpecRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSpecChange = (
    id: string,
    field: "key" | "value",
    newValue: string
  ) => {
    setSpecRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: newValue } : row))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sku.trim() || !name.trim()) {
      setFormError("SKU and Component Name are required fields.");
      return;
    }

    const parsedPrice = Number(price);
    const parsedStock = Number(stockQuantity);
    const parsedThreshold = Number(minThreshold);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError("Please enter a valid non-negative price.");
      return;
    }

    if (Number.isNaN(parsedStock) || parsedStock < 0) {
      setFormError("Please enter a valid non-negative stock quantity.");
      return;
    }

    const specsRecord: Record<string, string> = {};
    for (const row of specRows) {
      const k = row.key.trim();
      const v = row.value.trim();
      if (k && v) {
        specsRecord[k] = v;
      }
    }

    const saved = upsertAdminProduct({
      id: initialProduct?.id,
      sku,
      name,
      brand,
      category,
      price: parsedPrice,
      stock: parsedStock,
      minThreshold: Number.isNaN(parsedThreshold) ? 15 : parsedThreshold,
      shortDescription: shortDescription || name,
      fullDescription:
        fullDescription ||
        `${name} electronic component verified for OhmSim catalog.`,
      datasheetUrl,
      image: imageUrl,
      specs: specsRecord,
    });

    toast(
      mode === "add"
        ? `Added new component ${saved.sku} (${saved.name}) to catalog.`
        : `Updated component ${saved.sku} (${saved.name}).`,
      "success"
    );
    onClose();
  };

  return (
    <div
      data-testid="product-form-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
      />

      {/* Modal Box */}
      <div
        data-testid="product-form-modal"
        className="relative z-10 w-full max-w-3xl max-h-[90vh] bg-[#1E1E2E] border border-[#45475A] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden text-[#CDD6F4]"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#181825] border-b border-[#313244] flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#89B4FA] font-bold">
              {mode === "add" ? "NEW CATALOG SKU" : `EDITING SKU · ${initialProduct?.sku}`}
            </span>
            <h2
              id="product-modal-title"
              className="text-lg font-bold text-[#CDD6F4]"
            >
              {mode === "add" ? "Add New Product" : "Edit Product Specifications"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close product modal"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl bg-[#1E1E2E] border border-[#313244] text-[#BAC2DE] hover:text-[#CDD6F4] hover:border-[#89B4FA] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5 text-xs"
        >
          {formError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#F38BA8]/12 border border-[#F38BA8]/40 text-[#F38BA8] font-mono"
            >
              {formError}
            </div>
          )}

          {/* Primary Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="prod-sku-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                SKU Code *
              </label>
              <input
                id="prod-sku-input"
                data-testid="input-product-sku"
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. STM32-F103C8T6"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-brand-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Brand / Manufacturer *
              </label>
              <input
                id="prod-brand-input"
                data-testid="input-product-brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. STMicroelectronics"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-category-select"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Category *
              </label>
              <select
                id="prod-category-select"
                data-testid="select-product-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prod-name-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Product Name *
              </label>
              <input
                id="prod-name-input"
                data-testid="input-product-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. STM32F103C8T6 ARM Cortex-M3 Minimum System Board"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-short-desc-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Short Description / Subtitle
              </label>
              <input
                id="prod-short-desc-input"
                data-testid="input-product-short-desc"
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="e.g. 72MHz 32-bit ARM Microcontroller Module"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Inventory Thresholds */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="prod-price-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Unit Price (PHP) *
              </label>
              <input
                id="prod-price-input"
                data-testid="input-product-price"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-stock-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Stock Quantity *
              </label>
              <input
                id="prod-stock-input"
                data-testid="input-product-stock"
                type="number"
                min="0"
                step="1"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-threshold-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Min Stock Threshold *
              </label>
              <input
                id="prod-threshold-input"
                data-testid="input-product-threshold"
                type="number"
                min="0"
                step="1"
                required
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>
          </div>

          {/* Full Description */}
          <div>
            <label
              htmlFor="prod-full-desc-textarea"
              className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
            >
              Full Technical Description
            </label>
            <textarea
              id="prod-full-desc-textarea"
              data-testid="input-product-full-desc"
              rows={3}
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Detailed architectural overview, pinout notes, and recommended lab applications..."
              className="w-full p-3.5 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            />
          </div>

          {/* Datasheet URL & Thumbnail URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="prod-datasheet-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Datasheet URL (PDF)
              </label>
              <input
                id="prod-datasheet-input"
                data-testid="input-product-datasheet"
                type="url"
                value={datasheetUrl}
                onChange={(e) => setDatasheetUrl(e.target.value)}
                placeholder="https://datasheets.ohmsim.ph/component.pdf"
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="prod-image-input"
                className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
              >
                Image Thumbnail URL
              </label>
              <input
                id="prod-image-input"
                data-testid="input-product-image"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
              />
            </div>
          </div>

          {/* Technical Specs Key-Values Editor */}
          <div className="p-4 rounded-xl bg-[#181825] border border-[#313244] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase text-[#89B4FA]">
                  Technical Specifications (Key-Value Pairs)
                </h3>
                <p className="text-[11px] text-[#A6ADC8]">
                  Define electrical and mechanical parameters for parametric
                  search.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="compact"
                data-testid="add-spec-row-btn"
                onClick={handleAddSpecRow}
                className="text-[11px] font-mono"
              >
                + Add Spec Row
              </Button>
            </div>

            <div className="space-y-2">
              {specRows.map((row, idx) => (
                <div
                  key={row.id}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    aria-label={`Specification key ${idx + 1}`}
                    value={row.key}
                    onChange={(e) =>
                      handleSpecChange(row.id, "key", e.target.value)
                    }
                    placeholder="Parameter (e.g. Operating Voltage)"
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#11111B] border border-[#313244] font-mono text-xs text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
                  />
                  <input
                    type="text"
                    aria-label={`Specification value ${idx + 1}`}
                    value={row.value}
                    onChange={(e) =>
                      handleSpecChange(row.id, "value", e.target.value)
                    }
                    placeholder="Value (e.g. 3.3V – 5V)"
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#11111B] border border-[#313244] font-mono text-xs text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={`Remove specification row ${idx + 1}`}
                    onClick={() => handleRemoveSpecRow(row.id)}
                    className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg bg-[#1E1E2E] border border-[#313244] text-[#A6ADC8] hover:text-[#F38BA8] hover:border-[#F38BA8]/40 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-[#313244] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="surface"
              size="small"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="accent"
              size="small"
              data-testid="submit-product-form-btn"
              className="font-bold"
            >
              {mode === "add" ? "Save New Product" : "Save Product Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

