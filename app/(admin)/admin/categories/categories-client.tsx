"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";
import {
  useAdminCatalogStore,
  addAdminCategory,
  type AdminCategoryIconKey,
} from "@/components/admin/admin-catalog-store";

const CATEGORY_ICON_OPTIONS: {
  key: AdminCategoryIconKey;
  label: string;
  accent: string;
}[] = [
  { key: "mcu", label: "Microcontroller Core", accent: "#89B4FA" },
  { key: "sensor", label: "Sensor / Transducer", accent: "#94E2D5" },
  { key: "ic", label: "Integrated Circuit (IC)", accent: "#CBA6F7" },
  { key: "board", label: "Development Board", accent: "#74C7EC" },
  { key: "passive", label: "Passive Component", accent: "#F9E2AF" },
  { key: "power", label: "Power / RF Module", accent: "#A6E3A1" },
];

function renderCategoryIcon(iconKey: AdminCategoryIconKey) {
  switch (iconKey) {
    case "mcu":
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
          <line x1="20" y1="9" x2="23" y2="9" />
          <line x1="20" y1="14" x2="23" y2="14" />
          <line x1="1" y1="9" x2="4" y2="9" />
          <line x1="1" y1="14" x2="4" y2="14" />
        </svg>
      );
    case "sensor":
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 12h4l3-9 4 18 3-9h6" />
        </svg>
      );
    case "ic":
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <line x1="2" y1="8" x2="6" y2="8" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="2" y1="16" x2="6" y2="16" />
          <line x1="18" y1="8" x2="22" y2="8" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="18" y1="16" x2="22" y2="16" />
        </svg>
      );
    case "board":
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <circle cx="6" cy="8" r="1" />
          <circle cx="18" cy="8" r="1" />
          <circle cx="6" cy="16" r="1" />
          <circle cx="18" cy="16" r="1" />
          <path d="M9 10h6v4H9z" />
        </svg>
      );
    case "passive":
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="2" y1="12" x2="6" y2="12" />
          <rect x="6" y="8" width="12" height="8" rx="1" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      );
    case "power":
    default:
      return (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
  }
}

