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
      "rounded-[22px] bg-gradient-to-br from-[#313244] to-[#1E1E2E] border border-[#585B70]/40 shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
    panel:
      "rounded-[18px] bg-[#1E1E2E] border border-[#313244]",
    raised:
      "rounded-[18px] bg-[#313244] border border-[#45475A] shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
    hero:
      "rounded-[24px] bg-gradient-to-br from-[#313244] to-[#1E1E2E] border border-[#585B70] shadow-[0_8px_24px_rgba(0,0,0,0.28)]",
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
