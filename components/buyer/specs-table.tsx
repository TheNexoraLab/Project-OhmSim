"use client";

import React, { useState } from "react";
import type { Product } from "@/types/product";

interface SpecsTableProps {
  product: Product;
}

export function SpecsTable({ product }: SpecsTableProps) {
  const [activeTab, setActiveTab] = useState<"specs" | "about">("specs");

  const tabs: Array<{ id: "specs" | "about"; label: string }> = [
    { id: "specs", label: "Specifications" },
    { id: "about", label: "About" },
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (index + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const targetTab = tabs[nextIndex].id;
      setActiveTab(targetTab);
      const targetEl = document.getElementById(`tab-${targetTab}`);
      targetEl?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Segmented Tab Controls with explicit ARIA tab roles, roving tabIndex, and keyboard navigation */}
      <div role="tablist" aria-label="Product Information" className="flex gap-1 bg-mocha-bg-secondary p-1 rounded-xl border border-mocha-border max-w-xs">
        {tabs.map((tab, idx) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isSelected ? 0 : -1}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`flex-1 min-h-[44px] text-[11px] font-bold py-2 px-3 rounded-lg transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                isSelected
                  ? "bg-mocha-panel-raised text-mocha-text border border-mocha-border-strong shadow-sm"
                  : "text-mocha-text-muted hover:text-mocha-text border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels with tabIndex=0 for keyboard accessibility */}
      {activeTab === "specs" ? (
        <div id="tabpanel-specs" role="tabpanel" aria-labelledby="tab-specs" tabIndex={0} className="focus-visible:outline-none">
          {product.specs && Object.keys(product.specs).length > 0 ? (
            <div className="flex flex-col border border-mocha-border rounded-xl overflow-hidden shadow-sm">
              {Object.entries(product.specs).map(([key, val], i) => (
                <div
                  key={key}
                  className={`flex items-center px-4 py-2.5 text-[11px] ${
                    i % 2 === 0 ? "bg-mocha-panel" : "bg-mocha-bg-secondary"
                  } ${i < Object.keys(product.specs ?? {}).length - 1 ? "border-b border-mocha-border/60" : ""}`}
                >
                  <span className="w-44 shrink-0 font-medium text-mocha-text-muted">{key}</span>
                  <span className="font-semibold font-mono text-mocha-text">{val}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-mocha-text-subtle py-4">No technical specifications available.</p>
          )}
        </div>
      ) : (
        <div id="tabpanel-about" role="tabpanel" aria-labelledby="tab-about" tabIndex={0} className="focus-visible:outline-none">
          {product.about ? (
            <p className="text-[13px] leading-relaxed text-mocha-text-muted bg-mocha-panel/50 p-4 rounded-xl border border-mocha-border">
              {product.about}
            </p>
          ) : (
            <p className="text-[12px] text-mocha-text-subtle py-4">No description available.</p>
          )}
        </div>
      )}
    </div>
  );
}
