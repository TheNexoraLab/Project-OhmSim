"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface PreviewDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  feature: string;
}

interface PreviewDialogContextType {
  openPreview: (feature: string, description?: string) => void;
  closePreview: () => void;
}

const PreviewDialogContext = createContext<PreviewDialogContextType | undefined>(undefined);

export function usePreviewDialog() {
  const context = useContext(PreviewDialogContext);
  if (!context) {
    throw new Error("usePreviewDialog must be used within a PreviewDialogProvider");
  }
  return context;
}

export function PreviewDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PreviewDialogState>({
    isOpen: false,
    title: "",
    description: "",
    feature: "",
  });

  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const openPreview = useCallback((feature: string, customDescription?: string) => {
    if (typeof document !== "undefined") {
      lastActiveElementRef.current = document.activeElement as HTMLElement | null;
    }

    const defaultDescriptions: Record<string, string> = {
      "Log In":
        "Authentication and user accounts are scheduled for an upcoming integration milestone. Please explore the public catalog preview.",
      "View full catalog":
        "The full parametric catalog with advanced filtering and datasheet downloads will be available in the Buyer module.",
      "Open BOM Tool":
        "The interactive Bill of Materials project manager is currently in development. You can review the BOM workflow below.",
      "Contact":
        "Customer support and direct admin messaging will connect registered users with technicians via our real-time support system.",
      "Privacy":
        "Our comprehensive data privacy policy complies with region-specific standards and will be published upon commercial launch.",
      "Terms":
        "Terms of service, warranty documentation, and return policies will accompany the operational release.",
    };

    setState({
      isOpen: true,
      title: `${feature} — Preview Notice`,
      description:
        customDescription ||
        defaultDescriptions[feature] ||
        `The ${feature} feature is part of the forthcoming Buyer/Admin milestone and is not yet active on the public landing page.`,
      feature,
    });
  }, []);

  const closePreview = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    // Restore focus
    setTimeout(() => {
      if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === "function") {
        lastActiveElementRef.current.focus();
      }
    }, 50);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePreview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, closePreview]);

  // Focus trap / focus close button on open
  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }
  }, [state.isOpen]);

  return (
    <PreviewDialogContext.Provider value={{ openPreview, closePreview }}>
      {children}
      {state.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-dialog-title"
          aria-describedby="preview-dialog-description"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closePreview();
            }
          }}
        >
          <div className="relative w-full max-w-md bg-[#1E1E2E] border border-[#585B70] rounded-[22px] p-6 shadow-[0_12px_30px_rgba(0,0,0,0.4)] text-left focus:outline-none">
            <div className="flex items-center justify-between pb-3 border-b border-[#313244]">
              <span className="font-mono text-[11px] font-bold tracking-wider text-[#89B4FA] uppercase bg-[#89B4FA]/10 px-2.5 py-1 rounded-md">
                LANDING PREVIEW
              </span>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close dialog"
                className="p-1.5 text-[#A6ADC8] hover:text-[#CDD6F4] hover:bg-[#313244] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#89B4FA]"
              >
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
              </button>
            </div>

            <div className="mt-4">
              <h2
                id="preview-dialog-title"
                className="text-lg font-bold text-[#CDD6F4] leading-snug"
              >
                {state.title}
              </h2>
              <p
                id="preview-dialog-description"
                className="mt-2.5 text-sm text-[#BAC2DE] leading-relaxed"
              >
                {state.description}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                ref={closeButtonRef}
                variant="accent"
                size="default"
                onClick={closePreview}
                className="w-full sm:w-auto"
              >
                Understood
              </Button>
            </div>
          </div>
        </div>
      )}
    </PreviewDialogContext.Provider>
  );
}
