"use client";

import { useSyncExternalStore } from "react";
import { PRODUCTS as MOCK_PRODUCTS } from "@/lib/mocks/products";
import type { Product, StockStatus } from "@/types/product";

export type AdminCategoryIconKey =
  | "mcu"
  | "sensor"
  | "ic"
  | "board"
  | "passive"
  | "power";

export interface AdminCategoryRecord {
  id: string;
  name: string;
  slug: string;
  icon: AdminCategoryIconKey;
  description: string;
  createdAt: string;
}

export interface AdminProductRecord extends Omit<Product, "category"> {
  category: string;
  minThreshold: number;
  shortDescription: string;
  fullDescription: string;
  datasheetUrl: string;
  specs: Record<string, string>;
  updatedAt: string;
}

export type StockAdjustmentType = "ADD" | "REMOVE";

export type StockAdjustmentReason =
  | "Restock Shipment"
  | "Damaged / Defective"
  | "Inventory Audit Adjustment";

export interface StockAdjustmentLog {
  id: string;
  sku: string;
  productName: string;
  type: StockAdjustmentType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: StockAdjustmentReason;
  timestamp: string;
}

const DEFAULT_MIN_THRESHOLD = 15;

const INITIAL_ADMIN_CATEGORIES: AdminCategoryRecord[] = [
  {
    id: "cat-mcu",
    name: "Microcontrollers",
    slug: "microcontrollers",
    icon: "mcu",
    description:
      "32-bit and 8-bit MCU modules, Wi-Fi/BLE SoCs, and embedded controller cores for IoT and robotics.",
    createdAt: "2026-07-01T08:00:00Z",
  },
  {
    id: "cat-sensors",
    name: "Sensors",
    slug: "sensors",
    icon: "sensor",
    description:
      "Ultrasonic distance, environmental temperature/humidity, optical, and MEMS transducer modules.",
    createdAt: "2026-07-01T08:00:00Z",
  },
  {
    id: "cat-ics",
    name: "ICs",
    slug: "ics",
    icon: "ic",
    description:
      "Precision timers, dual H-bridge motor drivers, OLED display controllers, and discrete logic ICs.",
    createdAt: "2026-07-01T08:00:00Z",
  },
  {
    id: "cat-boards",
    name: "Development Boards",
    slug: "development-boards",
    icon: "board",
    description:
      "Complete prototyping boards, breakout kits, and educational lab evaluation platforms.",
    createdAt: "2026-07-01T08:00:00Z",
  },
  {
    id: "cat-passive",
    name: "Passive",
    slug: "passive",
    icon: "passive",
    description:
      "Through-hole and SMD resistor kits, ceramic/electrolytic capacitors, inductors, and potentiometers.",
    createdAt: "2026-07-01T08:00:00Z",
  },
];

const DEFAULT_DATASHEETS: Record<string, string> = {
  "ESP32-WROOM-32U":
    "https://www.espressif.com/sites/default/files/documentation/esp32-wroom-32d_esp32-wroom-32u_datasheet_en.pdf",
  "ARD-UNO-R3-COMP":
    "https://docs.arduino.cc/resources/datasheets/A000066-datasheet.pdf",
  "OLED-096-I2C-BLU":
    "https://cdn-shop.adafruit.com/datasheets/SSD1306.pdf",
  "RES-KIT-30V-600":
    "https://www.vishay.com/docs/28729/cfrseries.pdf",
  "HC-SR04-ULTRA":
    "https://cdn.sparkfun.com/datasheets/Sensors/Proximity/HCSR04.pdf",
  "DHT22-SENSOR-MOD":
    "https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf",
  "L298N-DUAL-HBRIDGE":
    "https://www.st.com/resource/en/datasheet/l298.pdf",
  "NE555-DIP8-TIMER":
    "https://www.ti.com/lit/ds/symlink/ne555.pdf",
};

export function computeStockStatus(
  stock: number,
  minThreshold: number
): StockStatus {
  if (stock <= 0) return "out-of-stock";
  if (stock <= minThreshold) return "low-stock";
  return "in-stock";
}

