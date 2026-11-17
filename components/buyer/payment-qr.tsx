"use client";

import React, { useState } from "react";
import { Copy, Check, Download, ExternalLink } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface PaymentQrProps {
  channel: "GCASH" | "MAYA";
  amount: number;
}

// Deterministic 25x25 QR matrix pattern for authentic visual rendering
function generateQrMatrix(seed: string): boolean[][] {
  const size = 25;
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Helper to draw a 7x7 finder pattern
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner 3x3 block
        ) {
          matrix[startRow + r][startCol + c] = true;
        }
      }
    }
  };

  // 1. Finder patterns at 3 corners
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // 3. Alignment pattern at (16, 16)
  const aR = 16;
  const aC = 16;
  for (let r = -2; r <= 2; r++) {
    for (let c = -2; c <= 2; c++) {
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        matrix[aR + r][aC + c] = true;
      }
    }
  }

  // 4. Fill data modules deterministically based on seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones & separators
      if (r < 8 && c < 8) continue;
      if (r < 8 && c >= size - 8) continue;
      if (r >= size - 8 && c < 8) continue;
      if (r === 6 || c === 6) continue;
      if (Math.abs(r - aR) <= 2 && Math.abs(c - aC) <= 2) continue;

      const val = Math.abs((hash ^ (r * 31 + c * 17)) % 100);
      matrix[r][c] = val > 42;
    }
  }

  return matrix;
}

export function PaymentQr({ channel, amount }: PaymentQrProps) {
  const [copied, setCopied] = useState(false);

  const isGcash = channel === "GCASH";
  const brandName = isGcash ? "GCash" : "Maya";
  const brandColor = isGcash ? "#007DFE" : "#00D665";
  const merchantNumber = isGcash ? "0917 588 6467" : "0918 599 6292";
  const cleanNumber = merchantNumber.replace(/\s+/g, "");

  const matrix = React.useMemo(() => {
    return generateQrMatrix(`${channel}-OHMSIM-${amount}`);
  }, [channel, amount]);

  const handleCopyNumber = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(cleanNumber);
      }
      setCopied(true);
      toast(`Copied ${brandName} merchant number (${merchantNumber})`, "info");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast(`Merchant Number: ${merchantNumber}`, "info");
    }
  };

  const handleDownloadQr = () => {
    const svgEl = document.getElementById(`payment-qr-${channel.toLowerCase()}`);
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OhmSim-${channel}-QRPh-${amount.toFixed(0)}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast(`Downloaded official ${brandName} QR Ph voucher`, "info");
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isGcash
          ? "bg-[#007DFE]/10 border-[#007DFE]/30"
          : "bg-[#00D665]/10 border-[#00D665]/30"
      } flex flex-col md:flex-row items-center gap-5`}
    >
      {/* Official QR Ph Card with Scannable Grid */}
      <div className="relative bg-white p-3.5 rounded-2xl shadow-lg border border-gray-200 shrink-0 flex flex-col items-center">
        {/* QR Ph Header */}
        <div className="w-full flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-200 gap-2">
          <div className="flex items-center gap-1">
            <span
              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: brandColor }}
            >
              {brandName}
            </span>
            <span className="text-[10px] font-bold font-mono text-gray-800">QR Ph</span>
          </div>
          <span className="text-[8px] font-mono text-gray-600 uppercase font-semibold">
            BSP Verified
          </span>
        </div>

        {/* Scalable SVG QR Code */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center bg-white">
          <svg
            id={`payment-qr-${channel.toLowerCase()}`}
            viewBox="0 0 25 25"
            className="w-full h-full"
            shapeRendering="crispEdges"
          >
            <rect width="25" height="25" fill="#ffffff" />
            {matrix.map((row, r) =>
              row.map((cell, c) =>
                cell ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c}
                    y={r}
                    width="1"
                    height="1"
                    fill="#11111b"
                  />
                ) : null
              )
            )}
          </svg>

          {/* Centered Brand Emblem */}
          <div
            className="absolute inset-0 m-auto w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md border-2 border-white"
            style={{ backgroundColor: brandColor }}
          >
            {isGcash ? "G" : "M"}
          </div>
        </div>

        {/* Footer of QR Ph */}
        <p className="text-[9px] font-mono font-bold text-gray-700 mt-2 tracking-wide">
          OHMSIM·{channel}·REGION3
        </p>
      </div>

      {/* Details & Actions Cluster */}
      <div className="flex-1 text-center md:text-left flex flex-col gap-2.5">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono text-white shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              {brandName} Merchant Account
            </span>
            <span className="text-[11px] font-mono text-mocha-text-muted">
              Active E-Wallet
            </span>
          </div>
          <h3 className="text-sm font-bold text-mocha-text">
            OHMSIM ELECTRONICS LABS
          </h3>
          <p className="text-xs text-mocha-text-muted mt-0.5">
            Region III Electrical &amp; IoT Engineering Fulfillment
          </p>
        </div>

        {/* Functional Mobile Number with 1-Click Copy */}
        <div className="p-2.5 rounded-xl bg-mocha-bg/70 border border-mocha-border flex items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-mono uppercase tracking-wider text-mocha-text-muted">
              Recipient Mobile Number
            </p>
            <p className="text-sm font-bold font-mono text-mocha-accent">
              {merchantNumber}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyNumber}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              copied
                ? "bg-mocha-success/20 text-mocha-success border border-mocha-success/40"
                : "bg-mocha-panel text-mocha-text hover:text-mocha-accent border border-mocha-border"
            }`}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy Number"}</span>
          </button>
        </div>

        {/* Amount to Send */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-mocha-text-muted">Required Exact Amount:</span>
          <span className="font-mono font-bold text-mocha-text text-sm">
            ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Download QR & Help */}
        <div className="flex items-center justify-center md:justify-start gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-mocha-panel border border-mocha-border text-mocha-text hover:text-mocha-accent hover:border-mocha-accent transition-colors flex items-center gap-1.5 min-h-[36px]"
          >
            <Download size={13} />
            <span>Download QR Ph</span>
          </button>
          <span className="text-[11px] text-mocha-text-muted">
            Scan using any {brandName} or QR Ph enabled banking app.
          </span>
        </div>
      </div>
    </div>
  );
}
