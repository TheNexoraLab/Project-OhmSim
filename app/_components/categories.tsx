"use client";

import React from "react";
import { usePreviewDialog } from "./preview-dialog";

interface CategoryItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  count: string;
  accent: string;
  borderHover: string;
  accentBg: string;
  icon: React.ReactNode;
}

const categories: CategoryItem[] = [
  {
    id: "microcontrollers",
    name: "Microcontrollers",
    tag: "MCU",
    description: "ARM Cortex, RISC-V, AVR & PIC families from leading fabs",
    count: "2,840+ SKUs",
    accent: "#89B4FA",
    borderHover: "hover:border-[#89B4FA]",
    accentBg: "bg-[#89B4FA]/10 text-[#89B4FA]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-10 h-10"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          rx="3"
          fill="currentColor"
          fillOpacity="0.1"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <rect
          x="16"
          y="16"
          width="16"
          height="16"
          rx="1"
          fill="currentColor"
          fillOpacity="0.2"
        />
        <rect
          x="18"
          y="18"
          width="12"
          height="12"
          rx="1"
          fill="currentColor"
          fillOpacity="0.15"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 1"
        />
        <line x1="4" y1="18" x2="10" y2="18" stroke="currentColor" strokeWidth="1.8" />
        <line x1="4" y1="24" x2="10" y2="24" stroke="currentColor" strokeWidth="1.8" />
        <line x1="4" y1="30" x2="10" y2="30" stroke="currentColor" strokeWidth="1.8" />
        <line x1="38" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="1.8" />
        <line x1="38" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.8" />
        <line x1="38" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="1.8" />
        <line x1="18" y1="4" x2="18" y2="10" stroke="currentColor" strokeWidth="1.8" />
        <line x1="24" y1="4" x2="24" y2="10" stroke="currentColor" strokeWidth="1.8" />
        <line x1="30" y1="4" x2="30" y2="10" stroke="currentColor" strokeWidth="1.8" />
        <line x1="18" y1="38" x2="18" y2="44" stroke="currentColor" strokeWidth="1.8" />
        <line x1="24" y1="38" x2="24" y2="44" stroke="currentColor" strokeWidth="1.8" />
        <line x1="30" y1="38" x2="30" y2="44" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "sensors",
    name: "Sensors",
    tag: "SNS",
    description: "Temperature, IMU, proximity, environmental & imaging modules",
    count: "1,560+ SKUs",
    accent: "#94E2D5",
    borderHover: "hover:border-[#94E2D5]",
    accentBg: "bg-[#94E2D5]/10 text-[#94E2D5]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-10 h-10"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="6"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="24"
          cy="24"
          r="12"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="24"
          cy="24"
          r="18"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.25"
        />
        <circle cx="24" cy="24" r="2.5" fill="currentColor" />
        <line x1="24" y1="6" x2="24" y2="12" stroke="currentColor" strokeWidth="1.8" />
        <line x1="24" y1="36" x2="24" y2="42" stroke="currentColor" strokeWidth="1.8" />
        <line x1="6" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="1.8" />
        <line x1="36" y1="24" x2="42" y2="24" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "power-ics",
    name: "Power ICs",
    tag: "PWR",
    description: "LDOs, buck/boost converters, PMICs and gate drivers",
    count: "3,210+ SKUs",
    accent: "#F9E2AF",
    borderHover: "hover:border-[#F9E2AF]",
    accentBg: "bg-[#F9E2AF]/10 text-[#F9E2AF]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-10 h-10"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeWidth="0.75"
          opacity="0.4"
        />
        <path
          d="M26 6L14 26h10l-2 16 14-20H26L26 6z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "passives",
    name: "Passives",
    tag: "PAS",
    description: "Resistors, capacitors, inductors, crystals & ferrite beads",
    count: "8,900+ SKUs",
    accent: "#A6E3A1",
    borderHover: "hover:border-[#A6E3A1]",
    accentBg: "bg-[#A6E3A1]/10 text-[#A6E3A1]",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-10 h-10"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect
          x="16"
          y="20"
          width="16"
          height="8"
          rx="1"
          fill="currentColor"
          fillOpacity="0.22"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <line x1="4" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="1.8" />
        <line x1="32" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M8 16 Q12 12 16 16 Q20 20 24 16 Q28 12 32 16 Q36 20 40 16"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.5"
        />
      </svg>
    ),
  },
];

export function Categories() {
  const { openPreview } = usePreviewDialog();

  return (
    <section
      id="categories"
      aria-labelledby="categories-heading"
      className="py-12 md:py-20 scroll-mt-20"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 md:pb-12 border-b border-[#313244]/60">
          <div>
            <span className="font-mono text-xs font-bold tracking-[0.12em] text-[#89B4FA] uppercase">
              COMPONENT CATALOG
            </span>
            <h2
              id="categories-heading"
              className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#CDD6F4]"
            >
              Browse by Category
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#BAC2DE] max-w-xl">
              Precision-stocked for embedded systems, power electronics, and IoT development.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPreview("View full catalog")}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#89B4FA] hover:text-[#74C7EC] transition-colors cursor-pointer self-start md:self-end py-1 focus-visible:outline-2 focus-visible:outline-[#89B4FA] rounded"
          >
            <span>View full catalog</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Category Cards Grid (1 col below 768px, 2 col 768-1023px, 4 col >=1024px) */}
        <div className="mt-8 sm:mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`group relative flex flex-col justify-between p-6 rounded-[22px] bg-gradient-to-br from-[#313244] to-[#1E1E2E] border border-[#585B70]/40 shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-all duration-300 ${cat.borderHover} hover:shadow-[0_16px_36px_rgba(0,0,0,0.35)] hover:-translate-y-0.5`}
            >
              <div>
                {/* Icon and Tag Header */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="p-3 rounded-2xl bg-[#1E1E2E] border border-[#45475A] flex items-center justify-center transition-colors group-hover:border-[#585B70]"
                    style={{ color: cat.accent }}
                  >
                    {cat.icon}
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.accentBg}`}
                  >
                    {cat.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="mt-2 text-xl font-bold text-[#CDD6F4] group-hover:text-white transition-colors">
                  {cat.name}
                </h3>
                <p className="mt-2 text-sm text-[#BAC2DE] leading-relaxed">
                  {cat.description}
                </p>
              </div>

              {/* Card Footer: Count & Browse Affordance */}
              <div className="mt-6 pt-4 border-t border-[#313244]/80 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[#A6ADC8]">
                  {cat.count}
                </span>
                <button
                  type="button"
                  onClick={() => openPreview(`Browse ${cat.name}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#89B4FA] group-hover:text-white transition-colors py-1.5 px-2.5 rounded-lg hover:bg-[#313244] focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
                  aria-label={`Browse ${cat.name} catalog`}
                >
                  <span>Browse</span>
                  <svg
                    className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
