"use client";

import React from "react";
import Image from "next/image";
import { usePreviewDialog } from "./preview-dialog";

export function Footer() {
  const { openPreview } = usePreviewDialog();

  return (
    <footer
      aria-label="Site Footer"
      className="w-full bg-[#181825]/90 border-t border-[#313244]/80 mt-auto"
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <a
            href="#main-content"
            className="flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
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
          <span className="hidden sm:inline-block w-px h-4 bg-[#45475A]" />
          <p className="text-xs sm:text-sm text-[#A6ADC8]">
            © 2026 OhmSim by NEXORA Labs. All rights reserved.
          </p>
        </div>

        {/* Footer Navigation Links */}
        <nav
          className="flex items-center gap-6"
          aria-label="Footer legal and contact navigation"
        >
          <button
            type="button"
            onClick={() => openPreview("Privacy")}
            className="text-xs sm:text-sm text-[#A6ADC8] hover:text-[#CDD6F4] transition-colors py-1 focus-visible:outline-2 focus-visible:outline-[#89B4FA] rounded cursor-pointer"
          >
            Privacy
          </button>
          <button
            type="button"
            onClick={() => openPreview("Terms")}
            className="text-xs sm:text-sm text-[#A6ADC8] hover:text-[#CDD6F4] transition-colors py-1 focus-visible:outline-2 focus-visible:outline-[#89B4FA] rounded cursor-pointer"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => openPreview("Contact")}
            className="text-xs sm:text-sm text-[#A6ADC8] hover:text-[#CDD6F4] transition-colors py-1 focus-visible:outline-2 focus-visible:outline-[#89B4FA] rounded cursor-pointer"
          >
            Contact
          </button>
        </nav>
      </div>
    </footer>
  );
}
