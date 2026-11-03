import React from "react";
import { Surface } from "@/components/ui/surface";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export interface AdminKpiCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badgeText?: string;
  badgeVariant?: BadgeProps["variant"];
  accentColor?: string;
  progressPercent?: number;
  progressLabel?: string;
  icon: React.ReactNode;
  dataTestId?: string;
}

export function AdminKpiCard({
  title,
  value,
  subtitle,
  badgeText,
  badgeVariant = "primary",
  accentColor = "#89B4FA",
  progressPercent = 100,
  progressLabel,
  icon,
  dataTestId,
}: AdminKpiCardProps) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(progressPercent)));

  return (
    <Surface
      variant="panel"
      data-testid={dataTestId}
      className="p-5 bg-[#1E1E2E] border border-[#313244] hover:border-[#45475A] transition-colors flex flex-col justify-between gap-4 shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A6ADC8]">
            {title}
          </p>
          <p
            data-kpi-value
            className="mt-2 text-2xl sm:text-[26px] font-bold font-mono tracking-tight text-[#CDD6F4] truncate"
          >
            {value}
          </p>
        </div>

        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${accentColor}1F`,
            borderColor: `${accentColor}4D`,
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div
          role="progressbar"
          aria-label={progressLabel ?? `${title} indicator`}
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-1.5 rounded-full bg-[#181825] border border-[#313244] overflow-hidden"
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${clampedProgress}%`,
              backgroundColor: accentColor,
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="text-xs text-[#BAC2DE] truncate">{subtitle}</span>
          {badgeText && (
            <Badge variant={badgeVariant} className="shrink-0 font-mono">
              {badgeText}
            </Badge>
          )}
        </div>
      </div>
    </Surface>
  );
}
