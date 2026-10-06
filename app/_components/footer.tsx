"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePreviewDialog } from "./preview-dialog";

export function Footer() {
  const { openPreview } = usePreviewDialog();

  return (
    <footer
      aria-label="Site Footer"
      className="w-full bg-mocha-bg-secondary/90 border-t border-mocha-border/80 mt-auto"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="inline-flex items-center min-h-[44px] rounded-lg focus-visible:outline-2 focus-visible:outline-mocha-accent"
            aria-label="OhmSim Home"
          >
            <div className="relative h-8 w-[96px] sm:w-[108px] sm:h-9 flex items-center">
              <Image
                src="/logos/ohmsim-logo.png"
                alt="OhmSim"
                width={108}
                height={36}
                className="h-full w-auto object-contain object-left"
              />
            </div>
          </a>
          <span className="hidden sm:inline-block w-px h-4 bg-mocha-panel-high" />
          <p className="text-xs sm:text-sm text-mocha-text-subtle">
            © 2026 OhmSim by NEXORA Labs. All rights reserved.
          </p>
        </div>

        {/* Footer Navigation Links */}
        <nav
          className="flex items-center gap-2 sm:gap-4"
          aria-label="Footer legal and contact navigation"
        >
          <Link
            href="/privacy"
            className="text-xs sm:text-sm text-mocha-text-subtle hover:text-mocha-accent transition-colors min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center justify-center rounded cursor-pointer focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-xs sm:text-sm text-mocha-text-subtle hover:text-mocha-accent transition-colors min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center justify-center rounded cursor-pointer focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            Terms
          </Link>
          <button
            type="button"
            onClick={() => openPreview("Contact")}
            className="text-xs sm:text-sm text-mocha-text-subtle hover:text-mocha-accent transition-colors min-h-[44px] min-w-[44px] px-3 py-2.5 inline-flex items-center justify-center rounded cursor-pointer focus-visible:outline-2 focus-visible:outline-mocha-accent"
          >
            Contact
          </button>
        </nav>
      </div>
    </footer>
  );
}
