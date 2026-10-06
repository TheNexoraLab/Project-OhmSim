"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useRef } from "react";
import type { CartBundle } from "@/types/product";
import { getProductByIdSync } from "@/services/catalog-service";
import { toast } from "@/components/ui/toast";

export interface CartContextValue {
  cart: Record<string, number>;
  cartBundles: CartBundle[];
  addToCart: (productId: string, qty?: number) => boolean;
  setCartQty: (productId: string, qty: number) => boolean;
  removeFromCart: (productId: string) => void;
  addBundleToCart: (
    bomId: string,
    bomName: string,
    items: { productId: string; qty: number }[]
  ) => boolean;
  removeBundleFromCart: (bundleId: string) => void;
  setBundleItemQty: (bundleId: string, productId: string, qty: number) => boolean;
  clearCart: () => void;
  cartTotal: number;
  cartSubtotal: number;
  deliveryFee: number;
  totalAmount: number;
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

  // Actions update these refs immediately, so multiple calls in one React batch
  // validate against the latest accepted quantities before the next render.
  const cartRef = useRef<Record<string, number>>(cart);
  const bundlesRef = useRef<CartBundle[]>(cartBundles);

  const getRemainingStock = useCallback(
    (productId: string): number => {
      const product = getCartProduct(productId);
      if (!product) return 0;

      const inBundles = bundlesRef.current.reduce((sum, b) => {
        const item = b.items.find((i) => i.productId === product.id);
        return sum + (item ? item.qty : 0);
      }, 0);
      const currentInCart = (cartRef.current[product.id] ?? 0) + inBundles;
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

      const remaining = getRemainingStock(product.id);
      return qty <= remaining;
    },
    [getRemainingStock]
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

      // 3. Validate canonical stock
      if (product.stock <= 0) {
        toast(`${product.name || "Product"} is currently out of stock`, "error");
        return false;
      }

      const productId = product.id;
      const remaining = getRemainingStock(productId);

      if (remaining <= 0) {
        toast(
          `Cannot add more: maximum available stock reached (${product.stock} max)`,
          "warning"
        );
        return false;
      }

      if (qty > remaining) {
        const currentTotal = product.stock - remaining;
        toast(
          `Cannot add ${qty} units. Only ${remaining} available in stock (${currentTotal} already in cart/bundles).`,
          "warning"
        );
        return false;
      }

      const currentStandalone = cartRef.current[productId] ?? 0;
      const nextCart = {
        ...cartRef.current,
        [productId]: currentStandalone + qty,
      };
      cartRef.current = nextCart;
      setCart(nextCart);

      toast(`Added ${qty > 1 ? `${qty}× ` : ""}${product.name} to cart`, "success");
      return true;
    },
    [getRemainingStock]
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

      // Check remaining stock considering bundles
      const inBundles = bundlesRef.current.reduce((sum, b) => {
        const item = b.items.find((i) => i.productId === productId);
        return sum + (item ? item.qty : 0);
      }, 0);
      const maxForStandalone = Math.max(0, product.stock - inBundles);

