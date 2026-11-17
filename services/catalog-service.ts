import type { Product, Category, BomProject, StockStatus } from "@/types/product";
import { PRODUCTS, INITIAL_BOM_PROJECTS } from "@/lib/mocks/products";

/**
 * Catalog Service
 * Approved typed service boundary for Buyer catalog, product details, and search.
 * Connects directly to OhmSim live backend APIs (/api/products, /api/categories)
 * with robust synchronous mock fallbacks for instant SSR/SSG and offline continuity.
 */

function parseVoltage(specs?: Record<string, string> | null, defaultVoltage = 5): number {
  if (!specs) return defaultVoltage;
  const val = specs["Operating Voltage"] || specs["Voltage"] || specs["voltage"];
  if (val) {
    const match = String(val).match(/([\d.]+)/);
    if (match) return parseFloat(match[1]);
  }
  return defaultVoltage;
}

function parseResistance(specs?: Record<string, string> | null): number | null {
  if (!specs) return null;
  const val = specs["Resistance"] || specs["resistance"];
  if (val) {
    const match = String(val).match(/([\d.]+)/);
    if (match) return parseFloat(match[1]);
  }
  return null;
}

interface RawApiProduct {
  id: string;
  sku: string;
  name: string;
  label?: string;
  brand?: string;
  category: string;
  price: number | string;
  stock?: number;
  stockQuantity?: number;
  status?: StockStatus;
  minThreshold?: number;
  minStockThreshold?: number;
  image?: string;
  images?: string[];
  imageUrls?: string[];
  specs?: Record<string, string>;
  specifications?: Record<string, string>;
  about?: string;
  fullDescription?: string;
  shortDescription?: string;
  voltage?: number;
  resistance?: number | null;
}

const LIVE_PRODUCT_CACHE = new Map<string, Product>();

export function mapApiProductToProduct(raw: RawApiProduct): Product {
  const specs = raw.specs || raw.specifications || {};
  const stock = typeof raw.stock === "number" ? raw.stock : (typeof raw.stockQuantity === "number" ? raw.stockQuantity : 0);
  const minThreshold = raw.minThreshold ?? raw.minStockThreshold ?? 15;
  const status: StockStatus = raw.status || (stock <= 0 ? "out-of-stock" : stock <= minThreshold ? "low-stock" : "in-stock");
  const price = typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price)) || 0;
  const image = raw.image || (raw.images && raw.images[0]) || (raw.imageUrls && raw.imageUrls[0]) || "/images/placeholder.jpg";
  const images = raw.images || raw.imageUrls || [image];

  const product: Product = {
    id: raw.id,
    sku: raw.sku,
    category: (raw.category as Exclude<Category, "All">) || "Microcontrollers",
    label: raw.label || raw.name,
    name: raw.name,
    price,
    voltage: typeof raw.voltage === "number" ? raw.voltage : parseVoltage(specs),
    resistance: typeof raw.resistance === "number" || raw.resistance === null ? raw.resistance : parseResistance(specs),
    stock,
    status,
    image,
    brand: raw.brand || "Generic",
    images,
    specs,
    about: raw.about || raw.fullDescription || raw.shortDescription || raw.name,
  };

  LIVE_PRODUCT_CACHE.set(product.id, product);
  if (product.sku) {
    LIVE_PRODUCT_CACHE.set(product.sku.toLowerCase(), product);
  }

  return product;
}

export async function getProducts(options?: {
  category?: string;
  search?: string;
  limit?: number;
  baseUrl?: string;
}): Promise<Product[]> {
  try {
    const isBrowser = typeof window !== "undefined";
    const base = options?.baseUrl || (isBrowser ? "" : null);

    if (base !== null) {
      const searchParams = new URLSearchParams();
      if (options?.category && options.category !== "All") searchParams.set("category", options.category);
      if (options?.search) searchParams.set("search", options.search);
      searchParams.set("limit", String(options?.limit || 300));
      const qs = searchParams.toString();
      const url = `${base}/api/products${qs ? `?${qs}` : ""}`;

      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          const mapped = data.products.map(mapApiProductToProduct);
          mapped.forEach((p: Product) => {
            LIVE_PRODUCT_CACHE.set(p.id, p);
            LIVE_PRODUCT_CACHE.set(p.sku.toLowerCase(), p);
          });
          return mapped;
        }
      }
    }
  } catch {
    // Graceful fallback to verified synchronous fixture
  }

  return getProductsSync();
}

export function getProductsSync(): Product[] {
  return [...PRODUCTS];
}

export async function getProductById(id: string, options?: { baseUrl?: string }): Promise<Product | undefined> {
  if (!id) return undefined;

  // On the server: query database directly with resilient fallback
  if (typeof window === "undefined") {
    try {
      const { prisma } = await import("@/lib/prisma/client");
      const dbProduct = await prisma.product.findFirst({
        where: {
          OR: [{ id }, { sku: id.toUpperCase() }, { sku: id }],
        },
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      if (dbProduct) {
        return mapApiProductToProduct({
          id: dbProduct.id,
          sku: dbProduct.sku,
          name: dbProduct.name,
          label: dbProduct.name,
          brand: dbProduct.brand,
          category: dbProduct.category.name,
          price: Number(dbProduct.price),
          stock: dbProduct.stockQuantity,
          minThreshold: dbProduct.minStockThreshold,
          image: dbProduct.imageUrls[0] || "/images/placeholder.jpg",
          images: dbProduct.imageUrls,
          specs: (dbProduct.specifications as Record<string, string>) || {},
          about: dbProduct.fullDescription,
        });
      }
    } catch {
      // Continue to fixture lookup
    }
  } else {
    // In the browser: query API endpoint
    try {
      const base = options?.baseUrl || "";
      const url = `${base}/api/products/${encodeURIComponent(id)}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.product) {
          return mapApiProductToProduct(data.product);
        }
      }
    } catch {
      // Fallback to synchronous resolver
    }
  }

  return getProductByIdSync(id);
}

export function getProductByIdSync(id: string): Product | undefined {
  if (!id) return undefined;
  const trimmed = id.trim();
  const lower = trimmed.toLowerCase();

  // 1. Check live cache first
  const cached = LIVE_PRODUCT_CACHE.get(trimmed) || LIVE_PRODUCT_CACHE.get(lower);
  if (cached) return cached;

  // 2. Direct match in PRODUCTS by id or sku
  const direct = PRODUCTS.find((p) => p.id === trimmed || p.sku.toLowerCase() === lower);
  if (direct) return direct;

  // 3. Fallback: match in PRODUCTS by name or partial sku
  return PRODUCTS.find((p) => p.name.toLowerCase() === lower || p.sku.toLowerCase().includes(lower));
}

export async function getFeaturedProducts(limit: number = 4, options?: { baseUrl?: string }): Promise<Product[]> {
  try {
    const isBrowser = typeof window !== "undefined";
    const base = options?.baseUrl || (isBrowser ? "" : null);

    if (base !== null) {
      const url = `${base}/api/products?isFeatured=true&limit=${limit}`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          return data.products.map(mapApiProductToProduct);
        }
      }
    }
  } catch {
    // Fall back
  }

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

export async function getCategories(options?: { baseUrl?: string }): Promise<Category[]> {
  try {
    const isBrowser = typeof window !== "undefined";
    const base = options?.baseUrl || (isBrowser ? "" : null);

    if (base !== null) {
      const url = `${base}/api/categories`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const names = data.categories.map((c: { name: string }) => c.name);
          return ["All", ...names] as Category[];
        }
      }
    }
  } catch {
    // Fall back
  }

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
