"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { usePreviewDialog } from "./preview-dialog";

export function BomSection() {
  const { openPreview } = usePreviewDialog();

  return (
    <section
      id="bom-tool"
      aria-labelledby="bom-heading"
      className="py-12 md:py-20 scroll-mt-20"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div
          id="how-to-use"
          className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#313244] to-[#1E1E2E] border border-[#585B70] shadow-[0_8px_24px_rgba(0,0,0,0.28)] py-10 px-6 sm:py-12 sm:px-8 lg:py-16 lg:px-12 text-center"
        >
          {/* Faint 24px Technical Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#585B70_1px,transparent_1px),linear-gradient(to_bottom,#585B70_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"
            aria-hidden="true"
          />

          {/* Restrained Top Radial Glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[420px] h-[180px] bg-gradient-to-b from-[#89B4FA]/20 to-transparent rounded-full blur-[80px] pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative max-w-3xl mx-auto flex flex-col items-center">
            {/* Eyebrow */}
            <span className="font-mono text-xs font-bold tracking-[0.12em] text-[#89B4FA] uppercase bg-[#89B4FA]/10 px-3 py-1 rounded-full border border-[#89B4FA]/30 mb-4">
              BOM TOOL — BETA
            </span>

            {/* Heading */}
            <h2
              id="bom-heading"
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#CDD6F4] uppercase"
            >
              BILL OF MATERIALS
            </h2>

            {/* Supporting Heading */}
            <p className="mt-3 text-xl sm:text-2xl font-bold text-[#94E2D5] leading-snug">
              Organize your components,
              <br />
              plan your next project.
            </p>

            {/* Body Copy */}
            <p className="mt-5 text-sm sm:text-base text-[#BAC2DE] leading-relaxed max-w-2xl">
              Create a BOM project, add components from our catalog, adjust
              quantities, and review estimated costs and stock availability.
              Transfer your selected components to the shopping cart when you&apos;re
              ready to order.
            </p>

            {/* Canonical 48px CTA */}
            <div className="mt-8">
              <Button
                variant="accent"
                size="large"
                onClick={() => openPreview("Open BOM Tool")}
                className="min-w-[220px]"
                aria-label="Open BOM Tool preview"
              >
                <span>Open BOM Tool</span>
                <span className="ml-2 font-bold" aria-hidden="true">
                  →
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