export function CategoriesClient() {
  const { categories, products } = useAdminCatalogStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const enrichedCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return categories
      .map((cat) => {
        const matchingProducts = products.filter(
          (p) => p.category.toLowerCase() === cat.name.toLowerCase()
        );
        const totalUnits = matchingProducts.reduce(
          (sum, p) => sum + p.stock,
          0
        );
        const iconMeta =
          CATEGORY_ICON_OPTIONS.find((opt) => opt.key === cat.icon) ??
          CATEGORY_ICON_OPTIONS[0];

        return {
          ...cat,
          productCount: matchingProducts.length,
          totalUnits,
          accentColor: iconMeta.accent,
        };
      })
      .filter((cat) => {
        if (!q) return true;
        return (
          cat.name.toLowerCase().includes(q) ||
          cat.slug.toLowerCase().includes(q) ||
          cat.description.toLowerCase().includes(q)
        );
      });
  }, [categories, products, searchQuery]);

  return (
    <div
      data-testid="admin-categories-page"
      className="flex flex-col gap-6 max-w-[1600px] mx-auto w-full"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#313244]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#89B4FA]/12 text-[#89B4FA] border border-[#89B4FA]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#89B4FA]" />
              TAXONOMY &amp; PARAMETRIC CLASSIFICATION
            </span>
            <span className="text-xs font-mono text-[#A6ADC8]">
              {categories.length} Active Categories
            </span>
          </div>
          <h1 className="mt-2 text-xl sm:text-2xl font-bold text-[#CDD6F4] tracking-tight">
            Admin Category Management
          </h1>
          <p className="mt-0.5 text-xs sm:text-sm text-[#BAC2DE]">
            Organize component taxonomy, parametric filter groups, and SKU
            distribution across the catalog.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/products"
            prefetch={false}
            className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#1E1E2E] border border-[#313244] hover:border-[#89B4FA] text-xs font-semibold text-[#CDD6F4] inline-flex items-center gap-1.5 transition-colors"
          >
            <span>← Back to Products</span>
          </Link>

          <Button
            type="button"
            variant="accent"
            size="small"
            data-testid="open-add-category-modal-btn"
            onClick={() => setIsAddModalOpen(true)}
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
            <span>Add Category</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <Surface
        variant="panel"
        className="p-4 bg-[#1E1E2E] border border-[#313244] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <div className="relative flex-1">
          <label htmlFor="admin-categories-search" className="sr-only">
            Search categories by name, slug, or description
          </label>
          <input
            id="admin-categories-search"
            data-testid="admin-categories-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter categories by name, slug (e.g. microcontrollers), or description..."
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#181825] border border-[#313244] focus:border-[#89B4FA] text-xs text-[#CDD6F4] placeholder:text-[#A6ADC8] focus:outline-none"
          />
        </div>
        <div className="text-xs font-mono text-[#A6ADC8] shrink-0">
          TOTAL ASSIGNED SKUS: {products.length}
        </div>
      </Surface>

      {/* Categories Cards Grid */}
      <div
        data-testid="admin-categories-grid"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {enrichedCategories.map((cat) => (
          <Surface
            key={cat.id}
            variant="panel"
            data-testid={`category-card-${cat.slug}`}
            className="p-5 bg-[#1E1E2E] border border-[#313244] hover:border-[#45475A] transition-colors flex flex-col justify-between gap-4 shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{
                    backgroundColor: `${cat.accentColor}1F`,
                    borderColor: `${cat.accentColor}4D`,
                    color: cat.accentColor,
                  }}
                >
                  {renderCategoryIcon(cat.icon)}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-bold text-[#CDD6F4] truncate">
                    {cat.name}
                  </h2>
                  <p className="text-xs font-mono text-[#89B4FA]">
                    /{cat.slug}
                  </p>
                </div>
              </div>

              <Badge
                variant={cat.productCount > 0 ? "primary" : "neutral"}
                className="font-mono shrink-0"
              >
                {cat.productCount} {cat.productCount === 1 ? "Product" : "Products"}
              </Badge>
            </div>

            <p className="text-xs text-[#BAC2DE] leading-relaxed">
              {cat.description}
            </p>

            <div className="pt-3 border-t border-[#313244] flex items-center justify-between text-xs font-mono">
              <span className="text-[#A6ADC8]">
                Stock Volume:{" "}
                <strong className="text-[#CDD6F4]">{cat.totalUnits} units</strong>
              </span>
              <Link
                href="/admin/products"
                prefetch={false}
                className="text-[#89B4FA] hover:underline font-semibold"
              >
                View SKUs →
              </Link>
            </div>
          </Surface>
        ))}
      </div>

      {/* Categories Master Table */}
      <Surface
        variant="panel"
        data-testid="categories-table-panel"
        className="bg-[#1E1E2E] border border-[#313244] overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.22)]"
      >
        <div className="px-5 py-3.5 border-b border-[#313244] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#CDD6F4]">
            Category Taxonomy Summary Table
          </h2>
          <Badge variant="neutral" className="font-mono">
            {enrichedCategories.length} Categories
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table
            data-testid="admin-categories-table"
            className="w-full min-w-[720px] text-left border-collapse"
          >
            <thead>
              <tr className="bg-[#181825] border-b border-[#313244] text-[10px] font-mono font-bold uppercase tracking-wider text-[#A6ADC8]">
                <th scope="col" className="py-3 pl-5 pr-3">
                  Category Name
                </th>
                <th scope="col" className="py-3 px-3">
                  Slug
                </th>
                <th scope="col" className="py-3 px-3">
                  Description
                </th>
                <th scope="col" className="py-3 px-3">
                  Product Count
                </th>
                <th scope="col" className="py-3 pl-3 pr-5 text-right">
                  Total Units
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244] text-xs">
              {enrichedCategories.map((cat) => (
                <tr
                  key={cat.id}
                  data-testid={`category-row-${cat.slug}`}
                  className="hover:bg-[#313244]/35 transition-colors"
                >
                  <td className="py-3.5 pl-5 pr-3 font-bold text-[#CDD6F4] whitespace-nowrap">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-[#89B4FA] whitespace-nowrap">
                    {cat.slug}
                  </td>
                  <td className="py-3.5 px-3 text-[#BAC2DE] max-w-md truncate">
                    {cat.description}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-[#CDD6F4] whitespace-nowrap">
                    {cat.productCount} SKUs
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-right font-mono text-[#94E2D5] whitespace-nowrap">
                    {cat.totalUnits} units
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      {/* Add Category Modal */}
      {isAddModalOpen && (
        <AddCategoryModal onClose={() => setIsAddModalOpen(false)} />
      )}
    </div>
  );
}

function AddCategoryModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [icon, setIcon] = useState<AdminCategoryIconKey>("power");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManuallyEdited) {
      setSlug(
        val
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !description.trim()) {
      setError("Name, Slug, and Description are required.");
      return;
    }

    const created = addAdminCategory({
      name,
      slug,
      icon,
      description,
    });

    toast(`Created category "${created.name}" (/${created.slug}).`, "success");
    onClose();
  };

  return (
    <div
      data-testid="add-category-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-category-modal-title"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs"
      />

      <div
        data-testid="add-category-modal"
        className="relative z-10 w-full max-w-lg bg-[#1E1E2E] border border-[#45475A] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.75)] flex flex-col overflow-hidden text-[#CDD6F4]"
      >
        <div className="px-6 py-4 bg-[#181825] border-b border-[#313244] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#89B4FA] font-bold">
              CATALOG TAXONOMY
            </span>
            <h2
              id="add-category-modal-title"
              className="text-lg font-bold text-[#CDD6F4]"
            >
              Add New Category
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close add category modal"
            className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl bg-[#1E1E2E] border border-[#313244] text-[#BAC2DE] hover:text-[#CDD6F4] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#F38BA8]/12 border border-[#F38BA8]/40 text-[#F38BA8] font-mono"
            >
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="cat-name-input"
              className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
            >
              Category Name *
            </label>
            <input
              id="cat-name-input"
              data-testid="input-category-name"
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Power Modules & Regulators"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cat-slug-input"
              className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
            >
              URL Slug *
            </label>
            <input
              id="cat-slug-input"
              data-testid="input-category-slug"
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setSlugManuallyEdited(true);
                setSlug(e.target.value);
              }}
              placeholder="e.g. power-modules"
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] font-mono text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cat-icon-select"
              className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
            >
              Category Icon *
            </label>
            <select
              id="cat-icon-select"
              data-testid="select-category-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value as AdminCategoryIconKey)}
              className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            >
              {CATEGORY_ICON_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="cat-desc-textarea"
              className="block font-mono text-[11px] font-bold text-[#BAC2DE] mb-1"
            >
              Description *
            </label>
            <textarea
              id="cat-desc-textarea"
              data-testid="input-category-description"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the hardware components and parametric filters grouped under this category..."
              className="w-full p-3.5 rounded-xl bg-[#181825] border border-[#313244] text-[#CDD6F4] focus:border-[#89B4FA] focus:outline-none"
            />
          </div>

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
              data-testid="submit-category-form-btn"
              className="font-bold"
            >
              Create Category
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

