import type { Product, Category, BomProject } from "@/types/product";
import { PRODUCTS, INITIAL_BOM_PROJECTS } from "@/lib/mocks/products";

/**
 * Catalog Service
 * Approved typed service boundary for Buyer catalog, product details, and search.
 * Currently backed by verified mock fixtures; can transition to backend APIs.
 */

export async function getProducts(): Promise<Product[]> {
  return getProductsSync();
}

export function getProductsSync(): Product[] {
  return [...PRODUCTS];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return getProductByIdSync(id);
}

export function getProductByIdSync(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export async function getFeaturedProducts(limit: number = 4): Promise<Product[]> {
  return getFeaturedProductsSync(limit);
}

export function getFeaturedProductsSync(limit: number = 4): Product[] {
  return PRODUCTS.slice(0, limit);
}

export async function getRelatedProducts(
  productId: string,
  category: string,
  limit: number = 4
): Promise<Product[]> {
  return getRelatedProductsSync(productId, category, limit);
}

export function getRelatedProductsSync(
  productId: string,
  category: string,
  limit: number = 4
): Product[] {
  return PRODUCTS.filter((p) => p.id !== productId && p.category === category).slice(0, limit);
}

export async function getCategories(): Promise<Category[]> {
  return getCategoriesSync();
}

export function getCategoriesSync(): Category[] {
  return [
    "All",
    "Microcontrollers",
    "Sensors",
    "ICs",
    "Development Boards",
    "Passive",
  ];
}

export function getInitialBomProjects(): BomProject[] {
  return JSON.parse(JSON.stringify(INITIAL_BOM_PROJECTS));
}

