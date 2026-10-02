"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { Product, CartBundle } from "@/types/product";
import { getProductByIdSync } from "@/services/catalog-service";
import { toast } from "@/components/ui/toast";

export interface CartContextValue {
  cart: Record<string, number>;
  cartBundles: CartBundle[];
  addToCart: (productOrId: string | Product, qty?: number) => boolean;
  setCartQty: (productOrId: string | Product, qty: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  getRemainingStock: (productOrId: string | Product) => number;
  canAddToCart: (productOrId: string | Product, qty?: number) => boolean;
}

export function executeCartOperation(
  action:
    | { type: "add"; product: Product | string; qty?: number }
    | { type: "set"; product: Product | string; qty: number }
    | { type: "remove"; productId: string }
    | { type: "clear" },
  currentCart: Record<string, number>
): { ok: boolean; nextCart: Record<string, number>; reason?: string } {
  if (action.type === "clear") {
    return { ok: true, nextCart: {} };
  }
  if (action.type === "remove") {
    const next = { ...currentCart };
    delete next[action.productId];
    return { ok: true, nextCart: next };
  }

  const product =
    typeof action.product === "object" && action.product !== null
      ? action.product
      : typeof action.product === "string" && action.product.trim()
      ? getProductByIdSync(action.product.trim())
      : undefined;

  if (!product || !product.id || typeof product.id !== "string") {
    return { ok: false, nextCart: currentCart, reason: "invalid-id" };
  }

  if (action.type === "add") {
    const qty = action.qty ?? 1;
    if (!Number.isInteger(qty) || qty <= 0) {
      return { ok: false, nextCart: currentCart, reason: "invalid-qty" };
    }
    if (product.stock <= 0) {
      return { ok: false, nextCart: currentCart, reason: "out-of-stock" };
    }
    const current = currentCart[product.id] ?? 0;
    const remaining = product.stock - current;
    if (current >= product.stock || qty > remaining) {
      return { ok: false, nextCart: currentCart, reason: "overstock" };
    }
    return {
      ok: true,
      nextCart: { ...currentCart, [product.id]: current + qty },
    };
  }

  if (action.type === "set") {
    const qty = action.qty;
    if (!Number.isInteger(qty) || qty < 0) {
      return { ok: false, nextCart: currentCart, reason: "invalid-qty" };
    }
    if (qty === 0) {
      const next = { ...currentCart };
      delete next[product.id];
      return { ok: true, nextCart: next };
    }
    const capped = Math.min(qty, product.stock);
    return {
      ok: true,
      nextCart: { ...currentCart, [product.id]: capped },
    };
  }

  return { ok: false, nextCart: currentCart };
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartBundles, setCartBundles] = useState<CartBundle[]>([]);

  // Synchronized ref tracking immediate committed in-memory state across queued calls in the same tick
  const cartRef = React.useRef<Record<string, number>>(cart);
  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const getProduct = useCallback((productOrId: string | Product): Product | undefined => {
    if (typeof productOrId === "object" && productOrId !== null) {
      return productOrId;
    }
    if (typeof productOrId === "string" && productOrId.trim()) {
      return getProductByIdSync(productOrId.trim());
    }
    return undefined;
  }, []);

  const getRemainingStock = useCallback(
    (productOrId: string | Product): number => {
      const product = getProduct(productOrId);
      if (!product || !product.id) return 0;
      const currentInCart = cartRef.current[product.id] ?? 0;
      return Math.max(0, product.stock - currentInCart);
    },
    [getProduct]
  );

  const canAddToCart = useCallback(
    (productOrId: string | Product, qty: number = 1): boolean => {
      const product = getProduct(productOrId);
      if (!product || !product.id || typeof product.id !== "string") return false;
      if (!Number.isInteger(qty) || qty <= 0) return false;
      if (product.stock <= 0) return false;
      const currentInCart = cartRef.current[product.id] ?? 0;
      return currentInCart + qty <= product.stock;
    },
    [getProduct]
  );

