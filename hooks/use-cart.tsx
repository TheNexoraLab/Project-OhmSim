"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { CartBundle } from "@/types/product";
import { getProductByIdSync } from "@/services/catalog-service";
import { toast } from "@/components/ui/toast";

export interface CartContextValue {
  cart: Record<string, number>;
  cartBundles: CartBundle[];
  addToCart: (productId: string, qty?: number) => boolean;
  setCartQty: (productId: string, qty: number) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotal: number;
  getRemainingStock: (productId: string) => number;
  canAddToCart: (productId: string, qty?: number) => boolean;
}

// Runtime validation still applies to JS callers. Inventory comes only from the
// service, never from a caller-supplied Product object or stock value.
function getCartProduct(productId: string) {
  if (typeof productId !== "string" || !productId.trim()) return undefined;
  const product = getProductByIdSync(productId.trim());
  if (!product || !Number.isSafeInteger(product.stock) || product.stock < 0) {
    return undefined;
  }
  return product;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartBundles, setCartBundles] = useState<CartBundle[]>([]);

  // Actions update this ref immediately, so multiple calls in one React batch
  // validate against the latest accepted quantity before the next render.
  const cartRef = React.useRef<Record<string, number>>(cart);

  const getRemainingStock = useCallback(
    (productId: string): number => {
      const product = getCartProduct(productId);
      if (!product) return 0;
      const currentInCart = cartRef.current[product.id] ?? 0;
      return Math.max(0, product.stock - currentInCart);
    },
    []
  );

  const canAddToCart = useCallback(
    (productId: string, qty: number = 1): boolean => {
      const product = getCartProduct(productId);
      if (!product) return false;
      if (!Number.isSafeInteger(qty) || qty <= 0) return false;
      if (product.stock <= 0) return false;
      const currentInCart = cartRef.current[product.id] ?? 0;
      return currentInCart + qty <= product.stock;
    },
    []
  );

  const addToCart = useCallback(
    (requestedId: string, qty: number = 1): boolean => {
      // 1. Validate Product
      const product = getCartProduct(requestedId);
      if (!product) {
        toast("Invalid product specified", "error");
        return false;
      }

      // 2. Validate Positive Integer Quantity
      if (!Number.isSafeInteger(qty) || qty <= 0) {
        toast("Quantity must be a positive integer", "error");
        return false;
      }

      // 3. Validate canonical stock.
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
    []
  );

  const setCartQty = useCallback(
    (requestedId: string, qty: number): boolean => {
      const product = getCartProduct(requestedId);
      if (!product) {
        toast("Invalid product specified", "error");
        return false;
      }

      if (!Number.isSafeInteger(qty) || qty < 0) {
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

      if (product.stock === 0) {
        toast(`${product.name} is currently out of stock`, "error");
        return false;
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
    []
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

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