function createInitialProducts(): AdminProductRecord[] {
  return MOCK_PRODUCTS.map((product) => {
    const minThreshold = DEFAULT_MIN_THRESHOLD;
    const status = computeStockStatus(product.stock, minThreshold);
    return {
      ...product,
      category: product.category,
      brand: product.brand || "Generic",
      minThreshold,
      status,
      shortDescription: product.label || `${product.name} module`,
      fullDescription:
        product.about ||
        `Industrial and academic grade ${product.name} component verified for OhmSim Region III fulfillment.`,
      datasheetUrl:
        DEFAULT_DATASHEETS[product.sku] ||
        `https://datasheets.ohmsim.ph/${product.sku.toLowerCase()}.pdf`,
      specs: product.specs ? { ...product.specs } : {},
      updatedAt: "2026-08-28T09:00:00Z",
    };
  });
}

const INITIAL_ADJUSTMENT_LOGS: StockAdjustmentLog[] = [
  {
    id: "adj-1",
    sku: "ESP32-WROOM-32U",
    productName: "Espressif ESP32-WROOM-32U Kit",
    type: "ADD",
    quantity: 50,
    previousStock: 92,
    newStock: 142,
    reason: "Restock Shipment",
    timestamp: "2026-08-27T15:20:00Z",
  },
  {
    id: "adj-2",
    sku: "DHT22-SENSOR-MOD",
    productName: "DHT22 Temp & Humidity Sensor Module",
    type: "REMOVE",
    quantity: 2,
    previousStock: 10,
    newStock: 8,
    reason: "Damaged / Defective",
    timestamp: "2026-08-28T11:10:00Z",
  },
];

interface AdminCatalogState {
  products: AdminProductRecord[];
  categories: AdminCategoryRecord[];
  adjustmentLogs: StockAdjustmentLog[];
}

let storeState: AdminCatalogState = {
  products: createInitialProducts(),
  categories: [...INITIAL_ADMIN_CATEGORIES],
  adjustmentLogs: [...INITIAL_ADJUSTMENT_LOGS],
};

