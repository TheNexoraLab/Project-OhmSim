import type { StockStatus } from '@/types/product';
import { PRODUCTS } from '@/lib/mocks/products';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  minThreshold: number;
  status: StockStatus;
  price: number;
  updatedAt: string;
}

export interface InventoryMetrics {
  totalSKUs: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface InventoryResponse {
  items: InventoryItem[];
  total: number;
  metrics: InventoryMetrics;
}

export interface StockAdjustmentPayload {
  productId?: string;
  sku?: string;
  type: 'ADD' | 'REMOVE' | 'SET';
  quantity: number;
  reason?: string;
}

export interface StockAdjustmentResponse {
  success: boolean;
  sku: string;
  productName: string;
  previousStock: number;
  newStock: number;
  status: StockStatus;
  adjustment: {
    type: 'ADD' | 'REMOVE' | 'SET';
    quantity: number;
    reason: string;
    timestamp: string;
  };
  message: string;
}

export function computeStockStatus(stock: number, minThreshold: number): StockStatus {
  if (stock <= 0) return 'out-of-stock';
  if (stock <= minThreshold) return 'low-stock';
  return 'in-stock';
}

/**
 * Returns synchronous fallback inventory items from mock products.
 */
export function getInitialInventorySync(): InventoryItem[] {
  return PRODUCTS.map((p) => {
    const minThreshold = 15;
    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      stock: p.stock,
      minThreshold,
      status: computeStockStatus(p.stock, minThreshold),
      price: p.price,
      updatedAt: new Date().toISOString(),
    };
  });
}

/**
 * Fetches live inventory items and metrics from GET /api/inventory.
 */
export async function fetchInventory(options?: {
  lowStockOnly?: boolean;
  outOfStockOnly?: boolean;
  baseUrl?: string;
}): Promise<InventoryResponse> {
  const isBrowser = typeof window !== 'undefined';
  const base = options?.baseUrl || (isBrowser ? '' : null);

  if (base !== null) {
    const params = new URLSearchParams();
    if (options?.lowStockOnly) params.set('lowStockOnly', 'true');
    if (options?.outOfStockOnly) params.set('outOfStockOnly', 'true');
    const qs = params.toString();
    const url = `${base}/api/inventory${qs ? `?${qs}` : ''}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return {
        items: data.items || [],
        total: data.total || 0,
        metrics: data.metrics || {
          totalSKUs: data.items?.length || 0,
          lowStockCount: 0,
          outOfStockCount: 0,
        },
      };
    }
  }

  const fallbackItems = getInitialInventorySync();
  const lowStockCount = fallbackItems.filter((i) => i.status === 'low-stock').length;
  const outOfStockCount = fallbackItems.filter((i) => i.status === 'out-of-stock').length;

  return {
    items: fallbackItems,
    total: fallbackItems.length,
    metrics: {
      totalSKUs: fallbackItems.length,
      lowStockCount,
      outOfStockCount,
    },
  };
}

/**
 * Sends a stock adjustment request to PATCH /api/inventory.
 */
export async function adjustInventoryStock(
  payload: StockAdjustmentPayload,
  options?: { baseUrl?: string }
): Promise<StockAdjustmentResponse> {
  const isBrowser = typeof window !== 'undefined';
  const base = options?.baseUrl || (isBrowser ? '' : '');
  const url = `${base}/api/inventory`;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to adjust inventory stock.');
  }

  return data;
}

/**
 * Generates and downloads a CSV export of current inventory items.
 */
export function exportInventoryToCsv(items: InventoryItem[]): void {
  if (typeof window === 'undefined' || items.length === 0) return;

  const headers = [
    'SKU',
    'Product Name',
    'Category',
    'Current Stock',
    'Min Safety Threshold',
    'Safety Status',
    'Unit Price (PHP)',
    'Total Valuation (PHP)',
    'Last Updated',
  ];

  const rows = items.map((item) => {
    const valuation = (item.stock * item.price).toFixed(2);
    return [
      `"${item.sku.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      item.stock,
      item.minThreshold,
      `"${item.status.toUpperCase()}"`,
      item.price.toFixed(2),
      valuation,
      `"${item.updatedAt}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ohmsim-inventory-audit-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
