"use client";

import React from "react";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden"
    >
      {/* Decorative Technical Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#313244_1px,transparent_1px),linear-gradient(to_bottom,#313244_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-20"
        aria-hidden="true"
      />

      {/* Restrained Accent Radial Glows */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[340px] bg-gradient-to-tr from-[#89B4FA]/15 to-[#94E2D5]/10 rounded-full blur-[100px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Hero Content Container */}
      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-[896px] mx-auto flex flex-col items-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1E2E] border border-[#45475A] shadow-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-[#89B4FA] animate-pulse" />
            <span className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.12em] text-[#CDD6F4] uppercase">
              v2.4.1 — 16,510 active SKUs
            </span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#CDD6F4] leading-[1.1] sm:leading-[1.08]"
          >
            Specialized{" "}
            <span className="text-[#89B4FA]">Electronics</span>
            <br className="hidden sm:inline" /> &{" "}
            <span className="text-[#94E2D5]">Component Sourcing</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg text-[#BAC2DE] leading-relaxed max-w-2xl">
            From MCUs to discrete passives — OhmSim stocks the long tail of
            embedded hardware with verified provenance, live inventory, and
            BOM-aware pricing.
          </p>

          {/* Canonical 48px CTAs */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <ButtonLink
              variant="accent"
              size="large"
              href="#categories"
              className="w-full sm:w-auto min-w-[200px]"
            >
              Explore Catalog
            </ButtonLink>
            <ButtonLink
              variant="outline"
              size="large"
              href="#bom-tool"
              className="w-full sm:w-auto min-w-[200px]"
            >
              Launch BOM Tool
            </ButtonLink>
          </div>

          {/* Hero Statistics */}
          <div className="mt-12 sm:mt-16 w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 rounded-[22px] bg-[#1E1E2E]/80 border border-[#313244] shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center py-2 px-1">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#CDD6F4] tracking-tight">
                16.5K+
              </span>
              <span className="mt-1 text-xs sm:text-sm text-[#A6ADC8] font-medium">
                Active SKUs
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-2 px-1 border-x border-[#313244]">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#89B4FA] tracking-tight">
                340+
              </span>
              <span className="mt-1 text-xs sm:text-sm text-[#A6ADC8] font-medium">
                Brands
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-2 px-1">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-[#94E2D5] tracking-tight">
                24h
              </span>
              <span className="mt-1 text-xs sm:text-sm text-[#A6ADC8] font-medium">
                Order Cut-off
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
