"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { usePreviewDialog } from "./preview-dialog";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { openPreview } = usePreviewDialog();
  const navRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close mobile menu on resize to desktop (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile menu on click outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Catalog", href: "#categories" },
    { label: "BOM Tool", href: "#bom-tool" },
    { label: "How to Use", href: "#how-to-use" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 w-full h-16 bg-[#181825]/85 backdrop-blur-[20px] border-b border-[#313244]/80 transition-colors"
    >
      <div className="max-w-[1280px] h-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Lockup */}
        <a
          href="#main-content"
          className="flex items-center rounded-lg py-1 px-1.5 -ml-1.5 focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
          aria-label="OhmSim Home"
        >
          <div className="relative h-9 w-[108px] sm:w-[120px] sm:h-10 flex items-center">
            <Image
              src="/logos/ohmsim-logo.png"
              alt="OhmSim"
              width={120}
              height={40}
              className="h-full w-auto object-contain object-left"
              priority
            />
          </div>
        </a>

        {/* Desktop Navigation (>= 1024px) */}
        <nav
          className="hidden lg:flex items-center gap-8"
          aria-label="Primary navigation"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#BAC2DE] hover:text-[#CDD6F4] transition-colors py-1 focus-visible:outline-2 focus-visible:outline-[#89B4FA] rounded"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => openPreview("Contact")}
            className="text-sm font-medium text-[#BAC2DE] hover:text-[#CDD6F4] transition-colors py-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#89B4FA] rounded"
          >
            Contact
          </button>
        </nav>

        {/* Desktop Action Right */}
        <div className="hidden lg:flex items-center">
          <Button
            variant="raised"
            size="small"
            onClick={() => openPreview("Log In")}
            aria-label="Log in to OhmSim"
          >
            Log In
          </Button>
        </div>

        {/* Mobile / Tablet Menu Trigger (< 1024px) */}
        <div className="flex items-center lg:hidden">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex items-center justify-center w-11 h-11 rounded-xl text-[#CDD6F4] hover:bg-[#313244] border border-[#45475A] transition-colors focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
          >
            {mobileMenuOpen ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Collapsible Navigation Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="lg:hidden w-full bg-[#1E1E2E] border-b border-[#45475A] shadow-[0_8px_24px_rgba(0,0,0,0.35)] px-4 py-6 animate-in slide-in-from-top-2 duration-200"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile primary navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleLinkClick}
                className="flex items-center h-11 px-3 text-sm font-medium text-[#CDD6F4] hover:bg-[#313244] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                openPreview("Contact");
              }}
              className="flex items-center text-left h-11 px-3 text-sm font-medium text-[#CDD6F4] hover:bg-[#313244] rounded-lg transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
            >
              Contact
            </button>
            <div className="pt-3 border-t border-[#313244]">
              <Button
                variant="raised"
                size="default"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openPreview("Log In");
                }}
                className="w-full"
              >
                Log In
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
