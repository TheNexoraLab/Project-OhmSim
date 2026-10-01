import React from "react";

export type SurfaceVariant = "card" | "panel" | "raised" | "hero";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
  className?: string;
}

export function getSurfaceClasses(
  variant: SurfaceVariant = "panel",
  className = ""
): string {
  const baseClasses = "relative transition-colors duration-200";

  const variantClasses: Record<SurfaceVariant, string> = {
    card:
      "rounded-card bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border-strong/40 shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
    panel:
      "rounded-panel bg-mocha-panel border border-mocha-border",
    raised:
      "rounded-panel bg-mocha-panel-raised border border-mocha-panel-high shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
    hero:
      "rounded-hero bg-gradient-to-br from-mocha-panel-raised to-mocha-panel border border-mocha-border-strong shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
  };

  return `${baseClasses} ${variantClasses[variant]} ${className}`.trim();
}

export const Surface = React.forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "panel", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={getSurfaceClasses(variant, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Surface.displayName = "Surface";
