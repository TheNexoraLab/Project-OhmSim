"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FilterIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  AltArrowDownIcon,
  AddIcon,
} from "@solar-icons/react/linear";
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
  const [bomOpen, setBomOpen] = useState(true);
  const [isShrunk, setIsShrunk] = useState(false);
  const controlsId = idPrefix ? `${idPrefix}-parametric-filter-controls` : "parametric-filter-controls";

  if (isShrunk) {
    const isDesktop = className.includes("hidden md:flex");
    return (
      <div
        data-catalog-filter-panel
        className={`shrink-0 z-20 ${
          isDesktop
            ? "hidden md:flex sticky top-1/2 -translate-y-1/2"
            : "flex sticky top-1/2 -translate-y-1/2"
        } animate-in fade-in slide-in-from-left-2 duration-200 ease-out`}
      >
        <button
          type="button"
          onClick={() => setIsShrunk(false)}
          aria-label="Open filter panel"
          title="Open filter panel"
          className="group flex flex-col items-center py-3.5 px-2 bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border hover:border-mocha-accent/50 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <span className="w-8 h-8 rounded-xl bg-mocha-panel hover:bg-mocha-accent/20 border border-mocha-border group-hover:border-mocha-accent/40 text-mocha-accent flex items-center justify-center transition-all mb-3 shadow-xs">
            <AltArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-mocha-text-muted group-hover:text-mocha-accent [writing-mode:vertical-lr] rotate-180 transition-colors">
            Filters
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      data-catalog-filter-panel
      className={`shrink-0 min-w-0 flex flex-col bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border rounded-[18px] relative transition-all duration-300 animate-in fade-in slide-in-from-left-3 zoom-in-[0.99] ease-out shadow-lg ${
        className || "w-56"
      }`}
    >
      {/* Top Panel Header: Title + Professional Collapse Action */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-mocha-border/80 bg-[#181825]/40 rounded-t-[18px]">
        <div className="flex items-center gap-2">
          <FilterIcon size={15} className="text-mocha-accent" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#CDD6F4]">
            Filters
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsShrunk(true)}
          aria-label="Collapse filter panel"
          title="Collapse filter panel"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-mocha-text-muted hover:text-mocha-accent hover:bg-mocha-panel-raised border border-transparent hover:border-mocha-border transition-all group focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <span className="text-[10px] font-mono uppercase tracking-wider text-mocha-text-muted group-hover:text-mocha-accent">
            Collapse
          </span>
          <AltArrowLeftIcon size={14} className="text-mocha-text-muted group-hover:text-mocha-accent transition-transform group-hover:-translate-x-0.5" />
        </button>
      </div>

      {/* Parametric Filter Section */}
      <div className="border-b border-mocha-border">
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls={controlsId}
          className="w-full min-h-[44px] flex items-center justify-between px-4 py-2.5 text-mocha-text-muted hover:bg-mocha-panel-raised/50 transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-mocha-text-muted">
            Parametric Filter
          </span>
          <AltArrowDownIcon
            size={14}
            className={`text-mocha-text-muted transition-transform duration-200 ${
              filtersOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {filtersOpen && (
          // Room for the sliders' 44px hit areas at both track endpoints.
          // Let the page scroll naturally instead of creating a nested scroller.
          <div id={controlsId} className="px-5 pb-3 flex flex-col gap-4">
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
          <button
            type="button"
            onClick={() => setBomOpen((o) => !o)}
            aria-expanded={bomOpen}
            aria-controls="my-bom-projects-list"
            className="flex items-center gap-1.5 min-h-[44px] text-mocha-text-muted hover:text-mocha-text transition-colors group focus-visible:outline-2 focus-visible:outline-mocha-accent rounded-lg"
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest text-mocha-text-muted group-hover:text-mocha-text">
              My BOM Projects
            </span>
            <AltArrowDownIcon
              size={14}
              className={`text-mocha-text-muted transition-transform duration-200 ${
                bomOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => onAddBomProject("New BOM Project")}
            aria-label="Create new BOM project"
            className="min-w-[44px] min-h-[44px] text-xs font-bold flex items-center justify-center text-mocha-accent border border-mocha-accent/40 bg-mocha-accent/15 hover:bg-mocha-accent/25 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            <AddIcon size={14} />
          </button>
        </div>

        {bomOpen && (
          <div id="my-bom-projects-list" className="flex flex-col gap-1.5 animate-in fade-in duration-150">
            {bomProjects.map((proj) => (
              <Link
                key={proj.id}
                href={`/bom?id=${proj.id}`}
                className="min-w-0 text-left px-2.5 py-2 min-h-[44px] flex flex-col justify-center bg-mocha-panel-high border border-mocha-border hover:border-mocha-border-strong rounded-xl shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent"
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
        )}
      </div>
    </div>
  );
}
