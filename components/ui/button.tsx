import React from "react";

export type ButtonVariant = "raised" | "surface" | "outline" | "accent";
export type ButtonSize = "compact" | "small" | "default" | "large";

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    BaseButtonProps {}

export interface ButtonLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    BaseButtonProps {
  href: string;
}

export function getButtonClasses(
  variant: ButtonVariant = "surface",
  size: ButtonSize = "default",
  className = ""
): string {
  const baseClasses =
    "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-mocha-accent disabled:opacity-50 disabled:pointer-events-none";

  const sizeClasses: Record<ButtonSize, string> = {
    compact: "h-7 px-3 text-xs rounded-small min-h-[44px] min-w-[44px]",
    small:
      "h-9 px-4 text-xs font-semibold rounded-control min-h-[36px] min-w-[44px] relative after:absolute after:-inset-y-1 after:-inset-x-0 after:min-h-[44px] after:content-['']",
    default: "h-11 px-5 text-sm font-medium rounded-control min-h-[44px] min-w-[44px]",
    large: "h-12 px-6 text-base font-semibold rounded-control min-h-[48px] min-w-[44px]",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    raised:
      "bg-gradient-to-b from-mocha-panel-raised to-mocha-panel text-mocha-text border border-mocha-panel-high shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:border-mocha-accent hover:text-mocha-text hover:shadow-[0_6px_16px_rgba(137,180,250,0.15)] active:translate-y-[1px]",
    surface:
      "bg-mocha-panel text-mocha-text border border-mocha-border hover:bg-mocha-panel-raised hover:border-mocha-panel-high active:translate-y-[1px]",
    outline:
      "bg-transparent text-mocha-text border border-mocha-border-strong hover:border-mocha-accent hover:text-mocha-accent active:translate-y-[1px]",
    accent:
      "bg-gradient-to-r from-mocha-accent to-mocha-accent-secondary text-mocha-bg font-bold border-none shadow-[0_4px_16px_rgba(137,180,250,0.3)] hover:brightness-110 hover:shadow-[0_6px_20px_rgba(137,180,250,0.45)] active:translate-y-[1px]",
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`.trim();
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "surface", size = "default", className = "", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={getButtonClasses(variant, size, className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  (
    {
      variant = "surface",
      size = "default",
      className = "",
      href,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <a
        ref={ref}
        href={href}
        className={getButtonClasses(variant, size, className)}
        {...props}
      >
        {children}
      </a>
    );
  }
);
ButtonLink.displayName = "ButtonLink";
