export interface ProvinceDistributionRow {
  regionLabel: string;
  subLabel: string;
  orderCount: number;
  revenue: number;
  color: string;
}

export interface LiquidationBatchRow {
  id: string;
  period: string;
  settlementDate: string;
  totalOrders: number;
  codCollected: number;
  pickupCollected: number;
  shippingFeesCollected: number;
  courierHandlingDeduction: number;
  netRemitted: number;
  remittanceStatus: 'REMITTED' | 'IN_SETTLEMENT';
}

export interface AdminFinancialTelemetry {
  grossRevenue: number;
  grossOrderFixtureRevenue: number;
  completedFixtureRevenue: number;
  aov: number;
  deliveryPct: number;
  pickupPct: number;
  deliveryOrdersCount: number;
  pickupOrdersCount: number;
  totalCodCollected: number;
  totalRemitted: number;
  pendingRemittance: number;
  totalLedgerOrders: number;
}

export interface AdminReportsData {
  telemetry: AdminFinancialTelemetry;
  fulfillmentBreakdown: ProvinceDistributionRow[];
  liquidationBatches: LiquidationBatchRow[];
}

/**
 * Fetch reports telemetry and liquidation batches from /api/admin/reports
 */
export async function getReports(role: string = 'ADMIN'): Promise<AdminReportsData | null> {
  try {
    const res = await fetch(`/api/admin/reports?role=${encodeURIComponent(role)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (error) {
    console.warn('Network or database error fetching admin reports:', error);
  }
  return null;
}
