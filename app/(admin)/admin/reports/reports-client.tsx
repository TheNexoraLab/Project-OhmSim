"use client";

import React, { useMemo, useState } from "react";
import { INITIAL_ORDERS } from "@/lib/mocks/orders";
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mocks/products";
import { formatDate, formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { toast } from "@/components/ui/toast";

interface ProvinceDistributionRow {
  regionLabel: string;
  subLabel: string;
  orderCount: number;
  revenue: number;
  color: string;
}

interface LiquidationBatchRow {
  id: string;
  period: string;
  settlementDate: string;
  totalOrders: number;
  codCollected: number;
  pickupCollected: number;
  shippingFeesCollected: number;
  courierHandlingDeduction: number;
  netRemitted: number;
  remittanceStatus: "REMITTED" | "IN_SETTLEMENT";
}

const LIQUIDATION_BATCHES: LiquidationBatchRow[] = [
  {
    id: "liq-2026-08-w4",
    period: "Aug 22 – Aug 29, 2026 (Week 4)",
    settlementDate: "2026-08-29T17:00:00Z",
    totalOrders: 6,
    codCollected: 4895,
    pickupCollected: 2170,
    shippingFeesCollected: 240,
    courierHandlingDeduction: 160,
    netRemitted: 7145,
    remittanceStatus: "IN_SETTLEMENT",
  },
  {
    id: "liq-2026-08-w3",
    period: "Aug 15 – Aug 21, 2026 (Week 3)",
    settlementDate: "2026-08-21T17:30:00Z",
    totalOrders: 5,
    codCollected: 4120,
    pickupCollected: 1680,
    shippingFeesCollected: 160,
    courierHandlingDeduction: 120,
    netRemitted: 5840,
    remittanceStatus: "REMITTED",
  },
  {
    id: "liq-2026-08-w2",
    period: "Aug 08 – Aug 14, 2026 (Week 2)",
    settlementDate: "2026-08-14T18:00:00Z",
    totalOrders: 4,
    codCollected: 2950,
    pickupCollected: 2190,
    shippingFeesCollected: 80,
    courierHandlingDeduction: 80,
    netRemitted: 5140,
    remittanceStatus: "REMITTED",
  },
  {
    id: "liq-2026-07-m",
    period: "July 2026 Consolidated Cycle",
    settlementDate: "2026-07-31T18:00:00Z",
    totalOrders: 9,
    codCollected: 6840,
    pickupCollected: 3420,
    shippingFeesCollected: 320,
    courierHandlingDeduction: 240,
    netRemitted: 10340,
    remittanceStatus: "REMITTED",
  },
];

export function ReportsClient() {
  const [selectedPeriodFilter, setSelectedPeriodFilter] = useState<
    "ALL" | "REMITTED" | "IN_SETTLEMENT"
  >("ALL");

  // Calculate financial telemetry derived from INITIAL_ORDERS + Monthly Liquidation Ledger
  const financialTelemetry = useMemo(() => {
    const nonCancelledOrders = INITIAL_ORDERS.filter(
      (o) => o.status !== "CANCELLED",
    );
    const completedOrders = INITIAL_ORDERS.filter(
      (o) => o.status === "COMPLETED",
    );

    const grossOrderFixtureRevenue = nonCancelledOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );
    const completedFixtureRevenue = completedOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0,
    );

    const totalLedgerGross = LIQUIDATION_BATCHES.reduce(
      (sum, row) =>
        sum + row.codCollected + row.pickupCollected + row.shippingFeesCollected,
      0,
    );
    const totalLedgerOrders = LIQUIDATION_BATCHES.reduce(
      (sum, row) => sum + row.totalOrders,
      0,
    );
    const totalCodCollected = LIQUIDATION_BATCHES.reduce(
      (sum, row) => sum + row.codCollected,
      0,
    );
    const totalRemitted = LIQUIDATION_BATCHES.filter(
      (r) => r.remittanceStatus === "REMITTED",
    ).reduce((sum, r) => sum + r.netRemitted, 0);
    const pendingRemittance = LIQUIDATION_BATCHES.filter(
      (r) => r.remittanceStatus === "IN_SETTLEMENT",
    ).reduce((sum, r) => sum + r.netRemitted, 0);

    const deliveryOrdersCount = nonCancelledOrders.filter(
      (o) => o.fulfillmentType === "DELIVERY",
    ).length;
    const pickupOrdersCount = nonCancelledOrders.filter(
      (o) => o.fulfillmentType === "PICKUP",
    ).length;

    const totalActiveCount = Math.max(1, nonCancelledOrders.length);
    const deliveryPct = Math.round(
      (deliveryOrdersCount / totalActiveCount) * 100,
    );
    const pickupPct = 100 - deliveryPct;

    const aov = totalLedgerGross / Math.max(1, totalLedgerOrders);

    return {
      grossRevenue: totalLedgerGross,
      grossOrderFixtureRevenue,
      completedFixtureRevenue,
      aov,
      deliveryPct,
      pickupPct,
      deliveryOrdersCount,
      pickupOrdersCount,
      totalCodCollected,
      totalRemitted,
      pendingRemittance,
      totalLedgerOrders,
    };
  }, []);

  // Fulfillment Distribution Breakdown across Region III Provinces vs Campus Pickup
  const fulfillmentBreakdown: ProvinceDistributionRow[] = useMemo(
    () => [
      {
        regionLabel: "Pampanga (San Fernando & Angeles City)",
        subLabel: "Region III Courier Hub • Same/Next-Day COD",
        orderCount: 9,
        revenue: 9420,
        color: "#89B4FA",
      },
      {
        regionLabel: "Campus Lab Pickup (Building 3, Room 204)",
        subLabel: "Store / Lab Station • ₱0.00 Pickup Fee",
        orderCount: 7,
        revenue: 9460,
        color: "#94E2D5",
      },
      {
        regionLabel: "Bulacan (Malolos & Meycauayan)",
        subLabel: "Region III South Corridor • COD",
        orderCount: 4,
        revenue: 4680,
        color: "#CBA6F7",
      },
      {
        regionLabel: "Nueva Ecija (Cabanatuan & Science City of Muñoz)",
        subLabel: "Region III North-East Corridor • COD",
        orderCount: 2,
        revenue: 2490,
        color: "#F9E2AF",
      },
      {
        regionLabel: "Bataan & Tarlac (Balanga & Tarlac City)",
        subLabel: "Region III West/North Corridor • COD",
        orderCount: 2,
        revenue: 2575,
        color: "#A6E3A1",
      },
    ],
    [],
  );

  // Category Revenue Contribution from MOCK_PRODUCTS
  const categoryBreakdown = useMemo(() => {
    const categories = [
      { name: "Microcontrollers", sharePct: 38, color: "#89B4FA" },
      { name: "Development Boards", sharePct: 27, color: "#94E2D5" },
      { name: "Sensors", sharePct: 18, color: "#CBA6F7" },
      { name: "ICs", sharePct: 10, color: "#F9E2AF" },
      { name: "Passive", sharePct: 7, color: "#A6E3A1" },
    ];
    return categories.map((cat) => {
      const skuCount = MOCK_PRODUCTS.filter(
        (p) => p.category === cat.name,
      ).length;
      return {
        ...cat,
        skuCount,
        amount: Math.round(
          (financialTelemetry.grossRevenue * cat.sharePct) / 100,
        ),
      };
    });
  }, [financialTelemetry.grossRevenue]);

  const filteredLiquidationRows = useMemo(() => {
    if (selectedPeriodFilter === "ALL") return LIQUIDATION_BATCHES;
    return LIQUIDATION_BATCHES.filter(
      (row) => row.remittanceStatus === selectedPeriodFilter,
    );
  }, [selectedPeriodFilter]);

  const handleExportLiquidation = () => {
    toast(
      "Exported Region III Monthly Liquidation & COD Remittance Ledger (CSV).",
      "success",
    );
  };

  return (
    <div
      data-testid="admin-reports-page"
      className="mx-auto flex w-full max-w-[1600px] flex-col gap-6"
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-[#313244] pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A6E3A1]/30 bg-[#A6E3A1]/12 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#A6E3A1] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#A6E3A1]" />
              REVENUE TELEMETRY &amp; COD LIQUIDATION
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-[#CDD6F4] sm:text-2xl">
            Sales Reports &amp; Liquidation
          </h1>
          <p className="mt-0.5 text-xs text-[#BAC2DE] sm:text-sm">
            Analyze gross hardware revenue, Average Order Value (AOV), Region
            III vs Campus Pickup split, and courier COD remittances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="accent"
            size="small"
            onClick={handleExportLiquidation}
          >
            Export Liquidation CSV
          </Button>
        </div>
      </div>

      {/* Key Financial Telemetry Cards (4 Cards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* 1. Gross Revenue */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Gross Revenue
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#A6E3A1]">
                {formatPrice(financialTelemetry.grossRevenue)}
              </p>
            </div>
            <Badge variant="success" className="font-mono">
              +18.4% MoM
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Across {financialTelemetry.totalLedgerOrders} settled &amp; active
            orders ({formatPrice(financialTelemetry.grossOrderFixtureRevenue)}{" "}
            in live queue)
          </p>
        </Surface>

        {/* 2. Average Order Value (AOV) */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Average Order Value (AOV)
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#89B4FA]">
                {formatPrice(financialTelemetry.aov)}
              </p>
            </div>
            <Badge variant="primary" className="font-mono">
              AOV
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Free Region III shipping unlocked at ₱1,000+ basket threshold
          </p>
        </Surface>

        {/* 3. Region III Delivery vs Campus Lab Pickup Split */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                Delivery vs Lab Pickup Split
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#CDD6F4]">
                {financialTelemetry.deliveryPct}%{" "}
                <span className="text-sm font-normal text-[#A6ADC8]">/</span>{" "}
                <span className="text-[#94E2D5]">
                  {financialTelemetry.pickupPct}%
                </span>
              </p>
            </div>
            <Badge variant="secondary" className="font-mono">
              SPLIT
            </Badge>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#11111B]">
            <div
              className="h-full bg-[#89B4FA]"
              style={{ width: `${financialTelemetry.deliveryPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[#A6ADC8]">
            {financialTelemetry.deliveryPct}% Region III Courier •{" "}
            {financialTelemetry.pickupPct}% Campus Lab Station
          </p>
        </Surface>

        {/* 4. COD Collection & Remittance Status */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-4"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#A6ADC8] uppercase">
                COD Collection &amp; Remittance
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#F9E2AF]">
                {formatPrice(financialTelemetry.totalCodCollected)}
              </p>
            </div>
            <Badge variant="warning" className="font-mono">
              COD LEDGER
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[#A6ADC8]">
            Remitted:{" "}
            <span className="font-mono text-[#A6E3A1]">
              {formatPrice(financialTelemetry.totalRemitted)}
            </span>{" "}
            • In Transit:{" "}
            <span className="font-mono text-[#F9E2AF]">
              {formatPrice(financialTelemetry.pendingRemittance)}
            </span>
          </p>
        </Surface>
      </div>

      {/* Fulfillment Distribution Breakdown & Category Telemetry (Pure CSS/SVG) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Fulfillment Distribution Breakdown (7 cols) */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-5 lg:col-span-7"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#313244] pb-3.5">
            <div>
              <h2 className="text-sm font-bold text-[#CDD6F4]">
                Fulfillment Distribution Breakdown (Region III vs Campus Pickup)
              </h2>
              <p className="text-xs text-[#A6ADC8]">
                Order volume and gross sales across Central Luzon provinces and
                Building 3 Lab Station
              </p>
            </div>
            <span className="font-mono text-xs text-[#89B4FA]">
              24 Total Dispatches
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {fulfillmentBreakdown.map((item) => {
              const pct = Math.round((item.orderCount / 24) * 100);
              return (
                <div key={item.regionLabel} className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#CDD6F4]">
                        {item.regionLabel}
                      </span>
                      <span className="ml-2 text-[11px] text-[#A6ADC8]">
                        ({item.subLabel})
                      </span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[#BAC2DE]">
                        {item.orderCount} orders ({pct}%)
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: item.color }}
                      >
                        {formatPrice(item.revenue)}
                      </span>
                    </div>
                  </div>

                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#11111B]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Surface>

        {/* Revenue by Hardware Category (5 cols) */}
        <Surface
          variant="panel"
          className="border border-[#313244] bg-[#1E1E2E] p-5 lg:col-span-5"
        >
          <div className="border-b border-[#313244] pb-3.5">
            <h2 className="text-sm font-bold text-[#CDD6F4]">
              Revenue Share by Component Category
            </h2>
            <p className="text-xs text-[#A6ADC8]">
              Gross sales distribution across OhmSim catalog taxonomy
            </p>
          </div>

          {/* Segmented Stacked Bar */}
          <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-[#11111B]">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.name}
                title={`${cat.name}: ${cat.sharePct}%`}
                style={{
                  width: `${cat.sharePct}%`,
                  backgroundColor: cat.color,
                }}
                className="h-full first:rounded-l-full last:rounded-r-full"
              />
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {categoryBreakdown.map((cat) => (
              <div
                key={cat.name}
                className="flex items-center justify-between rounded-lg border border-[#313244]/70 bg-[#181825] px-3.5 py-2.5 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-[#CDD6F4]">
                    {cat.name}
                  </span>
                  <span className="font-mono text-[11px] text-[#A6ADC8]">
                    ({cat.skuCount} SKUs)
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-[#A6ADC8]">{cat.sharePct}%</span>
                  <span className="font-bold text-[#CDD6F4]">
                    {formatPrice(cat.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      {/* Monthly Liquidation Table */}
      <Surface
        variant="panel"
        className="overflow-hidden border border-[#313244] bg-[#1E1E2E] p-0"
      >
        <div className="flex flex-col gap-3 border-b border-[#313244] bg-[#181825] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#CDD6F4]">
              Monthly Liquidation &amp; COD Remittance Table
            </h2>
            <p className="text-xs text-[#A6ADC8]">
              Reconciliation of Cash on Delivery (COD) collections, Campus Lab
              Pay-on-Pickup receipts, courier fees, and net revenue
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "ALL", label: "All Cycles" },
                { id: "REMITTED", label: "Remitted" },
                { id: "IN_SETTLEMENT", label: "In Settlement" },
              ] as const
            ).map((tab) => {
              const active = selectedPeriodFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedPeriodFilter(tab.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    active
                      ? "border-[#89B4FA] bg-[#89B4FA]/14 text-[#89B4FA]"
                      : "border-[#313244] bg-[#1E1E2E] text-[#A6ADC8] hover:text-[#CDD6F4]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#313244] bg-[#181825]/60 text-[11px] font-semibold tracking-wider text-[#A6ADC8] uppercase">
                <th className="px-4 py-3.5">Reporting Period</th>
                <th className="px-4 py-3.5">Settlement Date</th>
                <th className="px-4 py-3.5 text-center">Orders</th>
                <th className="px-4 py-3.5 text-right">COD Collections</th>
                <th className="px-4 py-3.5 text-right">
                  Pay on Pickup (Lab)
                </th>
                <th className="px-4 py-3.5 text-right">Shipping Fees</th>
                <th className="px-4 py-3.5 text-right">Courier Deduction</th>
                <th className="px-4 py-3.5 text-right">Net Revenue</th>
                <th className="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#313244]/60 text-xs sm:text-sm">
              {filteredLiquidationRows.map((row) => {
                const isRemitted = row.remittanceStatus === "REMITTED";
                return (
                  <tr
                    key={row.id}
                    className="transition-colors hover:bg-[#181825]/70"
                  >
                    <td className="px-4 py-3.5 font-semibold text-[#CDD6F4]">
                      {row.period}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#A6ADC8]">
                      {formatDate(row.settlementDate)}
                    </td>
                    <td className="px-4 py-3.5 text-center font-mono text-[#CDD6F4]">
                      {row.totalOrders}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#89B4FA]">
                      {formatPrice(row.codCollected)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#94E2D5]">
                      {formatPrice(row.pickupCollected)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#BAC2DE]">
                      {formatPrice(row.shippingFeesCollected)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-[#F38BA8]">
                      -{formatPrice(row.courierHandlingDeduction)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-[#A6E3A1]">
                      {formatPrice(row.netRemitted)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold"
                        style={
                          isRemitted
                            ? {
                                color: "#A6E3A1",
                                backgroundColor: "rgba(166, 227, 161, 0.12)",
                                border: "1px solid rgba(166, 227, 161, 0.3)",
                              }
                            : {
                                color: "#F9E2AF",
                                backgroundColor: "rgba(249, 226, 175, 0.12)",
                                border: "1px solid rgba(249, 226, 175, 0.3)",
                              }
                        }
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            backgroundColor: isRemitted
                              ? "#A6E3A1"
                              : "#F9E2AF",
                          }}
                        />
                        {isRemitted ? "REMITTED" : "IN SETTLEMENT"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
