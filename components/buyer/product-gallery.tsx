"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { Product } from "@/types/product";
import { StockBadge } from "@/components/ui/badge";

interface ProductGalleryProps {
  product: Product;
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const images = product.images?.length ? product.images : [product.image];
  const [heroIdx, setHeroIdx] = useState(0);
  const [datasheetNotice, setDatasheetNotice] = useState(false);

  const handleDatasheetClick = () => {
    setDatasheetNotice(true);
    setTimeout(() => setDatasheetNotice(false), 3000);
  };

  return (
    <div className="flex flex-col gap-3 lg:w-[460px] shrink-0">
      {/* Hero Image Container */}
      <div className="relative aspect-[4/3] rounded-3xl bg-mocha-panel border border-mocha-border overflow-hidden">
        <Image
          src={images[heroIdx]}
          alt={product.name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 460px"
          className="object-cover transition-opacity duration-300"
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-[#11111B]/60" />

        {/* Stock Badge Overlay */}
        <div className="absolute top-3 right-3 z-10">
          <StockBadge status={product.status} stockCount={product.stock} />
        </div>
      </div>

      {/* Thumbnails Row */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => {
            const isActive = i === heroIdx;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setHeroIdx(i)}
                aria-label={`View image ${i + 1} of ${product.name}`}
                className={`relative w-[68px] h-[52px] rounded-[10px] overflow-hidden shrink-0 bg-mocha-panel transition-all duration-200 focus-visible:outline-2 focus-visible:outline-mocha-accent ${
                  isActive
                    ? "border-2 border-mocha-accent shadow-[0_0_0_3px_rgba(137,180,250,0.2)] scale-[1.02]"
                    : "border border-mocha-border opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  sizes="68px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Datasheet Download Button */}
      <div className="flex flex-col gap-1.5 mt-1">
        <button
          type="button"
          onClick={handleDatasheetClick}
          aria-expanded={datasheetNotice}
          className="flex items-center justify-center gap-2 w-full min-h-[44px] font-bold text-[12px] bg-gradient-to-b from-mocha-panel-raised to-mocha-panel border border-mocha-border-strong rounded-xl text-mocha-text-muted hover:border-mocha-accent hover:text-mocha-accent transition-all focus-visible:outline-2 focus-visible:outline-mocha-accent"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 17V3M5 20h14M7 12l5 5 5-5" />
          </svg>
          Download Datasheet (PDF)
        </button>

        {datasheetNotice && (
          <p role="status" className="text-[11px] text-mocha-warning text-center animate-in fade-in duration-200">
            Official technical datasheet PDF is currently unavailable for this mock fixture.
          </p>
        )}
      </div>
    </div>
  );
}