      if (qty > maxForStandalone) {
        const next = {
          ...cartRef.current,
          [productId]: maxForStandalone,
        };
        cartRef.current = next;
        setCart(next);
        toast(
          `Quantity capped at remaining available stock (${maxForStandalone} units)`,
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

  const addBundleToCart = useCallback(
    (
      bomId: string,
      bomName: string,
      items: { productId: string; qty: number }[]
    ): boolean => {
      if (!items || items.length === 0) {
        toast("Cannot transfer empty BOM project", "warning");
        return false;
      }

      // Validate stock for all items in the bundle before committing
      for (const item of items) {
        const product = getCartProduct(item.productId);
        if (!product) {
          toast(`Component ${item.productId} not found`, "error");
          return false;
        }
        const remaining = getRemainingStock(product.id);
        if (item.qty > remaining) {
          toast(
            `Cannot transfer bundle: insufficient stock for ${product.name} (needs ${item.qty}, only ${remaining} available)`,
            "warning"
          );
          return false;
        }
      }

      const bundleId = `bundle-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newBundle: CartBundle = {
        id: bundleId,
        bomId,
        bomName,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      };

      const nextBundles = [...bundlesRef.current, newBundle];
      bundlesRef.current = nextBundles;
      setCartBundles(nextBundles);

      const totalItems = items.reduce((s, i) => s + i.qty, 0);
      toast(`Transferred ${totalItems} components from "${bomName}" to cart!`, "success");
      return true;
    },
    [getRemainingStock]
  );

  // Pure non-destructive bundle removal: removes ONLY the bundle, leaves standalone items untouched
  const removeBundleFromCart = useCallback((bundleId: string) => {
    const target = bundlesRef.current.find((b) => b.id === bundleId);
    const nextBundles = bundlesRef.current.filter((b) => b.id !== bundleId);
    bundlesRef.current = nextBundles;
    setCartBundles(nextBundles);
    if (target) {
      toast(`Removed BOM bundle "${target.bomName}"`, "info");
    }
  }, []);

  const setBundleItemQty = useCallback(
    (bundleId: string, productId: string, qty: number): boolean => {
      const bundle = bundlesRef.current.find((b) => b.id === bundleId);
      if (!bundle) return false;

      const product = getCartProduct(productId);
      if (!product) return false;

      if (qty <= 0) {
        // Remove item from bundle
        const updatedItems = bundle.items.filter((i) => i.productId !== productId);
        if (updatedItems.length === 0) {
          // If bundle has no items left, remove bundle
          removeBundleFromCart(bundleId);
        } else {
          const nextBundles = bundlesRef.current.map((b) =>
            b.id === bundleId ? { ...b, items: updatedItems } : b
          );
          bundlesRef.current = nextBundles;
          setCartBundles(nextBundles);
        }
        return true;
      }

      // Check stock limit for this product
      const inOtherBundles = bundlesRef.current.reduce((sum, b) => {
        if (b.id === bundleId) return sum;
        const item = b.items.find((i) => i.productId === productId);
        return sum + (item ? item.qty : 0);
      }, 0);
      const inStandalone = cartRef.current[productId] ?? 0;
      const maxAvailableForThisBundle = Math.max(0, product.stock - (inOtherBundles + inStandalone));

      const finalQty = Math.min(qty, maxAvailableForThisBundle);

      const nextBundles = bundlesRef.current.map((b) => {
        if (b.id !== bundleId) return b;
        return {
          ...b,
          items: b.items.map((i) =>
            i.productId === productId ? { ...i, qty: finalQty } : i
          ),
        };
      });
      bundlesRef.current = nextBundles;
      setCartBundles(nextBundles);

      if (qty > maxAvailableForThisBundle) {
        toast(`Quantity capped at maximum available stock (${maxAvailableForThisBundle})`, "warning");
      }
      return true;
    },
    [removeBundleFromCart]
  );

  const clearCart = useCallback(() => {
    cartRef.current = {};
    bundlesRef.current = [];
    setCart({});
    setCartBundles([]);
    toast("Cart cleared", "info");
  }, []);

  // Total unit count across standalone + bundles
  const cartTotal = useMemo(() => {
    const standaloneCount = Object.values(cart).reduce((sum, q) => sum + q, 0);
    const bundleCount = cartBundles.reduce(
      (sum, b) => sum + b.items.reduce((bs, i) => bs + i.qty, 0),
      0
    );
    return standaloneCount + bundleCount;
  }, [cart, cartBundles]);

  // Subtotal in PHP across standalone + bundles
  const cartSubtotal = useMemo(() => {
    const standaloneSubtotal = Object.entries(cart).reduce((sum, [id, qty]) => {
      const p = getProductByIdSync(id);
      return sum + (p ? p.price * qty : 0);
    }, 0);

    const bundleSubtotal = cartBundles.reduce((sum, b) => {
      return (
        sum +
        b.items.reduce((bs, { productId, qty }) => {
          const p = getProductByIdSync(productId);
          return bs + (p ? p.price * qty : 0);
        }, 0)
      );
    }, 0);

    return standaloneSubtotal + bundleSubtotal;
  }, [cart, cartBundles]);

  // Delivery fee per BR-046: ₱0 if >= ₱1,000, ₱80 if < ₱1,000; ₱0 if cart is empty
  const deliveryFee = useMemo(() => {
    if (cartSubtotal <= 0) return 0;
    return cartSubtotal >= 1000 ? 0 : 80;
  }, [cartSubtotal]);

  const totalAmount = useMemo(() => {
    return cartSubtotal + deliveryFee;
  }, [cartSubtotal, deliveryFee]);

  const value = useMemo(
    () => ({
      cart,
      cartBundles,
      addToCart,
      setCartQty,
      removeFromCart,
      addBundleToCart,
      removeBundleFromCart,
      setBundleItemQty,
      clearCart,
      cartTotal,
      cartSubtotal,
      deliveryFee,
      totalAmount,
      getRemainingStock,
      canAddToCart,
    }),
    [
      cart,
      cartBundles,
      addToCart,
      setCartQty,
      removeFromCart,
      addBundleToCart,
      removeBundleFromCart,
      setBundleItemQty,
      clearCart,
      cartTotal,
      cartSubtotal,
      deliveryFee,
      totalAmount,
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
