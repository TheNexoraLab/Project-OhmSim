"use client";

import React, { useRef, useEffect, useCallback } from "react";
import type { BomProject } from "@/types/product";

interface BomChooserPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  bomProjects: BomProject[];
  onAddToBomProject: (projectId: string) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  placement?: "top" | "bottom";
  align?: "left" | "right" | "auto";
  className?: string;
}

export function BomChooserPopover({
  isOpen,
  onClose,
  bomProjects,
  onAddToBomProject,
  triggerRef,
  placement = "top",
  align = "auto",
  className = "",
}: BomChooserPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(
    (restoreFocus: boolean = true) => {
      onClose();
      if (restoreFocus) {
        setTimeout(() => {
          triggerRef?.current?.focus();
        }, 0);
      }
    },
    [onClose, triggerRef]
  );

  // Dynamic collision detection: clamps popover within viewport bounds [8px, viewportWidth - 8px]
  useEffect(() => {
    if (!isOpen) return;

    const clampWithinViewport = () => {
      if (!popoverRef.current) return;
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      if (rect.left < 8) {
        const shiftRight = 8 - rect.left;
        popoverRef.current.style.transform = `translateX(${shiftRight}px)`;
      } else if (rect.right > viewportWidth - 8) {
        const shiftLeft = (viewportWidth - 8) - rect.right;
        popoverRef.current.style.transform = `translateX(${shiftLeft}px)`;
      } else {
        popoverRef.current.style.transform = "";
      }
    };

    clampWithinViewport();
    window.addEventListener("resize", clampWithinViewport);
    return () => window.removeEventListener("resize", clampWithinViewport);
  }, [isOpen]);

  // Outside pointer detection & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (triggerRef?.current?.contains(target)) {
        // Trigger handles its own toggle on click
        return;
      }
      // Outside click closes without stealing focus from the clicked control
      handleClose(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose(true); // Return focus to trigger on Escape
        return;
      }

      // Scope arrow keys ONLY when focus is currently inside the popover
      if (!popoverRef.current?.contains(document.activeElement)) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const buttons = Array.from(
          popoverRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []
        );
        if (buttons.length === 0) return;
        const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
        if (e.key === "ArrowDown") {
          const nextIndex = (currentIndex + 1) % buttons.length;
          buttons[nextIndex]?.focus();
        } else {
          const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
          buttons[prevIndex]?.focus();
        }
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    // Initial focus entry into first button
    const firstButton = popoverRef.current?.querySelector<HTMLButtonElement>("button");
    firstButton?.focus();

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleClose, triggerRef]);

  if (!isOpen) return null;

  // Collision-aware static placement styles
  const horizontalAlignClass =
    align === "left"
      ? "left-0"
      : align === "right"
      ? "right-0"
      : "left-0 sm:left-auto sm:right-0";

  const placementStyles =
    placement === "top"
      ? `bottom-full mb-1.5 ${horizontalAlignClass}`
      : `top-full mt-1.5 ${horizontalAlignClass}`;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Add to BOM Project"
      tabIndex={-1}
      className={`absolute z-50 w-56 min-w-[190px] max-w-[calc(100vw-24px)] bg-mocha-panel border border-mocha-border-strong rounded-xl shadow-2xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150 ${placementStyles} ${className}`}
    >
      <div className="px-3 py-1.5 border-b border-mocha-border flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-widest text-mocha-text-subtle">
          Add to BOM Project
        </p>
        <span className="text-[8px] font-mono text-mocha-text-subtle">Esc to close</span>
      </div>

      <div className="max-h-[min(190px,calc(100vh-140px))] overflow-y-auto py-1 divide-y divide-mocha-border/30">
        {bomProjects.map((proj) => (
          <button
            key={proj.id}
            type="button"
            onClick={() => {
              onAddToBomProject(proj.id);
              handleClose(true); // Return focus to trigger after selection
            }}
            className="w-full min-h-[44px] flex items-center justify-between gap-2 px-3 py-2 text-left text-[11px] text-mocha-text hover:bg-mocha-panel-raised transition-colors focus-visible:outline-2 focus-visible:outline-mocha-accent focus-visible:outline-offset-[-2px]"
          >
            <span className="truncate font-medium">{proj.name}</span>
            <span className="shrink-0 text-[9px] font-mono text-mocha-text-subtle bg-mocha-panel-raised px-1.5 py-0.5 rounded">
              {(proj.lineItems ?? []).reduce((s, li) => s + li.qty, 0)} items
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