  const addToCart = useCallback(
    (productOrId: string | Product, qty: number = 1): boolean => {
      // 1. Validate Product
      const product = getProduct(productOrId);
      if (!product || !product.id || typeof product.id !== "string") {
        toast("Invalid product specified", "error");
        return false;
      }

      // 2. Validate Positive Integer Quantity
      if (!Number.isInteger(qty) || qty <= 0) {
        toast("Quantity must be a positive integer", "error");
        return false;
      }

      // 3. Validate Stock Boundary (including synthetic stock-zero fixture)
      if (product.stock <= 0) {
        toast(`${product.name || "Product"} is currently out of stock`, "error");
        return false;
      }

      const productId = product.id;
      // Read atomically from latest in-memory cart state
      const currentInCart = cartRef.current[productId] ?? 0;
      const remaining = product.stock - currentInCart;

      if (currentInCart >= product.stock) {
        toast(
          `Cannot add more: maximum available stock reached (${product.stock} max)`,
          "warning"
        );
        return false;
      }

      if (qty > remaining) {
        toast(
          `Cannot add ${qty} units. Only ${remaining} available in stock (${currentInCart} already in cart).`,
          "warning"
        );
        return false;
      }

      const newQty = currentInCart + qty;
      const nextCart = {
        ...cartRef.current,
        [productId]: newQty,
      };
      cartRef.current = nextCart;
      setCart(nextCart);

      toast(`Added ${qty > 1 ? `${qty}× ` : ""}${product.name} to cart`, "success");
      return true;
    },
    [getProduct]
  );

  const setCartQty = useCallback(
    (productOrId: string | Product, qty: number): boolean => {
      const product = getProduct(productOrId);
      if (!product || !product.id || typeof product.id !== "string") {
        toast("Invalid product specified", "error");
        return false;
      }

      if (!Number.isInteger(qty) || qty < 0) {
        toast("Quantity must be a non-negative integer", "error");
        return false;
      }

      const productId = product.id;

      if (qty === 0) {
        const next = { ...cartRef.current };
        delete next[productId];
        cartRef.current = next;
        setCart(next);
        toast(`Removed ${product.name} from cart`, "info");
        return true;
      }

      if (qty > product.stock) {
        const next = {
          ...cartRef.current,
          [productId]: product.stock,
        };
        cartRef.current = next;
        setCart(next);
        toast(
          `Quantity capped at maximum available stock (${product.stock} units)`,
          "warning"
        );
        return true;
      }

      const next = {
        ...cartRef.current,
        [productId]: qty,
      };
      cartRef.current = next;
      setCart(next);
      return true;
    },
    [getProduct]
  );

  const removeFromCart = useCallback((productId: string) => {
    const next = { ...cartRef.current };
    delete next[productId];
    cartRef.current = next;
    setCart(next);
  }, []);

  const clearCart = useCallback(() => {
    cartRef.current = {};
    setCart({});
    setCartBundles([]);
  }, []);

  const cartTotal = useMemo(() => {
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      cartBundles,
      addToCart,
      setCartQty,
      removeFromCart,
      clearCart,
      cartTotal,
      getRemainingStock,
      canAddToCart,
    }),
    [
      cart,
      cartBundles,
      addToCart,
      setCartQty,
      removeFromCart,
      clearCart,
      cartTotal,
      getRemainingStock,
      canAddToCart,
    ]
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as unknown as { __ohmSimCart: unknown }).__ohmSimCart = {
        addToCart,
        setCartQty,
        removeFromCart,
        clearCart,
        getCart: () => cartRef.current,
        getCartTotal: () => Object.values(cartRef.current).reduce((s, q) => s + q, 0),
        getRemainingStock,
        canAddToCart,
      };
    }
  }, [addToCart, setCartQty, removeFromCart, clearCart, getRemainingStock, canAddToCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
