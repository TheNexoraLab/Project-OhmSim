"use client";

import React from "react";
import Image from "next/image";
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
  iconSrc: string;
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
    iconSrc: "/icons/microcontrollers.svg",
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
    iconSrc: "/icons/sensors.svg",
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
    iconSrc: "/icons/power-ics.svg",
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
    iconSrc: "/icons/passives.svg",
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
                <div className="flex items-center justify-between">
                  <div className="w-16 h-16 rounded-2xl bg-[#1E1E2E] border border-[#45475A] flex items-center justify-center p-3 text-[#CDD6F4] group-hover:border-[#585B70] transition-colors">
                    <div className="relative w-8 h-8">
                      <Image
                        src={cat.iconSrc}
                        alt=""
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${cat.accentBg}`}
                  >
                    {cat.tag}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="mt-5 text-xl font-bold text-[#CDD6F4] group-hover:text-white transition-colors">
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
