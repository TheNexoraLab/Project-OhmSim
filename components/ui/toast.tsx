"use client";

import React, { useState, useEffect } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

export function toast(message: string, type: ToastType = "info") {
  if (typeof window !== "undefined") {
    setTimeout(
      () =>
        window.dispatchEvent(
          new CustomEvent("ohmsim-toast", { detail: { message, type } })
        ),
      0
    );
  }
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = React.useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    const handler = (e: Event) => {
      const { message, type } = (
        e as CustomEvent<{ message: string; type: ToastType }>
      ).detail;
      const id = `t${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timers.delete(id);
      }, 3500);
      timers.set(id, timer);
    };

    window.addEventListener("ohmsim-toast", handler);
    return () => {
      window.removeEventListener("ohmsim-toast", handler);
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
    };
  }, []);

  const ICONS: Record<ToastType, React.ReactNode> = {
    success: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4 shrink-0 text-mocha-success">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    error: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4 shrink-0 text-mocha-danger">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4 shrink-0 text-mocha-warning">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    info: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-4 h-4 shrink-0 text-mocha-accent">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  };

  const BORDER_CLASSES: Record<ToastType, string> = {
    success: "border-mocha-success/30",
    error: "border-mocha-danger/30",
    warning: "border-mocha-warning/30",
    info: "border-mocha-accent/30",
  };

  const BAR_CLASSES: Record<ToastType, string> = {
    success: "bg-mocha-success",
    error: "bg-mocha-danger",
    warning: "bg-mocha-warning",
    info: "bg-mocha-accent",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-16 md:bottom-5 right-5 flex flex-col gap-2 z-[9999] pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-semibold bg-mocha-bg-secondary/95 backdrop-blur-[20px] text-mocha-text border ${BORDER_CLASSES[t.type]} shadow-[0_8px_24px_rgba(0,0,0,0.35)] min-w-[260px] max-w-[360px] pointer-events-auto animate-in fade-in slide-in-from-bottom-2 duration-200 overflow-hidden`}
        >
          {ICONS[t.type]}
          <span className="flex-1 leading-snug">{t.message}</span>
          <div
            className={`absolute bottom-0 left-0 h-0.5 w-full rounded-full opacity-50 ${BAR_CLASSES[t.type]}`}
          />
        </div>
      ))}
    </div>
  );
}
