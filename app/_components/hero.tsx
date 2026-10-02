"use client";

import React from "react";
import { ButtonLink } from "@/components/ui/button";
import styles from "./hero-motion.module.css";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      data-hero-motion="true"
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

      {/* Edge-only circuit traces keep the headline and controls clear. */}
      <div className={styles.circuits} aria-hidden="true">
        <svg className={styles.left} viewBox="0 0 240 600" preserveAspectRatio="none">
          <g className={styles.trace}>
            <path d="M0 80H110V180H175V240M0 360H65V430H130V530" />
            <circle cx="175" cy="240" r="3" /><circle cx="130" cy="530" r="3" />
          </g>
          <path className={styles.pulse} data-hero-pulse="true" pathLength="100" d="M0 80H110V180H175V240" />
          <path className={`${styles.pulse} ${styles.delayed}`} data-hero-pulse="true" pathLength="100" d="M0 360H65V430H130V530" />
        </svg>
        <svg className={styles.right} viewBox="0 0 240 600" preserveAspectRatio="none">
          <g className={styles.trace}>
            <path d="M240 100H140V170H75V260M240 390H180V460H110V550" />
            <circle cx="75" cy="260" r="3" /><circle cx="110" cy="550" r="3" />
          </g>
          <path className={`${styles.pulse} ${styles.teal}`} data-hero-pulse="true" pathLength="100" d="M240 100H140V170H75V260" />
          <path className={`${styles.pulse} ${styles.last}`} data-hero-pulse="true" pathLength="100" d="M240 390H180V460H110V550" />
        </svg>
      </div>

      {/* Hero Content Container */}
      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-[896px] mx-auto flex flex-col items-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mocha-panel border border-mocha-panel-high shadow-sm mb-6">
            <span className={`w-2 h-2 rounded-full bg-mocha-accent animate-pulse ${styles.statusDot}`} />
            <span className="font-mono text-[11px] sm:text-xs font-bold tracking-[0.12em] text-mocha-text uppercase">
              v2.4.1 — 16,510 active SKUs
            </span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-mocha-text leading-[1.1] sm:leading-[1.08]"
          >
            Specialized{" "}
            <span className="text-mocha-accent">Electronics</span>
            <br className="hidden sm:inline" /> &{" "}
            <span className="text-mocha-accent-secondary">Component Sourcing</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-base sm:text-lg text-mocha-text-muted leading-relaxed max-w-2xl">
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
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="w-4 h-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="14" height="14" rx="2" />
                <line x1="7" y1="7" x2="13" y2="7" />
                <line x1="7" y1="10" x2="13" y2="10" />
                <line x1="7" y1="13" x2="10" y2="13" />
              </svg>
              <span>Launch BOM Tool</span>
            </ButtonLink>
          </div>

          {/* Hero Statistics */}
          <div className="mt-12 sm:mt-16 w-full max-w-2xl grid grid-cols-3 gap-2 sm:gap-4 p-4 sm:p-6 rounded-card bg-mocha-panel/80 border border-mocha-border shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center py-2 px-1">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-mocha-text tracking-tight">
                16.5K+
              </span>
              <span className="mt-1 text-xs sm:text-sm text-mocha-text-subtle font-medium">
                Active SKUs
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-2 px-1 border-x border-mocha-border">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-mocha-accent tracking-tight">
                340+
              </span>
              <span className="mt-1 text-xs sm:text-sm text-mocha-text-subtle font-medium">
                Brands
              </span>
            </div>
            <div className="flex flex-col items-center justify-center py-2 px-1">
              <span className="font-mono text-2xl sm:text-3xl font-extrabold text-mocha-accent-secondary tracking-tight">
                24h
              </span>
              <span className="mt-1 text-xs sm:text-sm text-mocha-text-subtle font-medium">
                Order Cut-off
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
