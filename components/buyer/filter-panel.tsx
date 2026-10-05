"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { BomProject } from "@/types/product";
import { DualSlider, SingleSlider } from "@/components/ui/slider";

interface FilterPanelProps {
  voltage: [number, number];
  onVoltage: (value: [number, number]) => void;
  resistance: [number, number];
  onResistance: (value: [number, number]) => void;
  minStock: number;
  onMinStock: (value: number) => void;
  bomProjects: BomProject[];
  onAddBomProject: (name?: string) => void;
  className?: string;
  idPrefix?: string;
}

export function FilterPanel({
  voltage,
  onVoltage,
  resistance,
  onResistance,
  minStock,
  onMinStock,
  bomProjects,
  onAddBomProject,
  className = "",
  idPrefix,
}: FilterPanelProps) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const controlsId = idPrefix ? `${idPrefix}-parametric-filter-controls` : "parametric-filter-controls";

  return (
    <div
      className={`shrink-0 flex flex-col overflow-y-auto no-scrollbar bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border rounded-[18px] ${
        className || "w-56"
      }`}
    >
      {/* Parametric Filter Section */}
      <div className="border-b border-mocha-border">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls={controlsId}
          className="w-full min-h-[44px] flex items-center justify-between px-3 py-2.5 text-mocha-text-muted hover:bg-mocha-panel-raised/50 transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-mocha-text-muted">
            Parametric Filter
          </span>
          <svg
            className={`w-3.5 h-3.5 text-mocha-text-muted transition-transform duration-200 ${
              filtersOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {filtersOpen && (
          <div id={controlsId} className="px-3 pb-3 flex flex-col gap-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2 text-mocha-text-muted">
                Operating Voltage
              </p>
              <DualSlider
                min={3.3}
                max={12}
                value={voltage}
                onChange={onVoltage}
                step={0.1}
                formatLabel={(v) => `${v.toFixed(1)}V`}
                labelLow="Minimum Voltage"
                labelHigh="Maximum Voltage"
              />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2 text-mocha-text-muted">
                Resistance Range
              </p>
              <DualSlider
                min={10}
                max={1000}
                value={resistance}
                onChange={onResistance}
                step={10}
                formatLabel={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}kΩ` : `${v}Ω`)}
                labelLow="Minimum Resistance"
                labelHigh="Maximum Resistance"
              />
            </div>

            <div>
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2 text-mocha-text-muted">
                Stock Availability
              </p>
              <SingleSlider
                min={0}
                max={200}
                value={minStock}
                onChange={onMinStock}
                step={5}
                label="Minimum Stock Threshold"
              />
            </div>
          </div>
        )}
      </div>

      {/* BOM Projects Section */}
      <div className="flex-1 px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-mocha-text-muted">
            My BOM Projects
          </span>
          <button
            type="button"
            onClick={() => onAddBomProject("New BOM Project")}
            aria-label="Create new BOM project"
            className="min-w-[44px] min-h-[44px] text-xs font-bold flex items-center justify-center text-mocha-accent border border-mocha-accent/40 bg-mocha-accent/15 hover:bg-mocha-accent/25 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            +
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {bomProjects.map((proj) => (
            <Link
              key={proj.id}
              href={`/bom?id=${proj.id}`}
              className="text-left px-2.5 py-2 min-h-[44px] flex flex-col justify-center bg-mocha-panel-high border border-mocha-border hover:border-mocha-border-strong rounded-xl shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent block"
            >
              <p className="text-[11px] font-medium leading-tight text-mocha-text truncate">
                {proj.name}
              </p>
              <p className="text-[9px] font-mono mt-0.5 text-mocha-text-muted">
                {(proj.lineItems ?? []).reduce((s, li) => s + li.qty, 0)} items
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
