/**
 * OhmSim Canonical Product, BOM, and Cart Types
 * Coordinated shared types for Buyer and Administrator frontends.
 */

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type Category =
  | "All"
  | "Microcontrollers"
  | "Sensors"
  | "ICs"
  | "Development Boards"
  | "Passive";

export type ProductSortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "stock-desc";

export interface Product {
  id: string;
  sku: string;
  category: Exclude<Category, "All">;
  label: string;
  name: string;
  price: number;
  voltage: number;
  resistance: number | null;
  stock: number;
  status: StockStatus;
  image: string;
  brand?: string;
  images?: string[];
  specs?: Record<string, string>;
  about?: string;
}

export interface BomLineItem {
  productId: string;
  qty: number;
}

export interface BomProject {
  id: string;
  name: string;
  lineItems: BomLineItem[];
}

export interface CartBundle {
  id: string;
  bomId: string;
  bomName: string;
  items: { productId: string; qty: number }[];
}
