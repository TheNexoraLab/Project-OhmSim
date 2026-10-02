import React from "react";
import type { StockStatus } from "@/types/product";

export interface StockBadgeProps {
  status: StockStatus;
  stockCount?: number;
  className?: string;
}

export function StockBadge({ status, stockCount, className = "" }: StockBadgeProps) {
  const config = {
    "in-stock": {
      label: "In Stock",
      bg: "bg-mocha-success/15",
      text: "text-mocha-success",
      border: "border-mocha-success/30",
    },
    "low-stock": {
      label: "Low Stock",
      bg: "bg-mocha-warning/15",
      text: "text-mocha-warning",
      border: "border-mocha-warning/30",
    },
    "out-of-stock": {
      label: "Out of Stock",
      bg: "bg-mocha-danger/15",
      text: "text-mocha-danger",
      border: "border-mocha-danger/30",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border tracking-wide uppercase ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
      {stockCount !== undefined ? ` · ${stockCount} units` : ""}
    </span>
  );
}

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const variantStyles = {
    primary: "bg-mocha-accent/15 text-mocha-accent border-mocha-accent/30",
    secondary: "bg-mocha-accent-secondary/15 text-mocha-accent-secondary border-mocha-accent-secondary/30",
    success: "bg-mocha-success/15 text-mocha-success border-mocha-success/30",
    warning: "bg-mocha-warning/15 text-mocha-warning border-mocha-warning/30",
    danger: "bg-mocha-danger/15 text-mocha-danger border-mocha-danger/30",
    neutral: "bg-mocha-panel-raised text-mocha-text-muted border-mocha-border",
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}