const SERVER_SNAPSHOT: AdminCatalogState = storeState;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAdminCatalog(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminCatalogSnapshot(): AdminCatalogState {
  return storeState;
}

export function getAdminCatalogServerSnapshot(): AdminCatalogState {
  return SERVER_SNAPSHOT;
}

export function useAdminCatalogStore(): AdminCatalogState {
  return useSyncExternalStore(
    subscribeAdminCatalog,
    getAdminCatalogSnapshot,
    getAdminCatalogServerSnapshot
  );
}

export interface UpsertAdminProductInput {
  id?: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  minThreshold: number;
  shortDescription: string;
  fullDescription: string;
  datasheetUrl: string;
  image?: string;
  specs: Record<string, string>;
}

export function upsertAdminProduct(
  input: UpsertAdminProductInput
): AdminProductRecord {
  const normalizedStock = Math.max(0, Math.round(input.stock));
  const normalizedThreshold = Math.max(0, Math.round(input.minThreshold));
  const normalizedPrice = Math.max(0, Number(input.price) || 0);
  const status = computeStockStatus(normalizedStock, normalizedThreshold);
  const now = new Date().toISOString();

  const existingIndex = input.id
    ? storeState.products.findIndex((p) => p.id === input.id)
    : -1;

  if (existingIndex >= 0) {
    const existing = storeState.products[existingIndex];
    const updated: AdminProductRecord = {
      ...existing,
      sku: input.sku.trim().toUpperCase(),
      name: input.name.trim(),
      brand: input.brand.trim() || "Generic",
      category: input.category,
      label: input.shortDescription.trim() || input.name.trim(),
      shortDescription: input.shortDescription.trim() || input.name.trim(),
      fullDescription: input.fullDescription.trim(),
      about: input.fullDescription.trim(),
      price: normalizedPrice,
      stock: normalizedStock,
      minThreshold: normalizedThreshold,
      status,
      datasheetUrl: input.datasheetUrl.trim(),
      image: input.image?.trim() || existing.image,
      specs: { ...input.specs },
      updatedAt: now,
    };

    const nextProducts = [...storeState.products];
    nextProducts[existingIndex] = updated;
    storeState = {
      ...storeState,
      products: nextProducts,
    };
    emitChange();
    return updated;
  }

  const newProduct: AdminProductRecord = {
    id: `prod-${Date.now()}`,
    sku: input.sku.trim().toUpperCase(),
    name: input.name.trim(),
    brand: input.brand.trim() || "Generic",
    category: input.category,
    label: input.shortDescription.trim() || input.name.trim(),
    shortDescription: input.shortDescription.trim() || input.name.trim(),
    fullDescription: input.fullDescription.trim(),
    about: input.fullDescription.trim(),
    price: normalizedPrice,
    voltage: 5,
    resistance: null,
    stock: normalizedStock,
    minThreshold: normalizedThreshold,
    status,
    datasheetUrl:
      input.datasheetUrl.trim() ||
      `https://datasheets.ohmsim.ph/${input.sku.trim().toLowerCase()}.pdf`,
    image:
      input.image?.trim() ||
      "https://images.unsplash.com/photo-1634452015397-ad0686a2ae2d?w=400&h=300&fit=crop&auto=format",
    specs: { ...input.specs },
    updatedAt: now,
  };

  storeState = {
    ...storeState,
    products: [newProduct, ...storeState.products],
  };
  emitChange();
  return newProduct;
}

export interface CreateAdminCategoryInput {
  name: string;
  slug: string;
  icon: AdminCategoryIconKey;
  description: string;
}

export function addAdminCategory(
  input: CreateAdminCategoryInput
): AdminCategoryRecord {
  const newCategory: AdminCategoryRecord = {
    id: `cat-${Date.now()}`,
    name: input.name.trim(),
    slug:
      input.slug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "") || "custom-category",
    icon: input.icon,
    description: input.description.trim(),
    createdAt: new Date().toISOString(),
  };

  storeState = {
    ...storeState,
    categories: [...storeState.categories, newCategory],
  };
  emitChange();
  return newCategory;
}

export function adjustAdminProductStock(params: {
  productId: string;
  type: StockAdjustmentType;
  quantity: number;
  reason: StockAdjustmentReason;
}): {
  product: AdminProductRecord;
  log: StockAdjustmentLog;
} | null {
  const targetIndex = storeState.products.findIndex(
    (p) => p.id === params.productId
  );
  if (targetIndex < 0) return null;

  const target = storeState.products[targetIndex];
  const delta = Math.max(1, Math.round(params.quantity));
  const previousStock = target.stock;
  const newStock =
    params.type === "ADD"
      ? previousStock + delta
      : Math.max(0, previousStock - delta);

  const nextStatus = computeStockStatus(newStock, target.minThreshold);
  const now = new Date().toISOString();

  const updatedProduct: AdminProductRecord = {
    ...target,
    stock: newStock,
    status: nextStatus,
    updatedAt: now,
  };

  const newLog: StockAdjustmentLog = {
    id: `adj-${Date.now()}`,
    sku: target.sku,
    productName: target.name,
    type: params.type,
    quantity: delta,
    previousStock,
    newStock,
    reason: params.reason,
    timestamp: now,
  };

  const nextProducts = [...storeState.products];
  nextProducts[targetIndex] = updatedProduct;

  storeState = {
    ...storeState,
    products: nextProducts,
    adjustmentLogs: [newLog, ...storeState.adjustmentLogs],
  };
  emitChange();

  return { product: updatedProduct, log: newLog };
}

export function resetAdminCatalogStore(): void {
  storeState = {
    products: createInitialProducts(),
    categories: [...INITIAL_ADMIN_CATEGORIES],
    adjustmentLogs: [...INITIAL_ADJUSTMENT_LOGS],
  };
  emitChange();
}

