"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
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

const PreviewDialogContext = createContext<PreviewDialogContextType | undefined>(
  undefined
);

export function usePreviewDialog() {
  const context = useContext(PreviewDialogContext);
  if (!context) {
    throw new Error(
      "usePreviewDialog must be used within a PreviewDialogProvider"
    );
  }
  return context;
}

export function PreviewDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<PreviewDialogState>({
    isOpen: false,
    title: "",
    description: "",
    feature: "",
  });

  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const dialogContainerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const openPreview = useCallback((feature: string, customDescription?: string) => {
    if (typeof document !== "undefined") {
      lastActiveElementRef.current = (document.activeElement as HTMLElement) || null;
    }

    const defaultDescriptions: Record<string, string> = {
      "Log In":
        "Authentication and user accounts are scheduled for an upcoming integration milestone. Please explore the public catalog preview.",
      "View full catalog":
        "The full parametric catalog with advanced filtering and datasheet downloads will be available in the Buyer module.",
      "Open BOM Tool":
        "The interactive Bill of Materials project manager is currently in development. You can review the BOM workflow below.",
      Contact:
        "Customer support and direct admin messaging will connect registered users with technicians via our real-time support system.",
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

    // Restore focus to original trigger or persistent mobile menu toggle
    setTimeout(() => {
      const trigger = lastActiveElementRef.current;
      if (trigger && document.body.contains(trigger) && typeof trigger.focus === "function") {
        trigger.focus();
      } else {
        // If trigger was unmounted (e.g. inside mobile nav drawer when closed), focus menu toggle
        const menuToggle =
          document.getElementById("mobile-menu-toggle") ||
          document.querySelector<HTMLElement>("header button[aria-label*='navigation menu']");
        if (menuToggle && typeof menuToggle.focus === "function") {
          menuToggle.focus();
        }
      }
    }, 50);
  }, []);

  // Prevent background scrolling and interaction when modal is open
  useEffect(() => {
    if (!state.isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const backgroundElements = [
      document.getElementById("main-content"),
      document.querySelector("header"),
      document.querySelector("footer"),
    ].filter(Boolean) as HTMLElement[];

    backgroundElements.forEach((el) => {
      el.setAttribute("aria-hidden", "true");
      if ("inert" in el) {
        (el as unknown as { inert: boolean }).inert = true;
      }
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      backgroundElements.forEach((el) => {
        el.removeAttribute("aria-hidden");
        if ("inert" in el) {
          (el as unknown as { inert: boolean }).inert = false;
        }
      });
    };
  }, [state.isOpen]);

  // Focus trap: keep Tab and Shift+Tab inside the dialog container, and Escape closes it
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePreview();
        return;
      }

      if (e.key === "Tab") {
        const dialogNode = dialogContainerRef.current;
        if (!dialogNode) return;

        const focusableSelectors = [
          'button:not([disabled])',
          '[href]:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(", ");

        const focusableElements = Array.from(
          dialogNode.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter(
          (el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            !dialogNode.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (
            document.activeElement === lastElement ||
            !dialogNode.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isOpen, closePreview]);

  // Focus the close button or first interactive element upon open
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
          <div
            ref={dialogContainerRef}
            className="relative w-full max-w-md bg-mocha-panel border border-mocha-border-strong rounded-card p-6 shadow-[0_12px_30px_rgba(0,0,0,0.4)] text-left focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-mocha-border">
              <span className="font-mono text-[11px] font-bold tracking-wider text-mocha-accent uppercase bg-mocha-accent/10 px-2.5 py-1 rounded-md">
                LANDING PREVIEW
              </span>
              <button
                type="button"
                onClick={closePreview}
                aria-label="Close dialog"
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-mocha-text-subtle hover:text-mocha-text hover:bg-mocha-panel-raised rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-4">
              <h2
                id="preview-dialog-title"
                className="text-lg font-bold text-mocha-text leading-snug"
              >
                {state.title}
              </h2>
              <p
                id="preview-dialog-description"
                className="mt-2.5 text-sm text-mocha-text-muted leading-relaxed"
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
                className="w-full sm:w-auto min-h-[44px] min-w-[44px]"
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
