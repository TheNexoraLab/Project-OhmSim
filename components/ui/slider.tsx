"use client";

import React, { useRef, useCallback, useEffect } from "react";

export interface DualSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  step?: number;
  ticks?: string[];
  formatLabel?: (value: number) => string;
  labelLow?: string;
  labelHigh?: string;
}

export function DualSlider({
  min,
  max,
  value,
  onChange,
  step = 0.1,
  ticks,
  formatLabel,
  labelLow = "Minimum value",
  labelHigh = "Maximum value",
}: DualSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<"lo" | "hi" | null>(null);
  const fmt = formatLabel ?? String;

  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));

  const snap = useCallback(
    (raw: number) => {
      const s = Math.round(raw / step) * step;
      return parseFloat(Math.min(max, Math.max(min, s)).toFixed(3));
    },
    [min, max, step]
  );

  const fromX = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const r = trackRef.current.getBoundingClientRect();
      return snap(min + ((clientX - r.left) / r.width) * (max - min));
    },
    [min, max, snap]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!handleRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const v = fromX(clientX);
      if (handleRef.current === "lo") {
        onChange([Math.min(v, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(v, value[0] + step)]);
      }
    };

    const onUp = () => {
      handleRef.current = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [value, onChange, fromX, step]);

  const handleKeyDown = (which: "lo" | "hi", e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      delta = -step;
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      delta = step;
    } else if (e.key === "PageDown") {
      delta = -step * 10;
    } else if (e.key === "PageUp") {
      delta = step * 10;
    } else if (e.key === "Home") {
      if (which === "lo") onChange([min, value[1]]);
      else onChange([value[0], value[0] + step]);
      e.preventDefault();
      return;
    } else if (e.key === "End") {
      if (which === "lo") onChange([value[1] - step, value[1]]);
      else onChange([value[0], max]);
      e.preventDefault();
      return;
    } else {
      return;
    }

    e.preventDefault();
    if (which === "lo") {
      const nextVal = snap(Math.max(min, Math.min(value[1] - step, value[0] + delta)));
      onChange([nextVal, value[1]]);
    } else {
      const nextVal = snap(Math.min(max, Math.max(value[0] + step, value[1] + delta)));
      onChange([value[0], nextVal]);
    }
  };

  return (
    <div className="select-none px-1">
      <div className="relative h-6 flex items-center" ref={trackRef}>
        {/* Track background */}
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-mocha-panel-raised" />
        {/* Selected range highlight */}
        <div
          className="absolute h-[3px] rounded-full bg-mocha-accent"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />

        {/* Low Thumb with expanded 44x44px touch target */}
        <div
          role="slider"
          aria-label={labelLow}
          aria-valuemin={min}
          aria-valuemax={value[1] - step}
          aria-valuenow={value[0]}
          tabIndex={0}
          className="absolute w-3.5 h-3.5 rounded-full border-[2.5px] border-white cursor-grab z-10 bg-mocha-accent focus-visible:outline-2 focus-visible:outline-mocha-accent focus-visible:outline-offset-2 transition-transform hover:scale-110 active:scale-95 before:content-[''] before:absolute before:w-11 before:h-11 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
          style={{ left: `${pct(value[0])}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleRef.current = "lo";
          }}
          onTouchStart={() => {
            handleRef.current = "lo";
          }}
          onKeyDown={(e) => handleKeyDown("lo", e)}
        />

        {/* High Thumb with expanded 44x44px touch target */}
        <div
          role="slider"
          aria-label={labelHigh}
          aria-valuemin={value[0] + step}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          tabIndex={0}
          className="absolute w-3.5 h-3.5 rounded-full border-[2.5px] border-white cursor-grab z-10 bg-mocha-accent focus-visible:outline-2 focus-visible:outline-mocha-accent focus-visible:outline-offset-2 transition-transform hover:scale-110 active:scale-95 before:content-[''] before:absolute before:w-11 before:h-11 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
          style={{ left: `${pct(value[1])}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.preventDefault();
            handleRef.current = "hi";
          }}
          onTouchStart={() => {
            handleRef.current = "hi";
          }}
          onKeyDown={(e) => handleKeyDown("hi", e)}
        />
      </div>

      {ticks && (
        <div className="flex justify-between mt-2">
          {ticks.map((t, i) => (
            <span key={i} className="text-[9px] font-mono text-mocha-text-muted">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className={`flex justify-between ${ticks ? "mt-0.5" : "mt-2"}`}>
        <span className="text-[10px] font-mono font-semibold text-mocha-accent">
          {fmt(value[0])}
        </span>
        <span className="text-[10px] font-mono font-semibold text-mocha-accent">
          {fmt(value[1])}
        </span>
      </div>
    </div>
  );
}

export interface SingleSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
}

export function SingleSlider({
  min,
  max,
  value,
  onChange,
  step = 1,
  label = "Minimum stock threshold",
}: SingleSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(false);
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  const snap = useCallback(
    (raw: number) => {
      const s = Math.round(raw / step) * step;
      return Math.round(Math.min(max, Math.max(min, s)));
    },
    [min, max, step]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!activeRef.current || !trackRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const r = trackRef.current.getBoundingClientRect();
      const raw = min + ((clientX - r.left) / r.width) * (max - min);
      onChange(snap(raw));
    };

    const onUp = () => {
      activeRef.current = false;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [min, max, onChange, snap]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      delta = -step;
    } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      delta = step;
    } else if (e.key === "PageDown") {
      delta = -step * 10;
    } else if (e.key === "PageUp") {
      delta = step * 10;
    } else if (e.key === "Home") {
      onChange(min);
      e.preventDefault();
      return;
    } else if (e.key === "End") {
      onChange(max);
      e.preventDefault();
      return;
    } else {
      return;
    }

    e.preventDefault();
    onChange(snap(Math.min(max, Math.max(min, value + delta))));
  };

  return (
    <div className="select-none px-1">
      <div className="relative h-6 flex items-center" ref={trackRef}>
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-mocha-panel-raised" />
        <div className="absolute left-0 h-[3px] rounded-full bg-mocha-accent" style={{ right: `${100 - pct}%` }} />
        {/* Single Thumb with expanded 44x44px touch target */}
        <div
          role="slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={0}
          className="absolute w-3.5 h-3.5 rounded-full border-[2.5px] border-white cursor-grab z-10 bg-mocha-accent focus-visible:outline-2 focus-visible:outline-mocha-accent focus-visible:outline-offset-2 transition-transform hover:scale-110 active:scale-95 before:content-[''] before:absolute before:w-11 before:h-11 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2"
          style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.preventDefault();
            activeRef.current = true;
          }}
          onTouchStart={() => {
            activeRef.current = true;
          }}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-[9px] font-mono text-mocha-text-muted">{min}</span>
        <span className="text-[10px] font-mono font-semibold text-mocha-accent">≥ {value}</span>
        <span className="text-[9px] font-mono text-mocha-text-muted">{max}</span>
      </div>
    </div>
  );
}
